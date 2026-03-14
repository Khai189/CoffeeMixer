import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import Navbar from "./components/Navbar";
import { getUserId } from "./lib/session.server";
import { prisma } from "./lib/db.server";
import ChatBarista from "./components/ChatBarista";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

// Root loader — runs on every page, provides user data to the whole app
export async function loader({ request }: Route.LoaderArgs) {
  const userId = await getUserId(request);
  if (!userId) return { user: null };
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      profile: { select: { pfpUrl: true } },
    },
  });

  if (!user) return { user: null };

  const pfpUrl = user.profile?.pfpUrl || "/default-pfp.png";

  return {
    user: { ...user, profile: { pfpUrl } },
  };
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                window.addEventListener('load', () => {
                  setTimeout(() => {
                    const perf = performance.getEntriesByType('navigation')[0];
                    if (perf) {
                      console.log('🚀 Browser Performance:', {
                        'DNS': Math.round(perf.domainLookupEnd - perf.domainLookupStart) + 'ms',
                        'TCP': Math.round(perf.connectEnd - perf.connectStart) + 'ms',
                        'TTFB': Math.round(perf.responseStart - perf.requestStart) + 'ms',
                        'Download': Math.round(perf.responseEnd - perf.responseStart) + 'ms',
                        'DOM Parse': Math.round(perf.domContentLoadedEventEnd - perf.responseEnd) + 'ms',
                        'Resource Load': Math.round(perf.loadEventStart - perf.domContentLoadedEventEnd) + 'ms',
                        'Total': Math.round(perf.loadEventEnd - perf.fetchStart) + 'ms',
                        'DOM Interactive': Math.round(perf.domInteractive - perf.fetchStart) + 'ms',
                      });
                    }
                  }, 100);
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-amber-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      <Navbar user={loaderData.user} />
      <div id="main-content" className="pt-16">
        <Outlet />
      </div>
      <ChatBarista />
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
