import { Router } from "express";
import { aiChatBot } from "../controllers/chatbot.controllers.js";
const router = Router();
router.post('/', aiChatBot);


export default router