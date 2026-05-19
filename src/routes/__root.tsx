import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";

import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Corporate Sharks Chess — Master the Boardroom" },
      { name: "description", content: "Strategic chess for executives. Corporate-themed pieces, AI coach, leaderboards." },
      { property: "og:title", content: "Corporate Sharks Chess — Master the Boardroom" },
      { property: "og:description", content: "Strategic chess for executives. Corporate-themed pieces, AI coach, leaderboards." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Corporate Sharks Chess — Master the Boardroom" },
      { name: "twitter:description", content: "Strategic chess for executives. Corporate-themed pieces, AI coach, leaderboards." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/cc9e7486-ebe8-4fb1-921f-d5ec1ac3e220/id-preview-1ddc2b7f--110b23a9-326b-44e2-8363-478bfb6a284a.lovable.app-1779201388225.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/cc9e7486-ebe8-4fb1-921f-d5ec1ac3e220/id-preview-1ddc2b7f--110b23a9-326b-44e2-8363-478bfb6a284a.lovable.app-1779201388225.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <Outlet />
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
