import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Internship Report Portal · GBM College, Gaya",
  description:
    "Download your internship report from the Karuna Swayam Sevi Sansthan internship (Tailoring, Beautician, Mehndi) using your university roll number.",
  applicationName: "GBM Internship Reports",
  authors: [{ name: "Mosanna Jalal", url: "https://me-mj.vercel.app" }],
  creator: "Mosanna Jalal · MJX Web Studio",
};

export const viewport: Viewport = {
  themeColor: "#05060b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-ink font-sans text-zinc-200">
        {children}
        <Toaster
          theme="dark"
          position="top-center"
          richColors
          closeButton
          toastOptions={{ className: "font-sans" }}
        />
      </body>
    </html>
  );
}
