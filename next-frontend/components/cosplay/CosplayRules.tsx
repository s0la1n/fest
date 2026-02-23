'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Trophy, Camera, Users, Award } from 'lucide-react';

export default function CosplayRules() {
  const [openRules, setOpenRules] = useState<string[]>(['general']);

  const toggleRule = (ruleId: string) => {
    setOpenRules(prev => 
      prev.includes(ruleId) 
        ? prev.filter(id => id !== ruleId)
        : [...prev, ruleId]
    );
  };

  const rules = [
    {
      id: 'general',
      title: 'Общие положения',
      icon: <Users className="rule-icon" />,
      content: [
        'К участию допускаются косплеи на персонажей из игр, аниме, фильмов и комиксов',
        'Минимальный возраст участника: 14 лет',
        'Косплей должен быть создан участником самостоятельно или с минимальной помощью',
        'Запрещено использование оскорбительных или провокационных образов'
      ]
    },
    {
      id: 'registration',
      title: 'Регистрация участников',
      icon: <Camera className="rule-icon" />,
      content: [
        'Регистрация участников до 15 апреля 2026 года',
        'Необходимо предоставить 3-5 фотографий косплея в хорошем качестве',
        'Обязательно указать имя персонажа и источник (игра, фильм и т.д.)',
        'Допускается участие в нескольких категориях'
      ]
    },
    {
      id: 'categories',
      title: 'Категории и критерии',
      icon: <Trophy className="rule-icon" />,
      content: [
        'Лучший игровой косплей - точность воссоздания персонажа из видеоигр',
        'Лучший handmade - оценка качества изготовления костюма и реквизита',
        'Лучший performance - артистизм и соответствие характеру персонажа',
        'Приз зрительских симпатий - голосование на сайте и в социальных сетях'
      ]
    },
    {
      id: 'voting',
      title: 'Голосование и призы',
      icon: <Award className="rule-icon" />,
      content: [
        'Голосование проходит онлайн на официальном сайте',
        'Каждый пользователь может отдать 1 голос в сутки',
        'Жюри оценивает работы по 10-балльной шкале',
        'Общий призовой фонд: 1 000 000 ₽'
      ]
    }
  ];

  return (
    <section className="cosplay-rules">
      <div className="container">
        <div className="rules-header">
          <div className="section-badge">📋 ПРАВИЛА УЧАСТИЯ</div>
          <h2 className="section-title">
            КАК ПРИНЯТЬ УЧАСТИЕ<br />
            В КОНКУРСЕ КОСПЛЕЯ
          </h2>
          <p className="section-subtitle">
            Все что нужно знать для успешного участия в самом масштабном косплей-конкурсе года
          </p>
        </div>
        
        <div className="rules-timeline">
          <div className="timeline-steps">
            <div className="timeline-step">
              <div className="step-number">01</div>
              <div className="step-content">
                <h3>Регистрация</h3>
                <p>Регистрация участников до 15 апреля</p>
              </div>
            </div>
            
            <div className="timeline-step">
              <div className="step-number">02</div>
              <div className="step-content">
                <h3>Подготовка</h3>
                <p>Создайте или подготовьте косплей</p>
              </div>
            </div>
            
            <div className="timeline-step">
              <div className="step-number">03</div>
              <div className="step-content">
                <h3>Фотосессия</h3>
                <p>Сделайте качественные фотографии</p>
              </div>
            </div>
            
            <div className="timeline-step">
              <div className="step-number">04</div>
              <div className="step-content">
                <h3>Голосование</h3>
                <p>Участвуйте в онлайн-голосовании</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="rules-accordion">
          {rules.map(rule => (
            <div 
              key={rule.id} 
              className={`rule-card ${openRules.includes(rule.id) ? 'open' : ''}`}
            >
              <button 
                className="rule-header"
                onClick={() => toggleRule(rule.id)}
              >
                <div className="rule-title">
                  {rule.icon}
                  <h3>{rule.title}</h3>
                </div>
                <div className="rule-toggle">
                  {openRules.includes(rule.id) ? <ChevronUp /> : <ChevronDown />}
                </div>
              </button>
              
              {openRules.includes(rule.id) && (
                <div className="rule-content">
                  <ul>
                    {rule.content.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="rules-notes">
          <div className="note-card important">
            <div className="note-icon">⚠️</div>
            <div className="note-content">
              <h4>Важно!</h4>
              <p>Регистрация обязательна для всех участников. Без регистрации работы не допускаются к конкурсу.</p>
            </div>
          </div>
          
          <div className="note-card deadline">
            <div className="note-icon">⏰</div>
            <div className="note-content">
              <h4>Дедлайн</h4>
              <p>Прием заявок заканчивается 15 апреля 2026 года в 23:59 по московскому времени.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}