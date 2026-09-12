import type { Metadata } from "next";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "ThreadsDNA — See what your Threads account is made of",
    template: "%s · ThreadsDNA",
  },
  description:
    "Connect Threads and get a shareable creator DNA report across conversation, originality, authority, consistency, and virality.",
  openGraph: {
    title: "ThreadsDNA",
    description: "See what your Threads account is made of.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
