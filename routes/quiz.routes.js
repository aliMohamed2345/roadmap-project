import express from 'express'
import {
    getAllQuizData,
    createQuiz,
    getSpecificQuiz,
    submitAnswers,
    restartQuiz,
    deleteQuiz,
    updateQuiz,
    exportQuizToCSV,
    exportQuizToJSON,
    exportQuizToPDF
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

router.route('/')
    .get(getAllQuizData)
    .post(verifyToken, isAdmin, createQuiz)

router.route('/:id')
    .get(isIdValid, getSpecificQuiz)
    .delete(isIdValid, verifyToken, isAdmin, deleteQuiz)
    .put(isIdValid, verifyToken, isAdmin, updateQuiz)

router.get('/:id/export/json', isIdValid, verifyToken, exportQuizToJSON)

router.get('/:id/export/pdf', isIdValid, verifyToken, exportQuizToPDF)

router.get('/:id/export/csv', isIdValid, verifyToken, exportQuizToCSV)

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