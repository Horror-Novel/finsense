import "../styles/globals.css";
import Head from "next/head";
import { AuthProvider } from "../context/AuthContext";
import { SocketProvider } from "../context/SocketContext";
import Navbar from "../components/Navbar";

// _app.js wraps every page — this is where global providers live.
// Unlike _document.js (server-only), this runs both on the server
// (for SSR/SSG initial render) and in the browser (for client-side
// navigation between pages), so it's the right place for React context.
export default function App({ Component, pageProps }) {
  // Some pages opt out of the shared layout (e.g. the Landing page
  // manages its own full-screen hero). Pages set `getLayout` to override.
  const getLayout = Component.getLayout ?? ((page) => (
    <>
      <Navbar />
      <main>{page}</main>
    </>
  ));

  return (
    <AuthProvider initialUser={pageProps.user ?? null}>
      <Head>
        <title>FinSense</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SocketProvider>
        {getLayout(<Component {...pageProps} />)}
      </SocketProvider>
    </AuthProvider>
  );
}
