import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar, MobileNav } from "@/components/Sidebar";
import { getUsuarioActual } from "@/lib/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Empeño Suite",
  description: "Sistema de gestión para casas de empeño",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const esLogin = pathname === "/login";
  const usuario = esLogin ? null : await getUsuarioActual();

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {esLogin ? (
          children
        ) : (
          <div className="flex min-h-screen">
            <Sidebar usuario={usuario} />
            <div className="flex min-w-0 flex-1 flex-col">
              <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-10">
                {children}
              </main>
              <MobileNav usuario={usuario} />
            </div>
          </div>
        )}
      </body>
    </html>
  );
}
