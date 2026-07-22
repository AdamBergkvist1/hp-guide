import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "HP-Guide — träna på högskoleprovet",
  description:
    "Träna på högskoleprovets delprov och följ din utveckling per del.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv">
      <body>
        <header className="site-header">
          <div className="site-header-inner">
            <Link href="/" className="logo">
              HP<span>-Guide</span>
            </Link>
            <nav className="nav">
              <Link href="/">Träna</Link>
              <Link href="/statistik">Statistik</Link>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
