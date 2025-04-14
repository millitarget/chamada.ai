import './globals.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'AI Voice Agent',
  description: 'AI voice agent that answers, responds and schedules — just like a human.',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="pt">
      <body className={`${inter.variable} font-sans bg-black text-pure-white`}>
        <div className="min-h-screen bg-gradient-to-b from-black via-black to-black">
          {children}
        </div>
      </body>
    </html>
  );
} 