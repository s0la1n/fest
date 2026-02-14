export default function CosplayBlock() {
  return (
    <section className='cosplay'>
      <div>
        <h2>Конкурс косплея</h2>
        <p>Наведите на иконку, чтобы увидеть косплей</p>
        
        <div>
          {/* Левая колонка */}
          <div>
            {/* Карточка 1: фото слева, текст справа */}
            <div>
              <div>
                <img src="/cosplay/photo1.jpg" alt="Косплей 1" />
              </div>
              <div>
                <h3>Геральт из Ривии</h3>
                <p>@witcher_cosplayer</p>
                <p>Ведьмак 3: Дикая Охота</p>
                <button>Голосовать</button>
              </div>
            </div>
            
            {/* Карточка 2: текст слева, фото справа */}
            <div>
              <div>
                <h3>Элой</h3>
                <p>@horizon_fan</p>
                <p>Horizon Zero Dawn</p>
                <button>Голосовать</button>
              </div>
              <div>
                <img src="/cosplay/photo2.jpg" alt="Косплей 2" />
              </div>
            </div>
            
            {/* Карточка 3: фото слева, текст справа */}
            <div>
              <div>
                <img src="/cosplay/photo3.jpg" alt="Косплей 3" />
              </div>
              <div>
                <h3>Джокер</h3>
                <p>@persona5_lover</p>
                <p>Persona 5</p>
                <button>Голосовать</button>
              </div>
            </div>
          </div>
          
          {/* Центральная колонка - большой фото с текстом */}
          <div>
            <img src="/cosplay/main.jpg" alt="Главный косплей" />
            <div>
              <h3>ЛАРА КРОФТ</h3>
              <p>@tomb_raider_pro</p>
              <p>Tomb Raider</p>
              <p>Победитель прошлого года</p>
            </div>
          </div>
          
          {/* Правая колонка */}
          <div>
            {/* Карточка 4: текст слева, фото справа */}
            <div>
              <div>
                <h3>Кайл Кренник</h3>
                <p>@starfield_cos</p>
                <p>Starfield</p>
                <button>Голосовать</button>
              </div>
              <div>
                <img src="/cosplay/photo4.jpg" alt="Косплей 4" />
              </div>
            </div>
            
            {/* Карточка 5: фото слева, текст справа */}
            <div>
              <div>
                <img src="/cosplay/photo5.jpg" alt="Косплей 5" />
              </div>
              <div>
                <h3>Климент</h3>
                <p>@assassins_guild</p>
                <p>Assassin's Creed</p>
                <button>Голосовать</button>
              </div>
            </div>
            
            {/* Карточка 6: текст слева, фото справа */}
            <div>
              <div>
                <h3>Чун-Ли</h3>
                <p>@streetfighter_queen</p>
                <p>Street Fighter</p>
                <button>Голосовать</button>
              </div>
              <div>
                <img src="/cosplay/photo6.jpg" alt="Косплей 6"/>
              </div>
            </div>
          </div>
        </div>
        
        {/* Кнопки действий */}
        <div>
          <button>УЧАСТВОВАТЬ</button>
          <button>ПОДРОБНЕЕ</button>
        </div>
      </div>
    </section>
  );
}