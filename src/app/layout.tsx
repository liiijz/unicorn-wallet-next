import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { I18nProvider } from "@/providers/I18nProvider";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { NotificationProvider } from "@/components/Notification";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Unicorn Wallet - Your Gateway to Web3",
  description: "A secure and user-friendly Web3 wallet for managing your crypto assets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <I18nProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  );
}
