import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
    title: {
        default: 'Игровой Лабиринт - Фестиваль игр и косплея',
        template: '%s | Игровой Лабиринт'
    },
    description: 'Фестиваль игр и косплея в Тукаев Центре 29.05.2026',
    keywords: ['фестиваль', 'игры', 'косплей', 'турнир', 'Тукаев Центр'],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ru" className="dark">
            <body className={`${inter.className} bg-[#0a0a0f] text-slate-200`}>
                {/* AuthProvider должен оборачивать всё приложение.
                    Тогда useAuth() будет доступен и в Navigation, и в любой странице.
                */}
                <AuthProvider>
                    <div className="flex flex-col min-h-screen">
                        {/* Навигация */}
                        <Navigation />
                        
                        {/* flex-grow заставляет main растягиваться, 
                            занимая всё свободное место, и толкает футер вниз 
                        */}
                        <main className="flex-grow">
                            {children}
                        </main>
                        
                        {/* Футер */}
                        <Footer />
                    </div>
                </AuthProvider>
            </body>
        </html>
    );
}