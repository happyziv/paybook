import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Paybook",
  description: "부부 공동가계부"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
