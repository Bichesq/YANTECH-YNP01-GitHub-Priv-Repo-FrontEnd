import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import SessionExpirationWarning from "@/components/SessionExpirationWarning";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Admin Dashboard - Notification System",
  description:
    "Admin dashboard for managing notification applications and AWS resources",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SessionExpirationWarning />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}