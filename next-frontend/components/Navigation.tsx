'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { BalanceDropdown } from './BalanceDropdown';

type MenuItem = {
  href: string;
  label: string;
  isOrganizer?: boolean;
  isAuth?: boolean;
  isBuy?: boolean;
};

export default function Navigation() {
  const [isDiskMenuOpen, setIsDiskMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { user, logout, isOrganizer, isAdmin } = useAuth();
  const diskMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  let hoverTimeout: NodeJS.Timeout;

  // Закрытие десктопного меню при клике вне области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (diskMenuRef.current && !diskMenuRef.current.contains(event.target as Node)) {
        setIsDiskMenuOpen(false);
      }
    };
    
    if (isDiskMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDiskMenuOpen]);

  // Закрытие мобильного меню при клике вне области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleMouseEnter = () => {
    clearTimeout(hoverTimeout);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeout = setTimeout(() => {
      setIsHovered(false);
    }, 300);
  };

  // Пункты меню для неавторизованных
  const getUnauthMenuItems = (): MenuItem[] => {
    return [
      { href: '/', label: 'ГЛАВНАЯ' },
      { href: '/about', label: 'О НАС' },
      { href: '/tournament', label: 'ТУРНИР' },
      { href: '/cosplay', label: 'КОСПЛЕЙ' },
      { href: '/schedule', label: 'РАСПИСАНИЕ' },
      { href: '/signin', label: 'ВОЙТИ', isAuth: true },
      { href: '/buy-ticket', label: 'КУПИТЬ БИЛЕТ', isBuy: true },
    ];
  };

  // Пункты меню для авторизованных
  const getAuthMenuItems = (): MenuItem[] => {
    const items: MenuItem[] = [
      { href: '/schedule', label: 'РАСПИСАНИЕ' },
    ];
    
    if (!isOrganizer() && !isAdmin()) {
      items.push(
        { href: '/cards', label: 'КАРТОЧКИ' },
        { href: '/bets', label: 'СТАВКИ' },
        { href: '/voting', label: 'ГОЛОСОВАНИЕ' },
        { href: '/shop', label: 'МАГАЗИН' },
      );
    }
    
    if (isOrganizer() && !isAdmin()) {
      items.push(
        { href: '/organizer/cosplay/participants', label: 'УЧАСТНИКИ КОСПЛЕЯ', isOrganizer: true },
        { href: '/organizer/tournament/teams', label: 'КОМАНДЫ', isOrganizer: true },
        { href: '/organizer/tournament/bracket', label: 'ТУРНИРНАЯ СЕТКА', isOrganizer: true },
      );
    }
    
    if (isAdmin()) {
      items.push(
        { href: '/admin/statistics', label: 'СТАТИСТИКА' },
        { href: '/admin/cards', label: 'УПРАВЛЕНИЕ КАРТОЧКАМИ' },
        { href: '/admin/merch', label: 'УПРАВЛЕНИЕ ТОВАРАМИ' },  // ← Добавлено
        { href: '/admin/orders', label: 'ЗАКАЗЫ' }
      );
    }
    
    return items;
  };

  const unauthMenuItems = getUnauthMenuItems();
  const authMenuItems = getAuthMenuItems();

  // Для неавторизованных - меню с дисками
  if (!user) {
    return (
      <>
        {/* Десктопное меню с диском */}
        <div 
          className="disk-menu-wrapper" 
          ref={diskMenuRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            className="main-disk"
            onClick={() => setIsDiskMenuOpen(!isDiskMenuOpen)}
            aria-label="Меню"
          />
          {isHovered && !isDiskMenuOpen && (
            <span className="disk-hover-text">МЕНЮ</span>
          )}
          
          <div className={`disk-items-container ${isDiskMenuOpen ? 'open' : ''}`}>
            {unauthMenuItems.map((item) => (
              <div key={item.href} className="disk-item-wrapper">
                <div className={`disk-item ${item.isAuth ? 'auth-disk' : ''} ${item.isBuy ? 'buy-disk' : ''}`} />
                <Link
                  href={item.href}
                  className={`disk-link ${item.isAuth ? 'auth-link' : ''} ${item.isBuy ? 'buy-link' : ''}`}
                  onClick={() => setIsDiskMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Мобильное меню - бургер */}
        <div className="mobile-menu-wrapper" ref={mobileMenuRef}>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="mobile-menu-btn"
            aria-label="Меню"
          >
            <span className={`burger-icon ${isMobileMenuOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
          
          {isMobileMenuOpen && (
            <div className="mobile-menu-dropdown">
              <div className="mobile-menu-header">
                <span className="mobile-menu-title">МЕНЮ</span>
              </div>
              <div className="mobile-menu-links">
                {unauthMenuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`mobile-menu-link ${item.isAuth ? 'auth-link' : ''} ${item.isBuy ? 'buy-link' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="mobile-menu-link-icon">►</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  // Для авторизованных - обычное меню с бургером на мобильных
  return (
    <>
      <header className="auth-header desktop-nav">
        <div className="auth-container">
          <nav className="auth-nav">
            {authMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`auth-nav-link ${item.isOrganizer ? 'organizer-nav-link' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="navigation-spacer"></div>

          <div className="navigation-actions">
            {!isAdmin() && !isOrganizer() && <BalanceDropdown />}
            <Link href="/profile" className="nav-link">ПРОФИЛЬ</Link>
            <button onClick={logout} className="logout-btn">
              ВЫЙТИ
            </button>
          </div>
        </div>
      </header>

      {/* Мобильное меню для авторизованных */}
      <div className="mobile-menu-wrapper auth-mobile" ref={mobileMenuRef}>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="mobile-menu-btn"
          aria-label="Меню"
        >
          <span className={`burger-icon ${isMobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
        
        {isMobileMenuOpen && (
          <div className="mobile-menu-dropdown">
            <div className="mobile-menu-header">
              <span className="mobile-menu-title">МЕНЮ</span>
            </div>
            <div className="mobile-menu-links">
              {authMenuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mobile-menu-link ${item.isOrganizer ? 'organizer-link' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="mobile-menu-link-icon">►</span>
                  {item.label}
                </Link>
              ))}
              <div className="mobile-menu-divider" />
              <Link href="/profile" className="mobile-menu-link" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="mobile-menu-link-icon">►</span>
                ПРОФИЛЬ
              </Link>
              <button onClick={logout} className="mobile-menu-logout">
                <span className="mobile-menu-link-icon">►</span>
                ВЫЙТИ
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}