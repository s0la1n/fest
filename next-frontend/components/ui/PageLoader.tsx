'use client';

type PageLoaderProps = {
  text?: string;
  className?: string;
};

export default function PageLoader({ text = 'ЗАГРУЗКА...', className = '' }: PageLoaderProps) {
  return (
    <div className={`page-loader ${className}`.trim()}>
      <div className="page-loader__gif-wrapper">
        <img 
          src="/images/loading.gif" 
          alt="Загрузка" 
          className="page-loader__gif"
        />
      </div>
      {text ? <p className="page-loader__text">{text}</p> : null}
    </div>
  );
}