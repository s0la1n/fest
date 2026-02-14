import { FC } from 'react';
import Button from '@/components/ui/Button';

interface Sponsor {
  id: number;
  name: string;
  logo: string;
  url: string;
}

const SponsorsSection: FC = () => {
  const sponsors: Sponsor[] = [
    { id: 1, name: "Intel", logo: "/sponsors/intel.png", url: "https://intel.com" },
    { id: 2, name: "NVIDIA", logo: "/sponsors/nvidia.png", url: "https://nvidia.com" },
    { id: 3, name: "ASUS ROG", logo: "/sponsors/asus.png", url: "https://asus.com" },
    { id: 4, name: "HyperX", logo: "/sponsors/hyperx.png", url: "https://hyperx.com" },
    { id: 5, name: "Red Bull", logo: "/sponsors/redbull.png", url: "https://redbull.com" },
    { id: 6, name: "Twitch", logo: "/sponsors/twitch.png", url: "https://twitch.tv" },
    { id: 7, name: "Steam", logo: "/sponsors/steam.png", url: "https://store.steampowered.com" },
    { id: 8, name: "Epic Games", logo: "/sponsors/epic.png", url: "https://epicgames.com" },
  ];

  return (
    <section className="sponsors">
      <div>
        <h2>СПОНСОРЫ ФЕСТИВАЛЯ</h2>
        <p>Нажмите на логотип, чтобы перейти на сайт компании</p>
        
        <div className="sponsors-grid">
          {sponsors.map((sponsor) => (
            <a
              key={sponsor.id}
              href={sponsor.url}
              className="sponsor-item"
              target="_blank"
              rel="noopener noreferrer"
              title={`Перейти на сайт ${sponsor.name}`}
            >
              <div className="sponsor-logo-wrapper">
                <img 
                  src={sponsor.logo} 
                  alt={`Логотип ${sponsor.name}`}
                  className="sponsor-logo"
                />
              </div>
              <div className="sponsor-name">{sponsor.name}</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SponsorsSection;