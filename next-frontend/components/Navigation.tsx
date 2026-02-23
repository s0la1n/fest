'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Logo from './Logo';
import { BalanceDropdown } from './BalanceDropdown';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, hasRole } = useAuth();

  const navLink = "text-slate-400 hover:text-[#00f5ff] px-3 py-2 rounded-lg text-sm font-medium transition";
  const navLinkActive = "text-[#00f5ff]";

  return (
    <header className="bg-[#0a0a0f]/95 border-b border-[#1a1a24] sticky top-0 z-50 backdrop-blur" style={{ boxShadow: '0 0 20px rgba(0,245,255,0.1)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/">
              <Logo />
            </Link>
          </div>

          <div className="hidden md:flex md:items-center md:space-x-1">
            <Link href="/" className={navLink}>Главная</Link>
            <Link href="/about" className={navLink}>О нас</Link>
            <Link href="/tournament" className={navLink}>Турнир</Link>
            <Link href="/cosplay" className={navLink}>Косплей</Link>
            <Link href="/schedule" className={navLink}>Расписание</Link>
            {hasRole('admin') && (
              <>
                <Link href="/admin/statistics" className={navLink}>Статистика</Link>
                {/* <Link href="/admin/actions" className={navLink}>Действия оргов</Link> */}
                {/* <Link href="/admin" className="text-red-400 hover:text-red-300 px-3 py-2 rounded-lg text-sm font-medium">Админ-панель</Link> */}
              </>
            )}
          </div>

          <div className="hidden md:flex md:items-center md:space-x-2">
            {user ? (
              <>
                {!hasRole('admin') && (
                  <>
                    <Link href="/voting" className={navLink}>Голосование</Link>
                    <Link href="/shop" className={navLink}>Магазин</Link>
                  </>
                )}
                {(hasRole('tournament_organizer') || hasRole('cosplay_organizer')) && (
                  <>
                    <div className="h-6 w-px bg-slate-600 mx-1" />
                    {hasRole('tournament_organizer') && (
                      <Link href="/organizer/tournament" className="text-[#ff00ff] hover:text-[#ff66ff] px-3 py-2 rounded-lg text-sm font-medium">Орг. турнир</Link>
                    )}
                    {hasRole('cosplay_organizer') && (
                      <Link href="/organizer/cosplay" className="text-[#ff00ff] hover:text-[#ff66ff] px-3 py-2 rounded-lg text-sm font-medium">Орг. косплей</Link>
                    )}
                  </>
                )}
                <div className="h-6 w-px bg-slate-600 mx-1"></div>
                {!hasRole('admin') && <BalanceDropdown />}
                <Link href="/profile" className={navLink}>Профиль</Link>
                <button
                  onClick={logout}
                  className="bg-[#12121a] hover:bg-[#1a1a24] border border-[#1a1a24] hover:border-[#00f5ff]/30 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link href="/signin" className={navLink}>Войти</Link>
                <Link href="/buy-ticket" className="bg-[#00f5ff] text-[#0a0a0f] hover:bg-[#00c4cc] px-4 py-2 rounded-lg text-sm font-medium transition" style={{ boxShadow: '0 0 15px rgba(0,245,255,0.4)' }}>
                  Купить билет
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:bg-slate-700"
            >
              {isMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-[#0d0d14] border-t border-[#1a1a24]">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href="/" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-lg text-slate-400 hover:bg-[#12121a] hover:text-[#00f5ff]">Главная</Link>
            <Link href="/tournament" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-lg text-slate-400 hover:bg-[#12121a] hover:text-[#00f5ff]">Турнир</Link>
            <Link href="/cosplay" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-lg text-slate-400 hover:bg-[#12121a] hover:text-[#00f5ff]">Косплей</Link>
            <Link href="/schedule" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-lg text-slate-400 hover:bg-[#12121a] hover:text-[#00f5ff]">Расписание</Link>
            <div className="border-t border-[#1a1a24] my-2"></div>
            {user ? (
              <>
                {!hasRole('admin') && (
                  <>
                    <Link href="/voting" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-lg text-slate-400 hover:bg-[#12121a] hover:text-[#00f5ff]">Голосование</Link>
                    <Link href="/shop" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-lg text-slate-400 hover:bg-[#12121a] hover:text-[#00f5ff]">Магазин</Link>
                    <Link href="/balance" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-lg bg-[#00f5ff]/10 text-[#00f5ff] border border-[#00f5ff]/30">
                      Баланс: {user.balance ?? 0}
                    </Link>
                  </>
                )}
                {hasRole('tournament_organizer') && (
                  <Link href="/organizer/tournament" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-lg text-[#ff00ff] hover:bg-[#12121a]">Орг. турнир</Link>
                )}
                {hasRole('cosplay_organizer') && (
                  <Link href="/organizer/cosplay" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-lg text-[#ff00ff] hover:bg-[#12121a]">Орг. косплей</Link>
                )}
                <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-lg text-slate-400 hover:bg-[#12121a] hover:text-[#00f5ff]">Профиль</Link>
                {hasRole('admin') && (
                  <>
                    <Link href="/admin/statistics" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-lg text-slate-400 hover:bg-[#12121a] hover:text-[#00f5ff]">Статистика</Link>
                    <Link href="/admin/actions" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-lg text-slate-400 hover:bg-[#12121a] hover:text-[#00f5ff]">Действия оргов</Link>
                    <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-lg text-[#ff006e] hover:bg-[#12121a]">Админ-панель</Link>
                  </>
                )}
                <button onClick={() => { logout(); setIsMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-lg text-[#ff006e] hover:bg-[#12121a]">
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link href="/signin" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-lg text-slate-400 hover:bg-[#12121a] hover:text-[#00f5ff]">Войти</Link>
                <Link href="/buy-ticket" onClick={() => setIsMenuOpen(false)} className="block mt-2 px-3 py-2 rounded-lg bg-[#00f5ff] text-[#0a0a0f] text-center font-medium">Купить билет</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}