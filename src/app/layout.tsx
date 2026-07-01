import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { Sidebar, MobileMenu } from "@/components/Sidebar";
import { getUsuarioActual } from "@/lib/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
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
  const sinShell = pathname === "/login" || pathname === "/inicio" || pathname === "/tienda" || pathname.startsWith("/tienda/");
  const usuario = sinShell ? null : await getUsuarioActual();

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('tema');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full">
        {sinShell ? (
          children
        ) : (
          <div className="flex min-h-screen">
            <Sidebar usuario={usuario} />
            <div className="flex min-w-0 flex-1 flex-col">
              <MobileMenu usuario={usuario} />
              <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-10">
                {children}
              </main>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}
