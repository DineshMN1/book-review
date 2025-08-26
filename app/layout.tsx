// app/layout.tsx
import './globals.css';
import NotificationsProvider from '@/components/NotificationsProvider';
import TopBar from '@/components/TopBar';

export const metadata = { title: 'Book Review MVP', description: 'Local-only MVP' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NotificationsProvider>
          <TopBar />
          <main className="container py-6">{children}</main>
        </NotificationsProvider>
      </body>
    </html>
  );
}
