import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Footer } from "@/components/footer";
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
  title: "Internship Reports · GBM College, Gaya",
  description:
    "Download your internship report from the Karuna Swayam Sevi Sansthan internship (Tailoring, Beautician, Mehndi) using your university roll number.",
  applicationName: "GBM Internship Reports",
  authors: [{ name: "Mosanna Jalal", url: "https://me-mj.vercel.app" }],
  creator: "Mosanna Jalal · MJX Web Studio",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-bg font-sans text-fg">
        {children}
        <Footer />
        <Toaster
          position="top-center"
          theme="system"
          closeButton
          toastOptions={{
            classNames: {
              toast: "!rounded-xl !border !border-line !bg-surface !text-fg !shadow-card font-sans",
              description: "!text-muted",
            },
          }}
        />
      </body>
    </html>
  );
}
