import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PayVendas - Vende seus e-books e factura mais",
  description:
    "Plataforma de vendas de e-books e conteudos digitais para Angola e Mocambique. Pagamentos via PayPay Africa.",
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body className="antialiased">{children}</body>
    </html>
  );
}
