'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import './main.css';

const GAMES = [
  { id: 'cs2', name: 'Counter-Strike 2', label: 'Counter-Strike 2', video: '/videos/cs2.mp4', cardImage: '/images/main/card-csgo.png' },
  { id: 'dota2', name: 'Dota 2', label: 'Dota 2', video: '/videos/dota2.mp4', cardImage: '/images/main/card-dota2.png' },
  { id: 'valorant', name: 'Valorant', label: 'Valorant', video: '/videos/valorant.mp4', cardImage: '/images/main/card-val.png' },
];

const SPONSORS = [
  { name: 'VK Play', url: 'https://vk.com/vkplay', className: 'tv-1' },
  { name: 'Scream School', url: 'https://scream.school', className: 'tv-2' },
  { name: 'Oklick', url: 'https://oklick.ru', className: 'tv-3' },
  { name: '1C Game Studios', url: 'https://1cgs.ru', className: 'tv-4' },
  { name: 'Astrum Entertainment', url: 'https://astrum-entertainment.ru', className: 'tv-5' },
  { name: 'FPlus Tech', url: 'https://fplustech.ru/', className: 'tv-6' },
  { name: 'Lesta Games', url: 'https://lesta.ru', className: 'tv-7' },
  { name: 'Sber', url: 'https://sber.ru', className: 'tv-8' },
];

const ZONES = [
  { id: 1, name: 'Инди-зона', desc: 'Демо новинок от независимых разработчиков, лекции и воркшопы по созданию игр', color: '#EF4444' },
  { id: 2, name: 'Косплей', desc: 'Сцена для выступлений, профессиональные гримёрки и тематические фотозоны', color: '#0EA5E9' },
  { id: 3, name: 'Главная сцена', desc: 'Концерты, церемонии открытия и закрытия, награждение победителей', color: '#2DD4BF' },
  { id: 4, name: 'Киберспорт', desc: 'Турнирные матчи по Dota 2, CS2 и Valorant с призовым фондом', color: '#B91C1C' },
  { id: 5, name: 'Мерч', desc: 'Продажа эксклюзивной атрибутики, лимитированных сувениров и одежды', color: '#1D4ED8' },
  { id: 6, name: 'Зона отдыха', desc: 'Лаунж с мягкими креслами, зарядными станциями и настольными играми', color: '#10B981' },
  { id: 7, name: 'VR-зона', desc: 'Виртуальная реальность с современными шлемами и трекерами движения', color: '#EA580C' },
  { id: 8, name: 'Фудкорт', desc: 'Геймерское меню, энергетики и зона для быстрого перекуса', color: '#9CA3AF' },
  { id: 9, name: 'Регистрация', desc: 'Вход на фестиваль, выдача бейджей, программок и помощь волонтёров', color: '#B45309' },
  { id: 10, name: 'Туалеты', desc: 'Чистые санитарные комнаты с антисептиками и всем необходимым', color: '#7DD3FC' },
];

const COSPLAYERS = [
  {
    id: 1,
    name: 'Екатерина Гришкова',
    character: 'Рикка Таканаси',
    anime: 'Чудачества любви не помеха!',
    achievement: '1 место 2024',
    image: '/images/main/cosplay1.png',
    imageBg: '/images/main/cos1-back.png',
    description: 'Заняла 1 место в 2025 году с косплеем на Рикку Таканаси ("Чудачества любви не помеха!")'
  },
  {
    id: 2,
    name: 'Алексей Воронов',
    character: 'Юта Оккоцу',
    anime: 'Магическая битва',
    achievement: '2 место 2022',
    image: '/images/main/cosplay2.png',
    imageBg: '/images/main/cos2-back.png',
    description: 'Занял 2 место в 2022 году с косплеем на Юту Оккоцу из аниме "Магическая битва". Известен своей работой над деталями костюма и мечом Катана.'
  },
  {
    id: 3,
    name: 'Мария Соколова',
    character: 'Аянами Рей',
    anime: 'Евангелион',
    achievement: '3 место 2023',
    image: '/images/main/cosplay3.png',
    imageBg: '/images/main/cos3-back.png',
    description: 'Заняла 3 место в 2023 году с косплеем на Аянами Рей из культового аниме "Евангелион". Отличается точной передачей образа и атмосферности.'
  }
];

const SLIDER_IMAGES = [
  { id: 1, src: '/images/main/slider-1.webp', alt: 'Косплей на фестивале' },
  { id: 2, src: '/images/main/slider-2.webp', alt: 'Победа на турнире' },
  { id: 3, src: '/images/main/slider-3.webp', alt: 'Проведение турнира' },
  { id: 4, src: '/images/main/slider-4.webp', alt: 'Косплееры на фестивале' },
  { id: 5, src: '/images/main/slider-5.webp', alt: 'Тренировка к турниру' },
  { id: 6, src: '/images/main/slider-6.webp', alt: 'Косплей-конкурс' },
  { id: 7, src: '/images/main/slider-7.webp', alt: 'Победители турнира' },
];

export default function HomePage() {
  const [activeZone, setActiveZone] = useState<number | null>(null);
  const [selectedGame, setSelectedGame] = useState<string>('dota2');
  const [selectedVideo, setSelectedVideo] = useState<string>('/videos/dota2.mp4');
  const [activeCosplayer, setActiveCosplayer] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [tvState, setTvState] = useState<'booting' | 'playing'>('booting');
  const bootVideoRef = useRef<HTMLVideoElement>(null);
  const gameVideoRef = useRef<HTMLVideoElement>(null);
  const [showContent, setShowContent] = useState(false);

  const handleGameSelect = (gameId: string, videoUrl: string) => {
    setSelectedGame(gameId);
    setSelectedVideo(videoUrl);
  };

  useEffect(() => {
    if (bootVideoRef.current) {
      const bootVideo = bootVideoRef.current;
      
      const handleBootVideoEnd = () => {
        setTvState('playing');
        if (gameVideoRef.current) {
          gameVideoRef.current.play();
        }
        setTimeout(() => {
          setShowContent(true);
        }, 500);
      };
      
      bootVideo.addEventListener('ended', handleBootVideoEnd);
      bootVideo.play();
      
      return () => {
        bootVideo.removeEventListener('ended', handleBootVideoEnd);
      };
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDER_IMAGES.length);
    }, 5000); // Переключение каждые 5 секунд

    return () => clearInterval(interval);
  }, [SLIDER_IMAGES.length]);

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      const playVideo = async () => {
        try {
          video.load();
          await new Promise(resolve => setTimeout(resolve, 100));
          await video.play();
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            console.log('Video playback was interrupted, this is normal');
          } else {
            console.error('Video play error:', error);
          }
        }
      };
      
      playVideo();
    }
  }, [selectedVideo]);

  return (
    <div className="home-container">
      <section className="hero-section-new">
        <div className="old-monitor">
          <div className="monitor-screen">
            <div className="monitor-content">
              {/* Видео включения */}
              <video
                ref={bootVideoRef}
                className={`boot-video ${tvState === 'booting' ? 'visible' : 'hidden'}`}
                src="/videos/start.mp4"
                muted
                playsInline
              />
              
              {/* Игровое видео */}
              <video
                ref={gameVideoRef}
                className={`game-video ${tvState === 'playing' ? 'visible' : 'hidden'}`}
                src="/videos/game.mp4"
                muted
                loop
                playsInline
              />
              
              <div className={`monitor-overlay ${showContent ? 'visible' : 'hidden'}`}>
                <h1 className="monitor-title">ИГРОВОЙ ЛАБИРИНТ</h1>
                
                <div className="monitor-festival-info">
                  <p className="festival-date">29 ИЮЛЯ 2026</p>
                  <p className="festival-place">ТУКАЕВ ЦЕНТР</p>
                  <p className="festival-location">КАЗАНЬ</p>
                </div>
                
                <Link href="/buy-ticket" className="btn-blue monitor-btn">
                  НАЧАТЬ ИГРУ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-festival-section">
        <div className="about-festival-container">
          <h2 className="about-festival-title">О ФЕСТИВАЛЕ</h2>
          <p className="about-festival-description">
            Ретро-аркады с приставками из 90-х, маркет с мерчем и пиксельным артом, фуд-корт с геймерским меню и тысячи единомышленников. Фестиваль, где игры оживают.
          </p>
          
          <div className="video-player-container">
            <div className="video-frame">
              <video 
                className="main-video contain"
                autoPlay
                muted
                loop
                playsInline
                disablePictureInPicture
                controlsList="nodownload nofullscreen noplaybackrate"
              >
                <source src="/videos/fest.mp4" type="video/mp4" />
              </video>
            </div>
            
            <div className="video-left-image"></div>
            <div className="video-right-image"></div>
            
            <div className="video-right-text">
              <p>Три дисциплины — Dota 2, Valorant и Counter-Strike. Собирай команду, проходи турнирную сетку и сражайся за часть призового фонда. Покажи, кто здесь главный стратег и тактик.</p>
            </div>
          </div>

          <div className="photo-slider-container">
            <div className="slider-images-container">
              <div 
                className="slider-images"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {SLIDER_IMAGES.map((image) => (
                  <div key={image.id} className="slider-image-item">
                    <img 
                      src={image.src} 
                      alt={image.alt}
                      className="slider-image"
                    />
                  </div>
                ))}
              </div>
            </div>
  
            <div className="slider-right-image"></div>
            <div className="slider-left-image"></div>

            <div className="slider-text-overlay">
              <p>Выходи на сцену в образе любимого персонажа. Участвуй в дефиле или готовь сценический номер до двух минут. Жюри оценит детали костюма, харизму и актерское мастерство.</p>
            </div>
          </div>

          <Link href="/buy-ticket" className="btn-pink">
            КУПИТЬ БИЛЕТ
          </Link>
        </div>
      </section>

      {/* блок о турнире */}
      <section className="esports-section">
        <div className="esports-container">
          <h2 className="esports-title">Киберспортивный турнир</h2>
          <p className="esports-description">
            Здесь решают не только скиллы, но и характер. Dota 2, Valorant и Counter-Strike — выбери свою арену, собери пятёрку и докажи, что ты достоин места среди лучших. Призовой фонд ждет героев.
          </p>
          
          <div className="game-cards">
            {GAMES.map((game) => (
              <div 
                key={game.id} 
                className={`game-card-item ${selectedGame === game.id ? 'active' : ''}`}
                onClick={() => handleGameSelect(game.id, game.video)}
              >
                <div className="game-card-bg"></div>
                <div className="game-card-image" style={{ backgroundImage: `url(${game.cardImage})` }}></div>
                <h3 className="game-card-title">{game.label}</h3>
              </div>
            ))}
          </div>

          <div className="psvita-container">
            <div className="psvita-console">
              <video 
                ref={videoRef}
                className="psvita-screen" 
                src={selectedVideo}
                autoPlay
                muted
                loop
                playsInline
              />
            </div>
          </div>

          <div className="psvita-stik"></div>

          <Link href="/tournament" className="btn-blue">
            ПОДРОБНЕЕ
          </Link>
        </div>
      </section>

      {/* блок о конкурсе косплея */}
      <section className="cosplay-contest-section">
        <div className="cosplay-contest-container">
          <h2 className="cosplay-contest-title">КОСПЛЕЙ-КОНКУРС</h2>
          <p className="cosplay-contest-description">
            Готов превратить фестиваль в шоу твоих талантов? Косплей-сцена ждет героев, злодеев, пришельцев и фантастических созданий. Покажи результат месяцев работы над костюмом, энергию своего образа и поборись за звание лучшего косплеера!
          </p>

          <div className="cosplayers-pixel-row">
            {COSPLAYERS.map((cosplayer, index) => (
              <div 
                key={cosplayer.id}
                className="cosplayer-pixel-item"
                onMouseEnter={() => setActiveCosplayer(index)}
                onMouseLeave={() => setActiveCosplayer(null)}
              >
                <div className={`cosplayer-pixel-info ${activeCosplayer === index ? 'visible' : ''}`}>
                  <div className="pixel-info-frame">
                    <div className="pixel-info-corners">
                      <div className="pixel-corner top-left"></div>
                      <div className="pixel-corner top-right"></div>
                      <div className="pixel-corner bottom-left"></div>
                      <div className="pixel-corner bottom-right"></div>
                    </div>
                    <div className="pixel-info-content">
                      <h3 className="pixel-name">{cosplayer.name}</h3>
                      <p className="pixel-character">{cosplayer.character}</p>
                      <p className="pixel-desc">{cosplayer.description}</p>
                    </div>
                  </div>
                </div>

                <div className={`cosplayer-pixel-card ${activeCosplayer === index ? 'active' : ''}`}>
                  <div 
                    className={`pixel-card-bg ${activeCosplayer === index ? 'active' : ''}`}
                    style={{ backgroundImage: `url(${cosplayer.imageBg || '/images/main/card-bg-default.png'})` }}
                  ></div>
                  
                  <div className="pixel-card-image-wrapper">
                    <div 
                      className="pixel-card-image" 
                      style={{ backgroundImage: `url(${cosplayer.image})` }}
                    ></div>
                  </div>
                </div>
                
                <div className={`pixel-rank-under-card ${activeCosplayer === index ? 'visible' : ''}`}>
                  <div className="rank-polygon-left">◀</div>
                  <div className="rank-text">P{index + 1}</div>
                  <div className="rank-polygon-right">▶</div>
                </div>
              </div>
            ))}
          </div>

          <Link href="/cosplay" className="btn-pink">
            ПОДРОБНЕЕ
          </Link>
        </div>
      </section>

      {/* блок спонсоры - TV MONITORS */}
      <section className="sponsors-section">
        <div className="section-container">
          <h2 className="sponsors-title">Спонсоры</h2>
          <div className="tv-monitors-container">
            <div className="sponsors-logos-layer">
              <div className="sponsor-logo-item-wrapper">
                <div className="sponsor-logo-item logo-1"></div>
                <div className="scan-effect-horizontal"></div>
              </div>
              <div className="sponsor-logo-item-wrapper">
                <div className="sponsor-logo-item logo-2"></div>
                <div className="scan-effect-horizontal"></div>
              </div>
              <div className="sponsor-logo-item-wrapper">
                <div className="sponsor-logo-item logo-3"></div>
                <div className="scan-effect-horizontal"></div>
              </div>
              <div className="sponsor-logo-item-wrapper">
                <div className="sponsor-logo-item logo-4"></div>
                <div className="scan-effect-horizontal"></div>
              </div>
              <div className="sponsor-logo-item-wrapper">
                <div className="sponsor-logo-item logo-5"></div>
                <div className="scan-effect-horizontal"></div>
              </div>
              <div className="sponsor-logo-item-wrapper">
                <div className="sponsor-logo-item logo-6"></div>
                <div className="scan-effect-horizontal"></div>
              </div>
              <div className="sponsor-logo-item-wrapper">
                <div className="sponsor-logo-item logo-7"></div>
                <div className="scan-effect-horizontal"></div>
              </div>
              <div className="sponsor-logo-item-wrapper">
                <div className="sponsor-logo-item logo-8"></div>
                <div className="scan-effect-horizontal"></div>
              </div>
            </div>
            
            <div className="tv-bg-image"></div>
            
            <div className="sponsors-click-layer">
              {SPONSORS.map((sponsor) => (
                <a 
                  key={sponsor.name}
                  href={sponsor.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={`sponsor-tv-frame ${sponsor.className}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* карта фестиваля */}
      <section className="map-section">
        <div className="section-container">
          <h2 className="map-title">План фестиваля</h2>
          <p className="map-description">Наведите на название зоны — подсветится на карте</p>
          <div className="map-wrapper">
            <div className="map-container">
              <div className="map-bg-image"></div>
              
              <div className="map-zones-layer">
                {ZONES.map((zone) => (
                  <div
                    key={zone.id}
                    className={`map-zone-frame zone-${zone.id} ${activeZone === zone.id ? 'active' : ''}`}
                    onMouseEnter={() => setActiveZone(zone.id)}
                    onMouseLeave={() => setActiveZone(null)}
                  >
                    <div className="zone-tooltip">{zone.name}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="zones-list-wrapper">
              {ZONES.map((zone) => (
                <div
                  key={zone.id}
                  onMouseEnter={() => setActiveZone(zone.id)}
                  onMouseLeave={() => setActiveZone(null)}
                  className={`zone-list-item ${activeZone === zone.id ? 'active' : ''}`}
                >
                  <div className="zone-list-color" style={{ backgroundColor: zone.color }}></div>
                  <div className="zone-list-content">
                    <h3 className="zone-list-name">{zone.name}</h3>
                    <p className="zone-list-desc">{zone.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}