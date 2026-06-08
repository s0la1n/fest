'use client';

import { useState } from 'react';

export type FAQItem = {
  q: string;
  a: string;
};

interface FAQProps {
  items: FAQItem[];
  title?: string;
  subtitle?: string;
  color?: 'pink' | 'cyan' | 'magenta';
}

export default function FAQ({ items, title = "ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ", subtitle = "Всё, что нужно знать", color = 'cyan' }: FAQProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const getColorClass = () => {
    switch (color) {
      case 'pink':
        return 'faq-pink';
      case 'magenta':
        return 'faq-magenta';
      default:
        return 'faq-cyan';
    }
  };

  const getColorStyle = () => {
    switch (color) {
      case 'pink':
        return { borderColor: '#B72F74', iconColor: '#B72F74' };
      case 'magenta':
        return { borderColor: '#ff00ff', iconColor: '#ff00ff' };
      default:
        return { borderColor: '#54FEDD', iconColor: '#54FEDD' };
    }
  };

  const colorStyle = getColorStyle();

  return (
    <section className="faq-section section-pixel">
      <div className="container-pixel">
        <h2 className="section-title" style={{ background: `linear-gradient(180deg, ${colorStyle.iconColor} 0%, #B72F74 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>
          {title}
        </h2>
        <p className="section-subtitle">{subtitle}</p>
        <div className={`faq-container ${getColorClass()}`}>
          {items.map((item, i) => (
            <div 
              key={i} 
              className="faq-item" 
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{ borderColor: openFaq === i ? colorStyle.borderColor : '#1a1a24' }}
            >
              <div className="faq-question">
                {item.q}
                <span className="faq-icon" style={{ color: colorStyle.iconColor }}>
                  {openFaq === i ? '−' : '+'}
                </span>
              </div>
              {openFaq === i && <div className="faq-answer">{item.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}