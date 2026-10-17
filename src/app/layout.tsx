import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist } from "next/font/google";
import { ServiceWorker } from "@/components/service-worker";
import { APP_NAME, SCHOOL_NAME } from "@/lib/constants";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: `Maintenance work orders for ${SCHOOL_NAME}`,
  applicationName: APP_NAME,
  appleWebApp: { capable: true, title: "Maintenance", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#1d3fae",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} font-sans antialiased`}>
        <ClerkProvider>{children}</ClerkProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
