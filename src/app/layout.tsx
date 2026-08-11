import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Push-Up Challenge",
  description: "100 push-ups a day, 700 a week, $500 on the line. Track it with friends.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
