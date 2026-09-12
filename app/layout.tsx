import type { Metadata } from "next";
import "./globals.css";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const themeScript = `
(() => {
  try {
    const saved = localStorage.getItem("threaddna-theme");

    const theme =
      saved === "light" || saved === "dark"
        ? saved
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {}
})();
`;

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "ThreadDNA — See what your Threads account is made of",
    template: "%s · ThreadDNA",
  },
  description:
    "Connect Threads and get a shareable creator DNA report across conversation, originality, authority, consistency, and virality.",
  openGraph: {
    title: "ThreadDNA",
    description: "See what your Threads account is made of.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeScript,
          }}
        />
      </head>

      <body>{children}</body>
    </html>
  );
}