'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { user } = useAuth();
  const pathname = usePathname();

  const currentYear = new Date().getFullYear();

  // Страницы, где футер не должен отображаться
  const hiddenPages = ['/buy-ticket', '/signin', '/forgot-password', '/reset-password', '/agreement'];

  // Если пользователь авторизован - не показываем футер
  if (user) {
    return null;
  }

  // Если текущая страница в списке скрытых - не показываем футер
  if (hiddenPages.includes(pathname)) {
    return null;
  }

  const menuItems = [
    { name: 'ГЛАВНАЯ', href: '/' },
    { name: 'О НАС', href: '/about' },
    { name: 'КИБЕРСПОРТ', href: '/tournament' },
    { name: 'КОСПЛЕЙ', href: '/cosplay' },
    { name: 'РАСПИСАНИЕ', href: '/schedule' },
    { name: 'КУПИТЬ БИЛЕТ', href: '/buy-ticket' },
    { name: 'ВОЙТИ В АККАУНТ', href: '/signin' },
  ];

  return (
    <footer className="retro-footer">
      <div className="retro-footer-container">
        {/* Левая часть - GIF */}
        <div className="footer-left">
          <img 
            src="/images/ps.gif" 
            alt="PS animation" 
            className="footer-gif"
            width={585}
            height={318}
          />
        </div>

        {/* Правая часть - Диски с меню поверх */}
        <div className="footer-right-wrapper">
          <div className="footer-disks-container">
            <img 
              src="/images/disks.png" 
              alt="Disks" 
              className="footer-disks-bg"
              width={585}
              height={400}
            />
            <nav className="footer-menu-overlay">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`footer-menu-item ${hoveredItem === item.name ? 'hover' : ''}`}
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="footer-copyright">
            © 1997-{currentYear} ИГРОВОЙ ЛАБИРИНТ
          </div>
        </div>
      </div>
    </footer>
  );
}