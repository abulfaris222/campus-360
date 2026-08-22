import type { Metadata } from 'next';
import './globals.css';
import './mobile.css';
import './theme.css';
import AuthGuard from '../components/AuthGuard';

export const metadata: Metadata = {
  title: 'Smart Campus 360',
  description: 'One digital platform for a smarter college campus.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
