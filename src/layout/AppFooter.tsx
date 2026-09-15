import React from 'react';
import { Layout } from 'antd';

const { Footer } = Layout;

type Sponsor = {
  name: string
  file: string
  url?: string
};

// Odkaz doplnis pridanim / upravou "url". Bez "url" sa logo zobrazi bez prelinku.
const sponsors: Sponsor[] = [
  { name: 'STARS auditorium', file: 'stars.png',             url: 'https://starsauditorium.sk' },
  { name: 'Bratislavský kraj', file: 'bratislavsky-kraj.png', url: 'https://bratislavskykraj.sk' },
  { name: 'Budiš',             file: 'budis.png',             url: 'https://www.budis.sk' },
  { name: 'Stilus',            file: 'stilus.png',            url: 'https://www.stilus.sk/sk/' },
  { name: 'ABC Klima',         file: 'abcklima.png',          url: 'https://www.abcklima.sk' },
  { name: 'TKP',               file: 'tkp.png',               url: 'https://www.tkp.sk/' },
];

const AppFooter: React.FC = () => {
  return (
    <Footer className="footer">
      <div className="footerInner">
        <div className="sponsors">
          {sponsors.map((s) => {
            const img = <img src={`/sponzori/${s.file}`} alt={s.name} />;
            return s.url
              ? <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" title={s.name}>{img}</a>
              : <span key={s.name} title={s.name}>{img}</span>;
          })}
        </div>
      </div>
    </Footer>
  )
}

export default AppFooter
