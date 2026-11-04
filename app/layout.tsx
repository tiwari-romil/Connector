import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { siteOrigin } from "./site";

const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  // Never X-Forwarded-Host/-Proto: the client sets those, so they could point the links elsewhere.
  const base = siteOrigin((await headers()).get("host"));
  const title = "Connector — Learning Adventure for Kids";
  const description = "A voice-guided learning game for ages 4–6: adaptive picture puzzles, maths with rods and blocks, science quizzes and olympiad-style practice papers.";

  return {
    metadataBase: base,
    title,
    description,
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: { title, description, type: "website", images: [{ url: "/og.png", width: 1736, height: 907, alt: "Connector learning game" }] },
    twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={nunito.variable}>{children}</body></html>;
}
