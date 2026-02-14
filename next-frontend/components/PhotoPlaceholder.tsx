interface PhotoPlaceholderProps {
  className?: string;
  ratio?: 'square' | 'video' | 'wide' | 'tall';
}

export default function PhotoPlaceholder({ className = '', ratio = 'video' }: PhotoPlaceholderProps) {
  const ratioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[21/9]',
    tall: 'aspect-[3/4]',
  };
  return (
    <div
      className={`bg-[#12121a] border border-[#1a1a24] rounded-lg flex items-center justify-center text-slate-500 text-sm ${ratioClasses[ratio]} ${className}`}
    >
      photo
    </div>
  );
}
