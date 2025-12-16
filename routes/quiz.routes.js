import express from 'express'
import {
    getAllQuizData,
    createQuiz,
    getSpecificQuiz,
    createQuestion,
    getSpecificQuestion,
    updateSpecificQuestion,
    deleteSpecificQuestion,
    submitAnswers,
    restartQuiz,
    deleteQuiz,
    updateQuiz
} from '../controllers/quiz.controllers.js';
import { isAdmin, verifyToken, isIdValid } from '../middleware/middlewares.js';

const router = express.Router();




router.get('/', getAllQuizData)
router.route('/:id')
    .get(isIdValid, getSpecificQuiz)
    .delete(isIdValid, verifyToken, isAdmin, deleteQuiz)
    .put(isIdValid, verifyToken, isAdmin, updateQuiz)
router.post('/', verifyToken, isAdmin, createQuiz)
router.post('/:quizId/questions', verifyToken, isAdmin, createQuestion)
router.post('/:quizId/questions/submit', verifyToken, submitAnswers)
router.get('/:quizId/questions/restart', verifyToken, restartQuiz)
router.route('/:quizId/questions/:questionId')
    .get(verifyToken, getSpecificQuestion)
    .put(verifyToken, isAdmin, updateSpecificQuestion)
    .delete(verifyToken, isAdmin, deleteSpecificQuestion)

export default router