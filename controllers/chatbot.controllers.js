import AI, { AIChat } from "../lib/ai.js";
import { aiChatBotPrompt } from "../utils/prompts.js";
/**
 * @swagger
 * /api/v1/chatbot:
 *   post:
 *     summary: Chat with AI roadmap assistant
 *     tags: [AI Chatbot]
 *     description: |
 *       Sends a user message (and optional conversation history) to the AI
 *       roadmap assistant and returns a structured JSON response.
 *       The AI acts as a learning mentor for programming and technical skills.
 *
 *       Pass `history` to maintain a consistent, multi-turn conversation.
 *       The client is responsible for storing and forwarding the history with
 *       every request. The server is stateless — memory lives in the client
 *       and resets whenever the client discards it (e.g. tab/app close).
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: What is Node.js?
 *                 description: Current user message to the AI chatbot.
 *               history:
 *                 type: array
 *                 description: |
 *                   Previous conversation turns, oldest first.
 *                   Omit or send [] for the first message.
 *                 items:
 *                   type: object
 *                   required: [role, text]
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, model]
 *                     text:
 *                       type: string
 *
 *     responses:
 *       200:
 *         description: AI response generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Node.js is a JavaScript runtime...
 *
 *       400:
 *         description: Missing or invalid request body
 *       500:
 *         description: AI error or internal server error
 */
export const aiChatBot = async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Message is required",
            });
        }

        // Sanitise history: must be an array of { role, text } objects.
        // Unknown roles or malformed entries are silently dropped so a bad
        // client payload never crashes the request.
        const validHistory = Array.isArray(history)
            ? history.filter(
                (h) =>
                    h &&
                    typeof h.role === "string" &&
                    typeof h.text === "string" &&
                    (h.role === "user" || h.role === "model") &&
                    h.text.trim().length > 0
            )
            : [];

        const systemInstruction = aiChatBotPrompt();

        const aiResponse = await AIChat({
            userMessage: message,
            history: validHistory,
            systemInstruction,
        });

        if (!aiResponse) {
            return res.status(500).json({
                success: false,
                message: "AI returned empty response",
            });
        }

        const cleanedResponse = aiResponse
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .replace(/\n/g, " ")
            .trim();

        let parsedResponse;

        try {
            parsedResponse = JSON.parse(cleanedResponse);
        } catch {
            return res.status(500).json({
                success: false,
                message: "AI returned invalid JSON",
            });
        }

        return res.status(200).json({
            success: true,
            message: parsedResponse.message,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
