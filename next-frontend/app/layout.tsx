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
    description: '29 мая 2026 года в Тукаев Центре пройдёт фестиваль игр и косплея «Игровой Лабиринт». Турниры, косплей-дефиле, зоны настольных и видеоигр, лекции и призы.',
    keywords: ['фестиваль игр', 'косплей фестиваль', 'косплей', 'турнир по играм', 'Тукаев Центр', 'игровой лабиринт', 'фестиваль косплея 2026', 'компьютерные игры фестиваль', 'настольные игры турнир'],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ru">
            <body className={`${inter.className}`}>
                <AuthProvider>
                    <div>
                        <Navigation />
                        <main>
                            {children}
                        </main>
                        <Footer />
                    </div>
                </AuthProvider>
            </body>
        </html>
    );
}