import "./globals.css";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { headers } from "next/headers";
import { ToastProvider } from "@/components/ui/toast";
import { ClientNotificationProvider } from "@/components/notifications/ClientNotificationProvider";
import { SessionProviderWrapper } from "@/components/session/SessionProviderWrapper";
import { Analytics } from "@vercel/analytics/next";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LiffeyCare",
  description: "Hospital appointment management system",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const headersList = headers();
  const pathname = headersList.get("x-pathname") || "";
  const isAuthRoute = pathname.startsWith("/auth");
  const isDoctorRoute = pathname.startsWith("/doctor");

  return (
    <html lang="en" className={`${plusJakarta.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">
        <ToastProvider>
          <ClientNotificationProvider>
            <SessionProviderWrapper>
              <main
                className={
                  isAuthRoute || isDoctorRoute ? "" : "min-h-[calc(100vh-72px)]"
                }
              >
                {children}
              </main>
            </SessionProviderWrapper>
          </ClientNotificationProvider>
        </ToastProvider>
        <Analytics />
      </body>
    </html>
  );
}
