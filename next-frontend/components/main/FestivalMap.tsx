'use client';

import { useState, FC } from 'react';

interface FestivalZone {
  id: number;
  name: string;
  description: string;
  color: string;
  x: number; // координаты в процентах
  y: number;
  width: number;
  height: number;
}

const FestivalMap: FC = () => {
  const [activeZone, setActiveZone] = useState<number | null>(null);
  
  const zones: FestivalZone[] = [
    {
      id: 1,
      name: "ГЛАВНАЯ СЦЕНА",
      description: "Концерты, шоу-программа, награждение победителей",
      color: "#FF6B6B",
      x: 20,
      y: 10,
      width: 30,
      height: 15
    },
    {
      id: 2,
      name: "КИБЕРСПОРТИВНАЯ АРЕНА",
      description: "Турниры по Dota 2, CS2, Valorant, League of Legends",
      color: "#4ECDC4",
      x: 60,
      y: 10,
      width: 25,
      height: 20
    },
    {
      id: 3,
      name: "КОНКУРС КОСПЛЕЯ",
      description: "Сцена для выступлений, гримерки, фото-зона",
      color: "#FFD166",
      x: 10,
      y: 35,
      width: 20,
      height: 20
    },
    {
      id: 4,
      name: "ИНДИ-ЗОНА",
      description: "Локал-разработчики, демо новых игр, воркшопы",
      color: "#06D6A0",
      x: 40,
      y: 40,
      width: 25,
      height: 25
    },
    {
      id: 5,
      name: "НАСТОЛЬНЫЕ ИГРЫ",
      description: "Мафия, Манчкин, Данетки, Magic: The Gathering",
      color: "#118AB2",
      x: 70,
      y: 40,
      width: 20,
      height: 20
    },
    {
      id: 6,
      name: "ФУДКОРТ",
      description: "Еда и напитки от партнеров фестиваля",
      color: "#EF476F",
      x: 15,
      y: 65,
      width: 25,
      height: 15
    },
    {
      id: 7,
      name: "МЕРЧ ШОП",
      description: "Официальная атрибутика, коллекционные издания",
      color: "#073B4C",
      x: 50,
      y: 70,
      width: 20,
      height: 15
    },
    {
      id: 8,
      name: "VR-ЗОНА",
      description: "Виртуальная реальность, симуляторы, аттракционы",
      color: "#7209B7",
      x: 75,
      y: 65,
      width: 20,
      height: 20
    }
  ];

  const handleZoneHover = (zoneId: number) => {
    setActiveZone(zoneId);
  };

  const handleZoneLeave = () => {
    setActiveZone(null);
  };

  return (
    <section className="festival-map">
      <div>
        <h2>ПЛАН ФЕСТИВАЛЯ</h2>
        <p>Наведите на зону, чтобы увидеть её расположение</p>
        
        {/* Карта */}
        <div className="map-container">
          <div className="map-background">
            {/* Схематичное изображение площадки */}
            <svg width="100%" height="400" viewBox="0 0 100 100">
              {/* Контур здания */}
              <rect x="5" y="5" width="90" height="90" fill="#f0f0f0" stroke="#ccc" strokeWidth="0.5"/>
              
              {/* Зоны */}
              {zones.map(zone => (
                <rect
                  key={zone.id}
                  x={zone.x}
                  y={zone.y}
                  width={zone.width}
                  height={zone.height}
                  fill={activeZone === zone.id ? zone.color : `${zone.color}40`}
                  stroke={zone.color}
                  strokeWidth={activeZone === zone.id ? "0.8" : "0.3"}
                  opacity={activeZone === zone.id || activeZone === null ? 1 : 0.5}
                  className="map-zone"
                  onMouseEnter={() => handleZoneHover(zone.id)}
                  onMouseLeave={handleZoneLeave}
                />
              ))}
              
              {/* Подписи зон */}
              {zones.map(zone => (
                <text
                  key={`text-${zone.id}`}
                  x={zone.x + zone.width / 2}
                  y={zone.y + zone.height / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="2"
                  fill={activeZone === zone.id ? "#fff" : "#333"}
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {zone.name.split(' ')[0]}
                </text>
              ))}
              
              {/* Легенда направлений */}
              <text x="50" y="3" textAnchor="middle" fontSize="3" fill="#666">СЕВЕР</text>
              <text x="50" y="97" textAnchor="middle" fontSize="3" fill="#666">ЮГ</text>
              <text x="3" y="50" textAnchor="middle" fontSize="3" fill="#666" writingMode="tb">ЗАПАД</text>
              <text x="97" y="50" textAnchor="middle" fontSize="3" fill="#666" writingMode="tb">ВОСТОК</text>
            </svg>
            
            {/* Входы */}
            <div className="entrance entrance-north">ГЛАВНЫЙ ВХОД</div>
            <div className="entrance entrance-south">ВЫХОД</div>
          </div>
        </div>
        
        {/* Описание зон */}
        <div className="zones-description">
          {zones.map(zone => (
            <div 
              key={zone.id}
              className={`zone-card ${activeZone === zone.id ? 'active' : ''}`}
              onMouseEnter={() => handleZoneHover(zone.id)}
              onMouseLeave={handleZoneLeave}
              style={{ borderLeftColor: zone.color }}
            >
              <h3 style={{ color: zone.color }}>{zone.name}</h3>
              <p>{zone.description}</p>
              <div className="zone-meta">
                <span className="zone-color" style={{ backgroundColor: zone.color }}></span>
                <span className="zone-size">
                  {zone.width}×{zone.height}м
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Легенда */}
        <div className="map-legend">
          <h4>Условные обозначения:</h4>
          <div className="legend-items">
            {zones.map(zone => (
              <div key={zone.id} className="legend-item">
                <span className="legend-color" style={{ backgroundColor: zone.color }}></span>
                <span>{zone.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FestivalMap;