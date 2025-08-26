import './globals.css';
import NotificationsProvider from '@/components/NotificationsProvider';
import TopBar from '@/components/TopBar';          // TopBar is a client component
import ClientOnly from '@/components/ClientOnly';  // <- wrapper

export const metadata = { title: 'Book Review MVP', description: 'Local-only MVP' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NotificationsProvider>
          <ClientOnly>
            <TopBar />
          </ClientOnly>
          <main className="container py-6">{children}</main>
        </NotificationsProvider>
      </body>
    </html>
  );
}
