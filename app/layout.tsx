import './globals.css';
import { Toaster } from 'sonner';
import { Database, CheckCircle, MessageSquare, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#060608] text-neutral-100 antialiased font-mono">
        {/* Main Content Area */}
        <div className="pb-24"> 
          {children}
        </div>

        {/* Global Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0c]/80 backdrop-blur-xl border-t border-white/5 px-6 py-4 z-50">
          <div className="max-w-md mx-auto flex justify-between items-center text-neutral-500">
            <Link href="/" className="hover:text-white transition-colors"><Database size={24} /></Link>
            <Link href="/tasks" className="hover:text-white transition-colors"><CheckCircle size={24} /></Link>
            <Link href="/chat" className="hover:text-white transition-colors"><MessageSquare size={24} /></Link>
            <Link href="/wiki" className="hover:text-white transition-colors"><BookOpen size={24} /></Link>
          </div>
        </nav>

        <Toaster theme="dark" />
      </body>
    </html>
  );
}
