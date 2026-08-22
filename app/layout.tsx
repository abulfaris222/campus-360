import type { Metadata } from 'next';
import './globals.css';
import './mobile.css';
import './theme.css';
import AuthGuard from '../components/AuthGuard';

export const metadata: Metadata = {
  title: 'RIT Campus 360',
  description: 'One digital platform for a smarter RIT campus.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthGuard>{children}</AuthGuard>
        <style dangerouslySetInnerHTML={{ __html: `
          .brand strong{font-size:0!important}.brand strong::after{content:"RIT Campus 360";font-size:15px;font-weight:800}
          .side-bottom b{font-size:0!important}.side-bottom b::after{content:"RIT Campus 360";font-size:12px;font-weight:800}
          .brand .logo{font-size:0!important;background:#071b35 url('/rit-mark.svg') center/cover no-repeat;border-radius:12px;overflow:hidden}
        ` }} />
      </body>
    </html>
  );
}
