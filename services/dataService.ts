import { NewsEntry, PostStatus } from '../types';

// Helper to generate mock data
const generateMockData = (): NewsEntry[] => {
  const topics = ['Crypto', 'AI', 'Politics', 'Tech', 'Space', 'EVs'];
  const sources = ['TechCrunch', 'Bloomberg', 'Reuters', 'X/Twitter', 'TheVerge'];
  const entries: NewsEntry[] = [];

  const now = new Date();

  for (let i = 0; i < 50; i++) {
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];
    const daysAgo = Math.floor(Math.random() * 10);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    
    // Randomize hours to make sorting more interesting
    date.setHours(Math.floor(Math.random() * 24));

    const contentVariants = [
      `Huge moves in ${topic} today. Market seeing a 5% swing. Whales are active.`,
      `Just in: ${topic} regulation talks are heating up again. What does this mean for devs?`,
      `New model released in ${topic} sector. Benchmarks look insane. 🚀`,
      `Controversial take on ${topic} going viral. check the thread.`,
      `Breaking: Major acquisition in the ${topic} world. $10B deal confirmed.`
    ];

    const content = contentVariants[Math.floor(Math.random() * contentVariants.length)];

    entries.push({
      id: `entry-${i}`,
      content: `${content} #${topic} #News`,
      originalUrl: `https://example.com/news/${topic.toLowerCase()}/${i}`,
      timestamp: date.toISOString(),
      source: source,
      characterCount: content.length + 15, 
      status: Math.random() > 0.8 ? PostStatus.POSTED : PostStatus.PENDING,
      category: topic
    });
  }
  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const fetchNews = async (): Promise<NewsEntry[]> => {
    // Simulate network delay for GCP bucket fetch
    await new Promise(resolve => setTimeout(resolve, 600));
    return generateMockData();
};
