import { Toaster } from 'sonner';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  );
}