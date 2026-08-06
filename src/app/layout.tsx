import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Scope Creep — AI Scope Protection",
    template: "%s | Scope Creep",
  },
  description:
    "AI-powered scope management middleware for freelancers and agencies. Extract tasks, lock SOW baselines, detect scope creep, and generate polite pushback emails.",
  keywords: ["scope management", "freelancer tools", "AI", "project management", "scope creep", "SaaS"],
  openGraph: {
    type: "website",
    title: "Scope Creep — AI Scope Management",
    description:
      "Turn messy client requests into clear scope. AI-powered task extraction, baseline protection, and professional email drafting.",
    siteName: "Scope Creep",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scope Creep — AI Scope Management",
    description: "Turn messy client requests into clear scope.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-purple-600 selection:text-white font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
