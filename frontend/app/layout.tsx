import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import {
  AuthProvider
} from "@/components/AuthProvider";
import { Toaster }
from "sonner";

export const metadata: Metadata = {
  title: "Rework",
  description: "Realtime collaborative project memory",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body
        className="
          min-h-full
          flex
          flex-col
          text-white
          bg-[#0b0f1a]
          bg-[radial-gradient(circle_at_15%_0%,rgba(88,101,242,0.28),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(0,255,163,0.12),transparent_40%),linear-gradient(to_bottom,#0b0f1a,#05060a)]
        "
      >
        <AuthProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Toaster
            richColors
            position="top-right"
          />
        </AuthProvider>

      </body>
    </html>
  );
}
