import express from 'express'
import {
    getAllQuizData,
    createQuiz,
    getSpecificQuiz,
    submitAnswers,
    restartQuiz,
    deleteQuiz,
    updateQuiz,
} from '../controllers/quiz.controllers.js';
import { isAdmin, verifyToken, isIdValid } from '../middleware/middlewares.js';
import {
    createQuestion,
    deleteSpecificQuestion,
    getAllQuestionsFromQuiz,
    getSpecificQuestion,
    updateSpecificQuestion
} from '../controllers/question.controllers.js';

const router = express.Router();

router.get('/', getAllQuizData)

router.route('/:id')
    .get(isIdValid, getSpecificQuiz)
    .delete(isIdValid, verifyToken, isAdmin, deleteQuiz)
    .put(isIdValid, verifyToken, isAdmin, updateQuiz)

router.post('/', verifyToken, isAdmin, createQuiz)

router.post('/:quizId/questions/submit', verifyToken, submitAnswers)

router.get('/:quizId/questions/restart', verifyToken, restartQuiz)

router.route('/:quizId/questions')
    .post(verifyToken, isAdmin, createQuestion)
    .get(verifyToken, getAllQuestionsFromQuiz)

router.route('/:quizId/questions/:questionId')
    .get(verifyToken, getSpecificQuestion)
    .put(verifyToken, isAdmin, updateSpecificQuestion)
    .delete(verifyToken, isAdmin, deleteSpecificQuestion)

export default router