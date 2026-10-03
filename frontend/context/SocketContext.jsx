import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import api from "../lib/api";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("finsense_token")
        : null;

    if (!user || !token) {
      socketRef.current?.disconnect?.();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    // Vercel's serverless backend can't hold WebSocket connections, so there
    // live sync goes through Pusher instead (when the API has it configured),
    // unless NEXT_PUBLIC_SOCKET_URL points at a Socket.io server elsewhere.
    const onVercel =
      Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV) && !process.env.NEXT_PUBLIC_SOCKET_URL;
    if (onVercel) return connectPusher(user, socketRef, setConnected);

    let socket;

    import("socket.io-client").then(({ io }) => {
      // Browser connects directly to the backend Socket.IO server.
      const socketUrl =
        process.env.NEXT_PUBLIC_SOCKET_URL ||
        (typeof window !== "undefined"
          ? `${window.location.protocol}//${window.location.hostname}:5000`
          : "http://localhost:5000");

      socket = io(socketUrl, {
        path: "/socket.io",
        auth: { token },
        transports: ["websocket", "polling"],
      });

      socket.on("connect", () => {
        console.log("🟢 FinSense WebSocket connected");
        setConnected(true);
      });

      socket.on("disconnect", () => {
        console.log("🔴 FinSense WebSocket disconnected");
        setConnected(false);
      });

      socket.on("connect_error", (error) => {
        console.error("WebSocket connection error:", error.message);
        setConnected(false);
      });

      socketRef.current = socket;
    });

    return () => {
      socket?.disconnect();
      socketRef.current?.disconnect?.();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

// Subscribes to this user's private Pusher channel and exposes it through
// the same on/off/disconnect shape as a Socket.io socket, so pages that
// listen for transaction events work unchanged.
function connectPusher(user, socketRef, setConnected) {
  let cancelled = false;
  let client = null;

  (async () => {
    try {
      const { data } = await api.get("/realtime/config");
      if (cancelled || data.data?.provider !== "pusher") return;

      const { default: Pusher } = await import("pusher-js");
      if (cancelled) return;

      client = new Pusher(data.data.key, {
        cluster: data.data.cluster,
        channelAuthorization: {
          customHandler: ({ socketId, channelName }, callback) => {
            api
              .post("/realtime/auth", { socket_id: socketId, channel_name: channelName })
              .then((res) => callback(null, res.data))
              .catch((err) => callback(err, null));
          },
        },
      });

      const channel = client.subscribe(`private-user-${user.id}`);
      channel.bind("pusher:subscription_succeeded", () => setConnected(true));
      channel.bind("pusher:subscription_error", () => setConnected(false));
      client.connection.bind("state_change", ({ current }) => {
        if (current !== "connected") setConnected(false);
        else if (channel.subscribed) setConnected(true);
      });

      socketRef.current = {
        on: (event, handler) => channel.bind(event, handler),
        off: (event, handler) => channel.unbind(event, handler),
        disconnect: () => client.disconnect(),
      };
    } catch (err) {
      console.error("Live sync unavailable:", err.message);
      setConnected(false);
    }
  })();

  return () => {
    cancelled = true;
    client?.disconnect();
    socketRef.current = null;
    setConnected(false);
  };
}

export function useSocket() {
  const ctx = useContext(SocketContext);

  if (!ctx) {
    throw new Error("useSocket must be used inside <SocketProvider>");
  }

  return ctx;
}