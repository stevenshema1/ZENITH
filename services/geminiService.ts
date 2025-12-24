
import { GoogleGenAI, Type } from "@google/genai";
import { MissionOutcome, MissionParams } from "../types";

// Always use direct process.env.API_KEY access without fallback
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAdaptiveMission = async (history: MissionOutcome[]): Promise<MissionParams> => {
  const historyText = history.length > 0 
    ? `Recent Mission Outcomes: ${JSON.stringify(history.slice(-3))}`
    : "No previous history. Initial deployment.";

  const prompt = `
    You are the Adaptive Mission Director (AMD) for Project Zenith.
    Based on the player's performance, generate a new tactical mission parameters.
    ${historyText}
    
    Current Target Area: "Crowded, Rain-Slicked Neo-Tokyo Alleyway"
    
    If player was too fast or lethal, increase difficulty (more snipers, better tactics).
    If player struggled, provide a more tactical, environmental-heavy level.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          location: { type: Type.STRING },
          objective: { type: Type.STRING },
          environment: {
            type: Type.OBJECT,
            properties: {
              weather: { type: Type.STRING },
              lighting: { type: Type.STRING },
              hazards: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          },
          enemyConfig: {
            type: Type.OBJECT,
            properties: {
              density: { type: Type.NUMBER },
              types: { type: Type.ARRAY, items: { type: Type.STRING } },
              tactics: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          },
          narrativeBrief: { type: Type.STRING }
        },
        required: ["location", "objective", "environment", "enemyConfig", "narrativeBrief"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const getNpcDialogue = async (action: string, history: MissionOutcome[]): Promise<string> => {
  const prompt = `
    You are an NPC in Project Zenith. The player just ${action}.
    Player History: ${JSON.stringify(history.slice(-5))}
    React to this action in a short, cinematic one-liner that remembers their past behavior.
    If they are usually lethal, show fear. If they are stealthy, show suspicion.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: "Keep dialogue under 20 words. Be gritty and tactical."
    }
  });

  return response.text;
};
