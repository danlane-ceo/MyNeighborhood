import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Neighborhood Intel - U.S. Community Analytics",
  description: "Analyze U.S. towns, cities, and ZIP codes with verified economic and demographic data. Get insights on income, age trends, industry growth, and 10-year projections.",
  keywords: ["demographics", "economics", "census", "community analysis", "real estate", "investment"],
  authors: [{ name: "Neighborhood Intel" }],
  openGraph: {
    title: "Neighborhood Intel - U.S. Community Analytics",
    description: "Analyze U.S. towns, cities, and ZIP codes with verified economic and demographic data.",
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
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
