import type { Metadata } from "next";
import Ambient from "@/components/Ambient";
import "./globals.css";

export const metadata: Metadata = {
  title: "NickDev · Aulas",
  description:
    "Materiais e slides das aulas da NickDev — um leque de tecnologia.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Ambient />
        <div className="wrap">{children}</div>
      </body>
    </html>
  );
}
