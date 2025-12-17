import { GoogleGenAI, Type } from "@google/genai";
import { CharacterData, EvaluationResult, CharacterType } from "../types";
import { HIRAGANA_FULL, KATAKANA_FULL } from "./staticData";

const modelName = 'gemini-3-flash-preview';

// We initialize inside functions to catch errors if process.env.API_KEY is missing
const getAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is missing. Please set it in your environment variables.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const fetchCharacterList = async (type: CharacterType): Promise<CharacterData[]> => {
  if (type === CharacterType.HIRAGANA) return HIRAGANA_FULL;
  if (type === CharacterType.KATAKANA) return KATAKANA_FULL;

  const prompt = `Generate a list of 50 popular or fundamental Japanese characters for the category: "${type}".
  For Kanji, choose common JLPT level appropriate ones.
  Return a JSON array.`;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              char: { type: Type.STRING },
              romaji: { type: Type.STRING },
              meaning: { type: Type.STRING },
              onReading: { type: Type.STRING },
              kunReading: { type: Type.STRING },
            },
            required: ["char", "romaji"],
          },
        },
        systemInstruction: "You are a helpful Japanese language tutor.",
      },
    });

    const text = response.text;
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error("Error fetching character list:", error);
    return [];
  }
};

export const evaluateHandwriting = async (
  character: string,
  imageBase64: string
): Promise<EvaluationResult> => {
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  const prompt = `I am practicing writing '${character}'. Evaluate the image. 
  Scoring: <40 if it's the wrong character or unrecognizable. >70 if correct but shaky (mouse drawing).`;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/png", data: base64Data } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            summary: { type: Type.STRING },
            critique: { type: Type.STRING },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            strokeAccuracy: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
            balance: { type: Type.STRING, enum: ["Poor", "Good", "Excellent"] },
          },
          required: ["score", "summary", "critique", "suggestions", "strokeAccuracy", "balance"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as EvaluationResult;
  } catch (error) {
    console.error("Error evaluating handwriting:", error);
    throw error;
  }
};