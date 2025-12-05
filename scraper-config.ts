export interface ScraperSource {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
}

export interface ScraperRegionConfig {
  id: 'eu' | 'tr';
  name: string;
  keywords: string[];
  sources: ScraperSource[];
  scrapeDepth: number;
}

export const DEFAULT_SCRAPER_CONFIG: Record<'eu' | 'tr', ScraperRegionConfig> = {
  eu: {
    id: 'eu',
    name: 'European Sources',
    keywords: ['fenerbahce', 'galatasaray', 'tedesco'],
    scrapeDepth: 1,
    sources: [
      { id: 'lequipe', name: "L'Équipe", url: 'https://www.lequipe.fr/Football/', enabled: true },
      { id: 'francefootball', name: 'France Football', url: 'https://www.francefootball.fr/', enabled: true },
      { id: 'rmcsport', name: 'RMC Sport', url: 'https://rmcsport.bfmtv.com/', enabled: true },
      { id: 'footmercato', name: 'Foot Mercato', url: 'https://www.footmercato.net/', enabled: true },
      { id: 'leparisien', name: 'Le Parisien', url: 'https://www.leparisien.fr/sports/football/', enabled: true },
      { id: 'gazzetta', name: 'Gazzetta dello Sport', url: 'https://www.gazzetta.it/Calcio/Estero/', enabled: true },
      { id: 'corriere', name: 'Corriere dello Sport', url: 'https://www.corrieredellosport.it/calcio/calcio-estero', enabled: true },
      { id: 'tuttosport', name: 'Tuttosport', url: 'https://www.tuttosport.com/', enabled: true },
      { id: 'calciomercato', name: 'Calciomercato', url: 'https://www.calciomercato.com/', enabled: true },
      { id: 'skysports', name: 'Sky Sports', url: 'https://www.skysports.com/football', enabled: true },
      { id: 'bbc', name: 'BBC Sport', url: 'https://www.bbc.com/sport/football', enabled: true },
      { id: 'espn', name: 'ESPN', url: 'https://www.espn.co.uk/football/', enabled: true },
      { id: 'telegraph', name: 'The Telegraph', url: 'https://www.telegraph.co.uk/football/', enabled: true },
      { id: 'sport1', name: 'Sport1', url: 'https://www.sport1.de/channel/transfermarkt', enabled: true },
      { id: 'kicker', name: 'Kicker', url: 'https://www.kicker.de/', enabled: true },
      { id: 'sport_de', name: 'Sport.de', url: 'https://www.sport.de/fussball/magazin/', enabled: true },
      { id: 'sky_de', name: 'Sky DE', url: 'https://sport.sky.de/fussball/', enabled: true },
    ],
  },
  tr: {
    id: 'tr',
    name: 'Turkish Sources',
    keywords: ['fenerbahce', 'galatasaray', 'tedesco'],
    scrapeDepth: 1,
    sources: [
      { id: 'fanatik', name: 'Fanatik', url: 'https://www.fanatik.com.tr', enabled: true },
      { id: 'ntvspor', name: 'NTV Spor', url: 'https://www.ntvspor.net/', enabled: true },
      { id: 'skor', name: 'Skor Gazetesi', url: 'https://www.skorgazetesi.com', enabled: true },
      { id: 'beinsports', name: 'beIN SPORTS', url: 'https://beinsports.com.tr', enabled: true },
    ],
  },
};
