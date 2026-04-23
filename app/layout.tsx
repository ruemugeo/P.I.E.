import './globals.css'; // <--- THIS IS THE CSS LIFELINE
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';

// Optional: Setting up fonts to make it look sharp
const mono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono' 
});

export const metadata = {
  title: 'Lattice Core',
  description: 'Cognitive Life Operating System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${mono.variable} font-mono bg-[#060608] text-neutral-100 antialiased`}>
        {children}
        
        {/* This makes your notifications appear */}
        <Toaster 
          theme="dark" 
          position="bottom-right" 
          toastOptions={{
            style: { 
              background: '#0a0a0c', 
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontFamily: 'var(--font-mono)'
            },
          }}
        />
      </body>
    </html>
  );
}