import type { Metadata } from "next";
import "./globals.css";
import { AnalysisProvider } from "@/lib/analysis-store";

export const metadata: Metadata = {
  title: "FreightIQ — Voyage Decision Intelligence",
  description:
    "AI-assisted freight forecasting and vessel chartering decisions for bulk cargo imports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <AnalysisProvider>{children}</AnalysisProvider>
      </body>
    </html>
  );
}
