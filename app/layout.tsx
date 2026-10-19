import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NOC VAULT CONTROL | NOC PT BALI TOWER",
  description: "Operational dashboard, site database, modem logs and daily checklist."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="id"><body>{children}</body></html>;
}