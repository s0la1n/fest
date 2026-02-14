'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: 'general' | 'tickets' | 'tournament' | 'participation';
}

export default function ContactsPage() {
  const [activeTab, setActiveTab] = useState<'info' | 'faq'>('info');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'general',
    message: ''
  });

  const faqs: FAQ[] = [
    {
      id: 1,
      question: 'Как купить билет на фестиваль?',
      answer: 'Билеты можно приобрести онлайн на сайте в разделе "Билеты". Доступны билеты на 1 день, 3 дня и VIP-пакеты с дополнительными привилегиями.',
      category: 'tickets'
    },
    {
      id: 2,
      question: 'Где будет проходить фестиваль?',
      answer: 'Фестиваль пройдет в Тукаев Центре по адресу: г. Казань, ул. Примерная, 123. Ближайшая станция метро "Центральная".',
      category: 'general'
    },
    {
      id: 3,
      question: 'Как принять участие в турнире?',
      answer: 'Регистрация на турниры открывается за 2 месяца до фестиваля. Следите за анонсами на сайте и в наших социальных сетях.',
      category: 'tournament'
    },
    {
      id: 4,
      question: 'Как участвовать в косплей конкурсе?',
      answer: 'Регистрация участников косплей конкурса проходит онлайн. Подробные правила и сроки смотрите в разделе "Косплей".',
      category: 'participation'
    },
    {
      id: 5,
      question: 'Есть ли парковка?',
      answer: 'Да, рядом с Тукаев Центром есть охраняемая парковка на 500 мест. Для посетителей фестиваля действует специальный тариф.',
      category: 'general'
    },
    {
      id: 6,
      question: 'Можно ли прийти с детьми?',
      answer: 'Да, фестиваль подходит для всех возрастов. Для детей до 7 лет вход бесплатный. Есть специальная детская зона.',
      category: 'general'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Сообщение отправлено! Мы ответим вам в течение 24 часов.');
    setFormData({ name: '', email: '', subject: 'general', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (id: number) => {
    setActiveFaq(activeFaq === id ? null : id);
  };

  return (
    <div className="contacts-page">
      {/* Герой секция */}
      <section className="contacts-hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">КОНТАКТЫ</div>
            <h1 className="hero-title">СВЯЖИТЕСЬ С НАМИ</h1>
            <p className="hero-subtitle">
              Есть вопросы по фестивалю? Мы всегда на связи!
            </p>
            
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-icon"></div>
                <div>
                  <div className="stat-number">info@cyberfest.ru</div>
                  <div className="stat-label">Основной email</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon"></div>
                <div>
                  <div className="stat-number">+7 (999) 000-00-00</div>
                  <div className="stat-label">Телефон поддержки</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon"></div>
                <div>
                  <div className="stat-number">24ч</div>
                  <div className="stat-label">Время ответа</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Основное содержание */}
      <section className="contacts-main">
        <div className="container">
          {/* Табы */}
          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              Контактная информация
            </button>
            <button
              className={`tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
              onClick={() => setActiveTab('faq')}
            >
              Частые вопросы
            </button>
          </div>

          {/* Контент */}
          <div className="tab-content">
            {activeTab === 'info' && (
              <div className="contact-grid">
                {/* Основные контакты */}
                <div className="contact-card">
                  <div className="card-header">
                    <div className="card-icon"></div>
                    <h3>Контактная информация</h3>
                  </div>
                  
                  <div className="contact-items">
                    <div className="contact-item">
                      <div className="item-header">
                        <span className="item-icon"></span>
                        <h4>Электронная почта</h4>
                      </div>
                      <div className="item-content">
                        <p className="item-title">Общие вопросы:</p>
                        <a href="mailto:info@cyberfest.ru" className="item-value">
                          info@cyberfest.ru
                        </a>
                        
                        <p className="item-title">Турниры:</p>
                        <a href="mailto:tournament@cyberfest.ru" className="item-value">
                          tournament@cyberfest.ru
                        </a>
                        
                        <p className="item-title">Косплей:</p>
                        <a href="mailto:cosplay@cyberfest.ru" className="item-value">
                          cosplay@cyberfest.ru
                        </a>
                        
                        <p className="item-title">Партнерство:</p>
                        <a href="mailto:partners@cyberfest.ru" className="item-value">
                          partners@cyberfest.ru
                        </a>
                      </div>
                    </div>
                    
                    <div className="contact-item">
                      <div className="item-header">
                        <span className="item-icon"></span>
                        <h4>Телефон</h4>
                      </div>
                      <div className="item-content">
                        <p className="item-title">Общие вопросы:</p>
                        <a href="tel:+79990000000" className="item-value">
                          +7 (999) 000-00-00
                        </a>
                        <p className="item-note">Пн-Пт: 9:00-18:00</p>
                      </div>
                    </div>
                    
                    <div className="contact-item">
                      <div className="item-header">
                        <span className="item-icon">📍</span>
                        <h4>Адрес</h4>
                      </div>
                      <div className="item-content">
                        <p className="item-value">г. Казань, Тукаев Центр</p>
                        <p className="item-note">ул. Примерная, 123</p>
                        <p className="item-note">Станция метро "Центральная"</p>
                        
                        <div className="map-actions">
                          <Button 
                            href="https://yandex.ru/maps"
                            variant="outline"
                            size="sm"
                            external
                          >
                            Построить маршрут
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Время работы */}
                <div className="contact-card">
                  <div className="card-header">
                    <div className="card-icon"></div>
                    <h3>Время работы</h3>
                  </div>
                  
                  <div className="schedule-items">
                    <div className="schedule-item">
                      <div className="schedule-title">Организационный офис</div>
                      <div className="schedule-time">Пн-Пт: 9:00-18:00</div>
                      <div className="schedule-note">Перерыв: 13:00-14:00</div>
                    </div>
                    
                    <div className="schedule-item">
                      <div className="schedule-title">Во время фестиваля</div>
                      <div className="schedule-time">29-31 марта: 10:00-22:00</div>
                      <div className="schedule-note">Техническая поддержка круглосуточно</div>
                    </div>
                    
                    <div className="schedule-item">
                      <div className="schedule-title">Онлайн поддержка</div>
                      <div className="schedule-time">Круглосуточно</div>
                      <div className="schedule-note">Через форму на сайте</div>
                    </div>
                  </div>
                </div>

                {/* Социальные сети */}
                <div className="contact-card social-card">
                  <div className="card-header">
                    <div className="card-icon"></div>
                    <h3>Мы в соцсетях</h3>
                  </div>
                  
                  <p className="social-subtitle">Следите за новостями и анонсами:</p>
                  
                  <div className="social-buttons">
                    <Button 
                      href="https://vk.com/cyberfest" 
                      variant="outline"
                      fullWidth
                      external
                    >
                      <span className="social-icon"></span>
                      ВКонтакте
                    </Button>
                    
                    <Button 
                      href="https://t.me/cyberfest" 
                      variant="outline"
                      fullWidth
                      external
                    >
                      <span className="social-icon">📱</span>
                      Telegram
                    </Button>
                    
                    <Button 
                      href="https://youtube.com/cyberfest" 
                      variant="outline"
                      fullWidth
                      external
                    >
                      <span className="social-icon"></span>
                      YouTube
                    </Button>
                    
                    <Button 
                      href="https://instagram.com/cyberfest" 
                      variant="outline"
                      fullWidth
                      external
                    >
                      <span className="social-icon"></span>
                      Instagram
                    </Button>
                  </div>
                  
                  <div className="social-note">
                    <p>Самые свежие новости публикуем в Telegram</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'faq' && (
              <div className="faq-section">
                <div className="faq-header">
                  <h3>Часто задаваемые вопросы</h3>
                  <p>Ответы на самые популярные вопросы о фестивале</p>
                </div>
                
                <div className="faq-list">
                  {faqs.map(faq => (
                    <div 
                      key={faq.id} 
                      className={`faq-item ${activeFaq === faq.id ? 'active' : ''}`}
                      onClick={() => toggleFaq(faq.id)}
                    >
                      <div className="faq-question">
                        <div className="question-content">
                          <span className="faq-icon"></span>
                          <h4>{faq.question}</h4>
                        </div>
                        <span className="faq-toggle">
                          {activeFaq === faq.id ? '−' : '+'}
                        </span>
                      </div>
                      
                      {activeFaq === faq.id && (
                        <div className="faq-answer">
                          <p>{faq.answer}</p>
                          
                          {faq.category === 'tickets' && (
                            <Button 
                              href="/tickets"
                              variant="ghost"
                              size="sm"
                            >
                              Перейти к билетам
                            </Button>
                          )}
                          
                          {faq.category === 'tournament' && (
                            <Button 
                              href="/tournament"
                              variant="ghost"
                              size="sm"
                            >
                              Перейти к турнирам
                            </Button>
                          )}
                          
                          {faq.category === 'participation' && (
                            <Button 
                              href="/cosplay"
                              variant="ghost"
                              size="sm"
                            >
                              Перейти к косплею
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="faq-footer">
                  <p>Не нашли ответ на свой вопрос?</p>
                  <Button 
                    onClick={() => setActiveTab('info')}
                    variant="outline"
                  >
                    Напишите нам
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Форма обратной связи */}
      <section className="contact-form-section">
        <div className="container">
          <div className="form-card">
            <div className="form-header">
              <h2>НАПИШИТЕ НАМ</h2>
              <p>Заполните форму и мы ответим вам в течение 24 часов</p>
            </div>
            
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Ваше имя *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Иван Иванов"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="example@mail.ru"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="subject">Тема сообщения *</label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                >
                  <option value="general">Общий вопрос</option>
                  <option value="tickets">Билеты</option>
                  <option value="tournament">Турниры</option>
                  <option value="cosplay">Косплей</option>
                  <option value="partnership">Партнерство</option>
                  <option value="technical">Технические вопросы</option>
                  <option value="other">Другое</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="message">Сообщение *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Опишите ваш вопрос или предложение..."
                />
              </div>
              
              <div className="form-actions">
                <Button 
                  type="submit"
                  variant="primary"
                  fullWidth
                >
                  Отправить сообщение
                </Button>
              </div>
              
              <div className="form-note">
                <p>Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности</p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}