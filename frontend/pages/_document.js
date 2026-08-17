import { Html, Head, Main, NextScript } from "next/document";

// _document.js runs ONLY on the server — it's the SSR wrapper for the
// outer HTML shell. This is where we put things that belong in <head>
// and need to be server-rendered for SEO / first-paint performance:
// - font preconnect + stylesheet links (avoids FOUT)
// - meta tags that search engines actually read
// - og: / twitter: tags for social sharing previews
//
// Nothing in here runs in the browser — for client-side logic, use _app.js.
export default function Document() {
  return (
    <Html lang="en" className="scroll-smooth">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="description" content="FinSense — AI-powered personal expense tracker. Log expenses in plain English, let AI categorize them, and chat with your own spending data." />
        <meta name="keywords" content="expense tracker, AI finance, budget, spending, personal finance" />
        <meta property="og:title" content="FinSense — AI Expense Tracker" />
        <meta property="og:description" content="Log expenses in plain English. Let AI categorize them. Ask your money anything." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body className="bg-paper text-ink">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
