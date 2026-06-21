import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export default async function AI(prompt) {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `${prompt}`,
    });

    console.log(response.text);
    return response.text;
}


export async function AIChat({ userMessage, history = [], systemInstruction = "" }) {
    const contents = [];

    // Rebuild previous turns in the exact format Gemini expects.
    // - User turns  : keep the "USER_MESSAGE:" prefix the system prompt describes.
    // - Model turns : wrap the stored reply text back into the JSON envelope
    //                 so history mirrors what the AI actually produced.
    for (const msg of history) {
        const formattedText =
            msg.role === "user"
                ? `USER_MESSAGE:\n${msg.text}`
                : JSON.stringify({ message: msg.text });

        contents.push({
            role: msg.role, // "user" | "model"
            parts: [{ text: formattedText }],
        });
    }

    // Append the new user message, matching the INPUT FORMAT the system
    // prompt tells the model it will receive.
    contents.push({
        role: "user",
        parts: [
            {
                text:
                    `====================\nUSER INPUT\n====================\n\n` +
                    `USER_MESSAGE:\n${userMessage}`,
            },
        ],
    });

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
            systemInstruction,
        },
    });

    console.log(response.text);
    return response.text;
}

