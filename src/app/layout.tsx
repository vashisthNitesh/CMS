import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "ClinicOS — AI-Powered Clinical Management",
    template: "%s | ClinicOS",
  },
  description:
    "Enterprise-grade clinical management SaaS with AI-powered visit context, smart scheduling, and real-time queue management.",
  metadataBase: new URL("https://clinicos.app"),
  openGraph: {
    title: "ClinicOS — AI-Powered Clinical Management",
    description: "Enterprise-grade clinical management SaaS.",
    type: "website",
    siteName: "ClinicOS",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClinicOS",
    description: "AI-Powered Clinical Management SaaS",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${jakarta.variable} ${jetbrainsMono.variable} antialiased font-sans`}>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={200}>
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
