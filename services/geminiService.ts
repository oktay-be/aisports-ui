import { GoogleGenAI, Type } from "@google/genai";
import { NewsEntry, GeminiAnalysis } from '../types';

const API_KEY = process.env.API_KEY || '';

export const analyzeNewsBatch = async (entries: NewsEntry[]): Promise<GeminiAnalysis> => {
  if (!API_KEY) {
    console.warn("API Key missing for Gemini");
    return {
      summary: "API Key not configured.",
      sentiment: 'Neutral',
      trendingTags: []
    };
  }

  // Take the top 20 entries to avoid token limits for this demo
  const context = entries.slice(0, 20).map(e => `- ${e.content}`).join('\n');

  if (!context) {
    return {
      summary: "No entries to analyze.",
      sentiment: 'Neutral',
      trendingTags: []
    };
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const prompt = `
    You are a social media news editor. Analyze the following list of short news posts.
    1. Provide a concise 2-sentence summary of the overall narrative.
    2. Determine the dominant sentiment.
    3. Suggest 3 viral hashtags.
    
    News Items:
    ${context}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            sentiment: { type: Type.STRING, enum: ['Positive', 'Neutral', 'Negative'] },
            trendingTags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "sentiment", "trendingTags"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as GeminiAnalysis;

  } catch (error) {
    console.error("Gemini Analysis Failed", error);
    return {
      summary: "Failed to generate analysis.",
      sentiment: 'Neutral',
      trendingTags: ["Error"]
    };
  }
};