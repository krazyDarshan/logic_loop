import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-sans", subsets: ["latin"] });
const dmSerif = DM_Serif_Display({ variable: "--font-serif", subsets: ["latin"], weight: "400" });

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost:3000";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  return {
    metadataBase: new URL(origin),
    title: "SkillNova — AI Talent Intelligence",
    description: "Secure candidate and recruiter workspaces for verified talent profiles, explainable job matches, skill gaps, and evidence-led hiring.",
    openGraph: {
      title: "SkillNova — Proof over paperwork.",
      description: "Candidate profiles, ranked job matches, skill verification, and recruiter intelligence built on real evidence.",
      type: "website",
      images: [{ url: `${origin}/og.png`, width: 1731, height: 909, alt: "SkillNova AI Talent Intelligence" }],
    },
    twitter: { card: "summary_large_image", title: "SkillNova — Proof over paperwork.", description: "AI talent intelligence built on real evidence.", images: [`${origin}/og.png`] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${dmSans.variable} ${dmSerif.variable}`}>{children}</body></html>;
}
