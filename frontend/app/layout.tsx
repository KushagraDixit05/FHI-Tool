import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'FHI Export Trade Calculator',
    template: '%s | FHI',
  },
  description:
    'Flourish High International — Professional export trade costing, quotation management, and CRM platform.',
  keywords: ['export', 'trade', 'costing', 'quotation', 'FHI', 'Flourish High International'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: { fontFamily: 'var(--font-inter)' },
          }}
        />
      </body>
    </html>
  );
}
