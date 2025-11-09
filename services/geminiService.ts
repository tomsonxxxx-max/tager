
import { GoogleGenAI, Type, Chat, Modality } from "@google/genai";
import { Track, ChatMessage, GroundingChunk, WaveformSegment } from './types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY is not set in environment variables");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const analyzeTrackWithAI = async (track: Track): Promise<Partial<Track>> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: `Przeanalizuj metadane tego utworu muzycznego i zasugeruj bardziej szczegółowe tagi. Zwróć odpowiedź w formacie JSON.
      Oto dane:
      Tytuł: ${track.title}
      Artysta: ${track.artist}
      Gatunek: ${track.genre}
      BPM: ${track.bpm}
      Tonacja: ${track.key}

      Zwróć JSON z następującymi kluczami: 'genre' (bardziej szczegółowy podgatunek), 'mood' (np. 'energetyczny', 'mroczny', 'melodyjny', 'taneczny'), 'energy' (w skali 1-100).`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                genre: { type: Type.STRING },
                mood: { type: Type.STRING },
                energy: { type: Type.INTEGER }
            }
        },
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });
    const resultJson = JSON.parse(response.text);
    return resultJson as Partial<Track>;
  } catch (error) {
    console.error("Błąd podczas analizy utworu:", error);
    return {};
  }
};

export const generatePlaylistOrderWithAI = async (tracks: Track[]): Promise<Track[]> => {
    const tracklistString = tracks.map((t, i) => `${i + 1}. ${t.artist} - ${t.title} (BPM: ${t.bpm}, Key: ${t.key})`).join('\n');
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: `Jesteś światowej klasy DJ-em. Twoim zadaniem jest ułożenie poniższej listy utworów w optymalnej kolejności do seta, bazując na miksowaniu harmonicznym (koło Camelot) i przepływie energii (energy flow).
            Oto lista utworów:
            ${tracklistString}
            
            Zwróć listę posortowanych numerów (indeksów z oryginalnej listy), oddzielonych przecinkami, np. "3,1,4,2". Nie dodawaj żadnego innego tekstu.`,
            config: {
                thinkingConfig: { thinkingBudget: 32768 }
            }
        });
        const orderStr = response.text.trim();
        const order = orderStr.split(',').map(n => parseInt(n.trim(), 10) - 1);
        
        if (order.length !== tracks.length || order.some(isNaN)) {
            console.error("AI zwróciło nieprawidłowy format kolejności. Zwracam oryginalną kolejność.");
            return tracks;
        }

        const sortedTracks = order.map(i => tracks[i]);
        return sortedTracks;

    } catch (error) {
        console.error("Błąd podczas generowania kolejności playlisty:", error);
        return tracks;
    }
};

export const findSimilarTracks = async (targetTrack: Track, allTracks: Track[]): Promise<Track[]> => {
  const candidates = allTracks.filter(t => t.id !== targetTrack.id);
  if (candidates.length === 0) return [];

  const prompt = `
    Jesteś ekspertem w dziedzinie muzyki i DJ-ingu. Twoim zadaniem jest znalezienie 5 utworów z poniższej listy, które są najbardziej podobne do utworu docelowego. 
    Analizuj gatunek, nastrój (jeśli dostępny), energię (jeśli dostępna), BPM i tonację (zgodność harmoniczna wg koła Camelot).

    Utwór docelowy:
    - ID: ${targetTrack.id}
    - Tytuł: ${targetTrack.title}
    - Artysta: ${targetTrack.artist}
    - Gatunek: ${targetTrack.genre}
    - BPM: ${targetTrack.bpm}
    - Tonacja: ${targetTrack.key}
    - Energia: ${targetTrack.energy || 'N/A'}
    - Nastrój: ${targetTrack.mood || 'N/A'}

    Lista kandydatów do przeszukania:
    ${candidates.map(t => `- ID: ${t.id}, Tytuł: ${t.title}, Artysta: ${t.artist}, Gatunek: ${t.genre}, BPM: ${t.bpm}, Tonacja: ${t.key}, Energia: ${t.energy || 'N/A'}`).join('\n')}

    Zwróć tylko listę 5 ID najbardziej podobnych utworów, oddzielonych przecinkami, bez żadnego dodatkowego tekstu. Na przykład: "10,25,4,18,3".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });

    const idsStr = response.text.trim();
    const similarIds = idsStr.split(',').map(id => parseInt(id.trim(), 10));

    return similarIds
        .map(id => allTracks.find(t => t.id === id))
        .filter((t): t is Track => !!t);

  } catch (error) {
    console.error("Błąd podczas wyszukiwania podobnych utworów:", error);
    return [];
  }
};

export const getAutoCompleteMetadata = async (track: Track): Promise<Partial<Track>> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Znajdź brakujące metadane dla utworu: Artysta: "${track.artist}", Tytuł: "${track.title}". Skup się na znalezieniu roku wydania (year) i bardziej precyzyjnego gatunku (genre). Zwróć odpowiedź w formacie JSON, np. {"year": 2023, "genre": "Tech House"}.`,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });
        // Attempt to parse text, cleaning it up first
        const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const resultJson = JSON.parse(cleanedText);
        return resultJson as Partial<Track>;
    } catch (error) {
        console.error("Błąd podczas autouzupełniania metadanych:", error);
        return {};
    }
}

export const getWaveformColorData = async (track: Track): Promise<WaveformSegment[]> => {
    const prompt = `Przeanalizuj strukturę utworu na podstawie jego metadanych i zasugeruj uproszczony, procentowy rozkład jego części. Utwór to: ${track.genre} - ${track.title} o BPM ${track.bpm}.
    Zwróć tablicę obiektów JSON, gdzie każdy obiekt ma klucz "type" (jedna z wartości: 'bass', 'percussion', 'vocal', 'break') i "percentage" (wartość numeryczna). Suma wszystkich "percentage" musi wynosić 100.
    Przykład dla utworu House: [{"type": "bass", "percentage": 40}, {"type": "percussion", "percentage": 30}, {"type": "vocal", "percentage": 20}, {"type": "break", "percentage": 10}]`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING },
                            percentage: { type: Type.NUMBER }
                        },
                         required: ['type', 'percentage']
                    }
                }
            }
        });
        const resultJson = JSON.parse(response.text);
        return resultJson as WaveformSegment[];
    } catch (error) {
        console.error("Błąd podczas generowania danych waveform:", error);
        // Zwróć domyślną strukturę w razie błędu
        return [
            { type: 'bass', percentage: 50 },
            { type: 'percussion', percentage: 50 }
        ];
    }
};

let chatInstance: Chat | null = null;

const getChatInstance = () => {
    if (!chatInstance) {
        chatInstance = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: 'Jesteś pomocnym asystentem w aplikacji Lumbago Music AI. Odpowiadasz na pytania dotyczące muzyki, teorii muzycznej i technik DJ-skich. Mów po polsku.',
            }
        });
    }
    return chatInstance;
}

export const sendMessageToChat = async (message: string): Promise<string> => {
    try {
        const chat = getChatInstance();
        const response = await chat.sendMessage({ message });
        return response.text;
    } catch (error) {
        console.error("Błąd podczas wysyłania wiadomości do czatu:", error);
        return "Przepraszam, wystąpił błąd. Spróbuj ponownie.";
    }
};

export const getUpToDateInfo = async (query: string): Promise<{ text: string, sources: GroundingChunk[] }> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: query,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });

        const text = response.text;
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        return { text, sources: sources as GroundingChunk[] };
    } catch (error) {
        console.error("Błąd podczas wyszukiwania informacji:", error);
        return { text: "Nie udało się pobrać informacji.", sources: [] };
    }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || null;
    } catch (error) {
        console.error("Błąd podczas generowania mowy:", error);
        return null;
    }
};

export const editImageWithAI = async (
  imageBase64: string,
  mimeType: string,
  prompt: string
): Promise<string | null> => {
  try {
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    };
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [imagePart, textPart],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Błąd podczas edycji obrazu:", error);
    return null;
  }
};