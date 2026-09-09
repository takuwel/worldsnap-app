import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WorldSnap',
  description: '世界中を旅して、思い出をつなごう',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        {children}
      </body>
    </html>
  );
}
