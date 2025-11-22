import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Translation Helper",
    description: "AI Translation Helper",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko">
            <body className={inter.className} style={{ fontFamily: '-apple-system, BlinkMacMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif' }}>{children}</body>
        </html>
    );
}
