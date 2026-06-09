import AI from "../lib/ai.js";
import { aiChatBotPrompt } from "../utils/prompts.js";

/**
 * @swagger
 * /api/v1/chatbot:
 *   post:
 *     summary: Chat with AI roadmap assistant
 *     tags: [AI Chatbot]
 *     description: |
 *       Sends a user message to the AI roadmap assistant and returns a structured JSON response.
 *       The AI acts as a learning mentor for programming and technical skills.
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
 *                 description: User question or message to the AI chatbot
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
 *                   example: Node.js is a JavaScript runtime that allows JavaScript to run outside the browser...
 *
 *       400:
 *         description: Missing message in request body
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Message is required
 *
 *       500:
 *         description: AI error or internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: AI returned invalid JSON
 */
export const aiChatBot = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Message is required"
            });
        }

        const systemPrompt = aiChatBotPrompt();

        const finalPrompt = `
${systemPrompt}

====================
USER INPUT
====================

USER_MESSAGE:
${message}
`;

        const aiResponse = await AI(finalPrompt);

        if (!aiResponse) {
            return res.status(500).json({
                success: false,
                message: "AI returned empty response"
            });
        }

        const cleanedResponse = aiResponse
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .replace(/\n/g, " ") // 🔥 important fix
            .trim();

        let parsedResponse;

        try {
            parsedResponse = JSON.parse(cleanedResponse);
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "AI returned invalid JSON"
            });
        }

        return res.status(200).json({
            success: true,
            message: parsedResponse.message
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};