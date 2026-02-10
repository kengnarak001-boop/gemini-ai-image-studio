import { GoogleGenAI } from "@google/genai";

export async function generateGeminiImage(prompt: string): Promise<string> {
  // Always create fresh instance to ensure correct API key usage
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    const candidate = response.candidates?.[0];
    if (!candidate || !candidate.content?.parts) {
      throw new Error("API did not return image data");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No inline image data found in response parts");
  } catch (error: any) {
    console.error("Gemini Image Service Error:", error);
    const msg = error.message || "";
    
    if (msg.includes('Requested entity was not found') || msg.includes('404')) {
      throw new Error("AUTH_REQUIRED: บัญชีหรือโปรเจกต์นี้ไม่สามารถเข้าถึงโมเดลภาพได้ โปรดเลือกบัญชีใหม่");
    }
    
    if (msg.includes('quota') || msg.includes('429')) {
      throw new Error("โควตาของบัญชีนี้เต็มแล้ว โปรดสลับไปใช้บัญชีอื่นที่มีเครดิตเหลือ");
    }

    if (msg.includes('API key not valid')) {
      throw new Error("AUTH_REQUIRED: รหัสลับไม่ถูกต้อง โปรดสลับบัญชีใหม่อีกครั้ง");
    }

    throw new Error(msg || "เกิดข้อผิดพลาดในการเชื่อมต่อ โปรดลองใหม่อีกครั้ง");
  }
}