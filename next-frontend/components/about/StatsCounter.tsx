'use client';

import { useState, useEffect, useRef } from 'react';

const statsData = [
  { label: "Лет истории", value: "8", icon: "📅", suffix: "" },
  { label: "Участников в 2024", value: "5000", icon: "👥", suffix: "+" },
  { label: "Тематических зон", value: "12", icon: "🗺️", suffix: "" },
  { label: "Часов программы", value: "72", icon: "⏰", suffix: "" },
  { label: "Косплееров", value: "150", icon: "👗", suffix: "+" },
  { label: "Призовой фонд", value: "5", icon: "🏆", suffix: "M₽" }
];

export default function StatsCounter() {
  const [counterValues, setCounterValues] = useState<number[]>(Array(6).fill(0));
  const [isVisible, setIsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          
          statsData.forEach((stat, index) => {
            const target = parseInt(stat.value);
            const duration = 2000;
            const increment = target / (duration / 16);
            let current = 0;
            
            const timer = setInterval(() => {
              current += increment;
              if (current >= target) {
                current = target;
                clearInterval(timer);
              }
              
              setCounterValues(prev => {
                const newValues = [...prev];
                newValues[index] = Math.floor(current);
                return newValues;
              });
            }, 16);
          });
        }
      },
      { threshold: 0.5 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={statsRef} className="stats-section">
      <div className="stats-container">
        {statsData.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-value">
              {isVisible ? counterValues[index] : "0"}
              {stat.suffix}
            </div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}