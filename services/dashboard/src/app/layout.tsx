import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pipeline Dashboard',
  description: 'Data Pipeline Microservices Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
