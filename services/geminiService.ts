import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      }
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const extractPatientNameFromImage = async (file: File): Promise<string> => {
  if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set.");
    // In a real app, you might throw an error or handle this more gracefully.
    // For this demo, we'll return "Unknown" and let the user input the name.
    return "Unknown";
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const imagePart = await fileToGenerativePart(file);
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          parts: [
            imagePart,
            { text: "Extract the patient's full name from this medical document." },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "The full name of the patient.",
            },
          },
          required: ["name"],
        },
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    
    return result.name || "Unknown";
  } catch (error) {
    console.error("Error extracting patient name from Gemini:", error);
    return "Unknown";
  }
};
