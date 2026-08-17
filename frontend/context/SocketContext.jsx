import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

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

export function useSocket() {
  const ctx = useContext(SocketContext);

  if (!ctx) {
    throw new Error("useSocket must be used inside <SocketProvider>");
  }

  return ctx;
}