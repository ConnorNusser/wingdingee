import type { Metadata } from 'next';
import { UserProvider } from '@/components/UserProvider';
import Nav from '@/components/Nav';
import './globals.css';

export const metadata: Metadata = {
  title: 'wingdingee',
  description: 'events for people you actually like',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>
        <UserProvider>
          <Nav />
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
