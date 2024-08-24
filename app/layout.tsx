import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from '../hooks/WalletContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The Vault",
  description: "Welcome to the nextgen payment system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}