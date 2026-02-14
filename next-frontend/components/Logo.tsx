import Image from 'next/image';

export default function Logo() {
  return (
    <Image
      src="/logo.svg"
      alt="Игровой Лабиринт - логотип"
      width={150} // Настройте под свой размер
      height={50}
      priority
      className="cursor-pointer"
    />
  );
}