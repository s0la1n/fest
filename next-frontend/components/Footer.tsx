import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0d0d14] border-t border-[#1a1a24]" style={{ boxShadow: '0 0 30px rgba(0,245,255,0.05)' }}>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* О фестивале */}
          <div>
            <h3 className="text-lg font-bold text-[#00f5ff] mb-4">Игровой Лабиринт</h3>
            <p className="text-slate-400 text-sm mb-3">Фестиваль игр и косплея в Тукаев Центре</p>
            <p className="text-slate-500 text-sm">29 марта — 2 апреля 2026</p>
            <p className="text-slate-500 text-sm mt-1">Казань, Тукаев Центр</p>
          </div>

          {/* Навигация */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Навигация</h4>
            <nav className="space-y-2">
              <Link href="/" className="block text-slate-400 hover:text-[#00f5ff] text-sm transition">Главная</Link>
              <Link href="/about" className="block text-slate-400 hover:text-[#00f5ff] text-sm transition">О фестивале</Link>
              <Link href="/tournament" className="block text-slate-400 hover:text-[#00f5ff] text-sm transition">Турниры</Link>
              <Link href="/cosplay" className="block text-slate-400 hover:text-[#00f5ff] text-sm transition">Косплей</Link>
              <Link href="/schedule" className="block text-slate-400 hover:text-[#00f5ff] text-sm transition">Расписание</Link>
              <Link href="/contacts" className="block text-slate-400 hover:text-[#00f5ff] text-sm transition">Контакты</Link>
              <Link href="/signin" className="block text-slate-400 hover:text-[#00f5ff] text-sm transition">Войти в аккаунт</Link>
            </nav>
          </div>

          {/* Контакты */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Контакты</h4>
            <div className="space-y-2 text-slate-400 text-sm">
              <p>+7 (999) 123-45-67</p>
              <p>info@igrovoi-labirint.ru</p>
              <p>10:00 — 20:00 ежедневно</p>
            </div>
            <div className="mt-4">
              <h5 className="text-xs font-semibold text-slate-500 uppercase mb-2">Соцсети</h5>
              <div className="flex gap-3">
                <a href="https://vk.com" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-[#00f5ff]">VK</a>
                <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-[#00f5ff]">Telegram</a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-[#00f5ff]">YouTube</a>
              </div>
            </div>
          </div>

          {/* Партнёры */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Партнёры</h4>
            <div className="flex flex-wrap gap-2 text-slate-500 text-sm">
              <span>Тукаев Центр</span>
              <span>•</span>
              <span>GamingShop</span>
              <span>•</span>
              <span>Cosplay Masters</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#1a1a24] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">© {currentYear} Фестиваль «Игровой Лабиринт». Все права защищены.</p>
          <div className="flex gap-4 text-slate-500 text-sm">
            <Link href="/privacy" className="hover:text-[#00f5ff]">Политика конфиденциальности</Link>
            <Link href="/terms" className="hover:text-[#00f5ff]">Условия</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}