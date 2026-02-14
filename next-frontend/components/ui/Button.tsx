import Link from 'next/link';
import { ReactNode, MouseEvent } from 'react';

interface ButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: (e: MouseEvent) => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'dark' | 'accent';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  external?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
}

export default function Button({
  children,
  href,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  external = false,
  disabled = false,
  fullWidth = false,
  icon,
}: ButtonProps) {
  // Базовые классы
  const baseClasses = "inline-flex items-center justify-center font-bold rounded-lg transition-all duration-300 cursor-pointer";
  
  // Варианты кнопок
  const variants = {
    primary: "bg-[#00f5ff] text-[#0a0a0f] hover:bg-[#00c4cc] active:bg-[#00b4b4] shadow-lg hover:shadow-xl",
    secondary: "bg-[#ff00ff] text-white hover:bg-[#ff66ff] active:bg-[#cc00cc] shadow-lg hover:shadow-xl",
    outline: "border-2 border-[#00f5ff] text-[#00f5ff] hover:bg-[#00f5ff]/10 hover:border-[#00c4cc] hover:text-[#00c4cc] bg-transparent",
    ghost: "text-[#00f5ff] hover:bg-[#00f5ff]/10 hover:text-[#00c4cc] bg-transparent",
    dark: "bg-[#12121a] text-white hover:bg-[#16161f] border border-[#1a1a24] shadow-lg",
    accent: "bg-gradient-to-r from-[#ff00ff] to-[#00f5ff] text-white hover:opacity-90 shadow-lg hover:shadow-xl",
  };
  
  // Размеры
  const sizes = {
    sm: "px-4 py-2 text-sm gap-2",
    md: "px-6 py-3 text-base gap-3",
    lg: "px-8 py-4 text-lg gap-4",
    xl: "px-10 py-5 text-xl gap-5",
  };
  
  // Ширина
  const widthClass = fullWidth ? 'w-full' : '';
  
  // Состояние disabled
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';
  
  // Собираем все классы
  const buttonClasses = `
    ${baseClasses} 
    ${variants[variant]} 
    ${sizes[size]} 
    ${widthClass} 
    ${disabledClass} 
    ${className}
  `.trim().replace(/\s+/g, ' ');
  
  // Автоматически определяем внешняя ли ссылка
  const isExternal = external || (href && (href.startsWith('http://') || href.startsWith('https://')));
  
  // Контент кнопки
  const buttonContent = (
    <>
      {icon && <span className="button-icon">{icon}</span>}
      <span className="button-text">{children}</span>
    </>
  );
  
  // Если это внешняя ссылка
  if (href && isExternal) {
    return (
      <a 
        href={href} 
        className={buttonClasses}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        aria-disabled={disabled}
      >
        {buttonContent}
      </a>
    );
  }
  
  // Если это внутренняя ссылка
  if (href) {
    return (
      <Link 
        href={href} 
        className={buttonClasses}
        onClick={onClick}
        aria-disabled={disabled}
      >
        {buttonContent}
      </Link>
    );
  }
  
  // Обычная кнопка без ссылки
  return (
    <button 
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
    >
      {buttonContent}
    </button>
  );
}