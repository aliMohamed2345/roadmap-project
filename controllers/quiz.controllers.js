import { validateQuestionData, validateQuestionQueryString, validateQuizData } from "../utils/validateQuestionData.js";
import Question from "../models/question.model.js";
import Quiz from '../models/quiz.model.js'
import User from "../models/user.model.js";
import mongoose from "mongoose";

/**
 * @swagger
 * /api/v1/quiz:
 *   get:
 *     summary: Get all quizzes
 *     tags: [Quizzes]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required to access this endpoint
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quiz list
 */
export const getAllQuizData = async (req, res) => {
    try {
        const quizData = await Quiz.find().select('title _id description rank');

        if (!quizData.length)
            return res.status(404).json({
                success: false,
                message: "No quizzes available. Please add a new one."
            })


        return res.status(200).json({ success: true, quizData })

    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, message: error.message })
    }
}

/**
 * @swagger
 * /api/v1/quiz/{id}:
 *   get:
 *     summary: Get quiz or specific question
 *     tags: [Quizzes]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required to access this endpoint
 *         schema:
 *           type: string
 *       - in: query
 *         name: question
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Quiz fetched
 */
export const getSpecificQuiz = async (req, res) => {
    try {
        const { id: quizId } = req.params;
        const questionNumber = req.query.question ? parseInt(req.query.question, 10) : null;

        if (!mongoose.Types.ObjectId.isValid(quizId)) {
            return res.status(400).json({ success: false, message: "Invalid quiz ID." });
        }

        const quiz = await Quiz.findById(quizId);

        if (!quiz) {
            return res.status(404).json({ success: false, message: "Quiz not found." });
        }

        // ✅ If the user wants a specific question
        if (questionNumber) {
            if (questionNumber <= 0 || questionNumber > quiz.questions.length) {
                return res.status(400).json({
                    success: false,
                    message: `Question number must be between 1 and ${quiz.questions.length}`,
                });
            }

            const questionId = quiz.questions[questionNumber - 1];
            const currentQuestion = await Question.findById(questionId);

            if (!currentQuestion) {
                return res.status(404).json({
                    success: false,
                    message: `Question ${questionNumber} not found.`,
                });
            }

            return res.status(200).json({
                success: true,
                quizId: quiz._id,
                totalQuestions: quiz.questions.length,
                questionNumber,
                currentQuestion,
            });
        }

        // ✅ If no question query 
        const populatedQuiz = await Quiz.findById(quizId).populate("questions");

        return res.status(200).json({
            success: true,
            quiz: populatedQuiz,
            totalQuestions: quiz.questions.length,
        });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/v1/quiz:
 *   post:
 *     summary: Create a new quiz
 *     tags: [Quizzes]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required to access this endpoint
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [title, description, rank]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               rank:
 *                 type: number
 *     responses:
 *       201:
 *         description: Quiz created successfully
 */
export const createQuiz = async (req, res) => {
    try {
        const { title, description, rank } = req.body;
        //validate the quiz data
        const { isValid, message } = validateQuizData(title, description, rank)
        if (!isValid) return res.status(400).json({ success: false, message })

        const newQuiz = await Quiz.create({ title, description, rank });

        return res.status(201).json({
            success: true,
            message: 'Quiz created successfully.',
            quiz: newQuiz
        });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/v1/quiz/{quizId}/questions:
 *   post:
 *     summary: Create question
 *     tags: [Questions]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required to access this endpoint
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Question created
 */
export const createQuestion = async (req, res) => {
    try {
        const { quizId } = req.params
        const { question, answer, options } = req.body

        //check the validation of the quizId
        if (!mongoose.Types.ObjectId.isValid(quizId)) return res.status(400).json({ success: false, message: 'Invalid Id' });

        //validate the request body
        const { isValid, message } = validateQuestionData(question, answer, options)
        if (!isValid) return res.status(400).json({ success: false, message })

        //checking if the quiz exist 
        const isQuizExist = await Quiz.findById(quizId)
        if (!isQuizExist) return res.status(404).json({ success: false, message: `Quiz not found` })

        const newQuestion = await Question.create({ question, answer, options, quizId })

        //update the new question inside the quiz
        await Quiz.findByIdAndUpdate(quizId, { $push: { questions: newQuestion._id } })

        return res.status(201).json({ success: true, message: `Question created successfully`, newQuestion })
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, message: error.message })
    }
}

/**
 * @swagger
 * /api/v1/questions/{questionId}:
 *   get:
 *     summary: Get specific question by ID
 *     tags: [Questions]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required to access this endpoint
 *         schema:
 *           type: string
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Question fetched successfully
 *       404:
 *         description: Question not found
 */
export const getSpecificQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;

        //checking the validation of the questionId
        if (!mongoose.Types.ObjectId.isValid(questionId)) return res.status(400).json({ success: false, message: 'Invalid Id' });

        const question = await Question.findById(questionId);

        if (!question) return res.status(404).json({ success: false, message: `Question not found` });

        return res.status(200).json({ success: true, question });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * @swagger
 * /api/v1/questions/{questionId}:
 *   put:
 *     summary: Update question
 *     tags: [Questions]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required to access this endpoint
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Question updated
 */
export const updateSpecificQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        const { question, answer, options } = req.body

        //checking the validation of the questionId
        if (!mongoose.Types.ObjectId.isValid(questionId)) return res.status(400).json({ success: false, message: 'Invalid Id' });

        //checking the validation of the request body
        const { isValid, message } = validateQuestionData(question, answer, options)
        if (!isValid) return res.status(400).json({ success: false, message })


        //checking if the question exist 
        const isQuestionExist = await Question.findById(questionId)
        if (!isQuestionExist) return res.status(404).json({ success: false, message: `Question not found` })

        await Question.findByIdAndUpdate(questionId, { question, answer, options }, { new: true })

        return res.status(200).json({ success: true, message: `Question updated successfully` })

    } catch (error) {
        console.error(error.message)
        return res.status(500).json({ success: false, message: error.message })
    }
}

/**
 * @swagger
 * /api/v1/questions/{questionId}:
 *   delete:
 *     summary: Delete question
 *     tags: [Questions]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required to access this endpoint
 *         schema:
 *           type: string
 *       - in: path
 *         name: questionId
 *         required: true
 *     responses:
 *       200:
 *         description: Question deleted
 */
export const deleteSpecificQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;

        //checking the validation of the questionId
        if (!mongoose.Types.ObjectId.isValid(questionId)) return res.status(400).json({ success: false, message: 'Invalid Id' });

        const question = await Question.findByIdAndDelete(questionId)

        if (!question)
            return res.status(404).json({ success: false, message: `Question not found` });


        await Quiz.updateOne(
            { _id: question.quizId },
            { $pull: { questions: questionId } }
        );

        return res.status(200).json({ success: true, message: `Question deleted successfully` })
    } catch (error) {
        console.error(error.message)
        return res.status(500).json({ success: false, message: error.message })
    }
}

/**
 * @swagger
 * /api/v1/quiz/{quizId}/submit:
 *   post:
 *     summary: Submit quiz answers
 *     tags: [Quizzes]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required to access this endpoint
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   properties:
 *                     questionId:
 *                       type: string
 *                     answer:
 *                       type: string
 *     responses:
 *       200:
 *         description: Quiz submitted
 */
export const submitAnswers = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { answers } = req.body;
        const { id: userId } = req.user;

        // Validation
        if (!answers || !Array.isArray(answers) || answers.length === 0)
            return res.status(400).json({ success: false, message: "Please provide a non-empty answers array." });
        if (!mongoose.Types.ObjectId.isValid(quizId))
            return res.status(400).json({ success: false, message: 'Invalid quiz ID.' });

        // Get quiz with questions
        const quiz = await Quiz.findById(quizId).populate('questions');
        if (!quiz)
            return res.status(404).json({ success: false, message: `Quiz not found.` });

        // Calculate results
        let correctAnswers = 0;
        const totalQuestions = quiz.questions.length;

        const answerDetails = quiz.questions.map((question) => {
            const userAnswer = answers.find(a => a.questionId === question._id.toString());
            const isCorrect = userAnswer && userAnswer.answer === question.answer;
            if (isCorrect) correctAnswers++;
            return {
                questionId: question._id,
                question: question.question,
                userAnswer: userAnswer ? userAnswer.answer : null,
                correctAnswer: question.answer,
                isCorrect,
            };
        });

        const wrongAnswers = totalQuestions - correctAnswers;
        const percentage = parseFloat(((correctAnswers / totalQuestions) * 100).toFixed(2));
        //get grade and status
        const { grade, status } = getGrade(percentage)

        // Save progress in user
        const progressData = {
            quiz: quizId,
            percentage,
            totalQuestions,
            correctAnswers,
            wrongAnswers,
            grade,
            status,
        };

        await User.findByIdAndUpdate(userId, {
            $push: { "progressData.quiz": progressData }
        });

        return res.status(200).json({
            success: true,
            message: "Quiz submitted successfully.",
            result: {
                quizId,
                quizTitle: quiz.title,
                totalQuestions,
                correctAnswers,
                wrongAnswers,
                percentage,
                grade,
                status,
                answerDetails,
            },
        });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/v1/quiz/{quizId}/restart:
 *   post:
 *     summary: Restart quiz
 *     tags: [Quizzes]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required to access this endpoint
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quiz restarted
 */
export const restartQuiz = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { quizId } = req.params;

        // Validate quizId
        if (!quizId) {
            return res.status(400).json({ success: false, message: "Quiz ID is required." });
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found." });

        // Remove that quiz progress
        user.progressData.quiz = user.progressData.quiz.filter(
            q => q.quiz.toString() !== quizId
        );

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Quiz progress has been reset. You can now restart the quiz."
        });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/v1/quiz/{id}:
 *   delete:
 *     summary: Delete quiz
 *     tags: [Quizzes]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required to access this endpoint
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Quiz deleted successfully
 */
export const deleteQuiz = async (req, res) => {
    try {
        const { id } = req.params;

        //  Find quiz first
        const quiz = await Quiz.findById(id);
        if (!quiz) {
            return res.status(404).json({ success: false, message: "Quiz not found." });
        }

        // Delete all questions linked to this quiz
        await Question.deleteMany({ quizId: id });

        // Remove quiz references from all users' progressData
        await User.updateMany(
            { "progressData.quiz.quiz": id },
            { $pull: { "progressData.quiz": { quiz: id } } }
        );

        // Delete the quiz itself
        await Quiz.findByIdAndDelete(id);

        // Return response
        return res.status(200).json({
            success: true,
            message: "Quiz, its questions, and user references deleted successfully.",
        });
    } catch (error) {
        console.error("Error deleting quiz:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/v1/quiz/{id}:
 *   put:
 *     summary: Update quiz
 *     tags: [Quizzes]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required to access this endpoint
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               rank:
 *                 type: number
 *     responses:
 *       200:
 *         description: Quiz updated successfully
 */
export const updateQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, rank } = req.body;

        //validate the quiz data 
        const { isValid, message } = validateQuizData(title, description, rank)
        if (!isValid) return res.status(400).json({ success: false, message })

        const isQuizExist = await Quiz.findById(id)
        if (!isQuizExist) return res.status(404).json({ success: false, message: `Quiz not found` })

        const updatedQuiz = await Quiz.findByIdAndUpdate(id, { title, description, rank }, { new: true })

        return res.status(200).json({ success: true, message: "Quiz updated successfully.", updatedQuiz });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * @swagger
 * /api/v1/quiz/{quizId}/questions:
 *   get:
 *     summary: Get all questions from a specific quiz
 *     tags: [Quizzes]
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         description: The ID of the quiz to fetch questions from
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         required: false
 *         description: Page number for pagination (default: 1)
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Number of questions per page (default: 10)
 *         schema:
 *           type: integer
 *       - in: query
 *         name: q
 *         required: false
 *         description: Search term to filter questions by text
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         required: false
 *         description: Field to sort questions by (default: createdAt)
 *         schema:
 *           type: string
 *       - in: query
 *         name: random
 *         required: false
 *         description: If true, returns random questions instead of paginated results
 *         schema:
 *           type: string
 *           enum: [true, false]
 *     responses:
 *       200:
 *         description: Successfully retrieved questions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 mode:
 *                   type: string
 *                   description: "random or paginated"
 *                 totalQuestions:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       question:
 *                         type: string
 *                       answer:
 *                         type: string
 *                       options:
 *                         type: array
 *                         items:
 *                           type: string
 *       400:
 *         description: Invalid query parameters or quiz ID
 *       404:
 *         description: No questions found for this quiz
 *       500:
 *         description: Internal server error
 */
export const getAllQuestionsFromQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        const {
            page = 1,
            limit = 10,
            q,
            sort = "createdAt",
            random = "false",
        } = req.query;

        const { isValid, message } = validateQuestionQueryString(page, limit, q, sort, random)
        if (!isValid) return res.status(400).json({ success: false, message })

        if (!mongoose.Types.ObjectId.isValid(quizId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quiz ID"
            });
        }

        const filter = {
            quizId: new mongoose.Types.ObjectId(quizId)
        };

        if (q) {
            filter.question = { $regex: q, $options: "i" };
        }

        if (random === "true") {
            const randomCount = parseInt(limit) || 10;

            const questions = await Question.aggregate([
                { $match: filter },
                { $sample: { size: randomCount } }
            ]);

            if (!questions.length) {
                return res.status(404).json({
                    success: false,
                    message: "No questions found for this quiz"
                });
            }

            return res.status(200).json({
                success: true,
                mode: "random",
                total: questions.length,
                questions
            });
        }

        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(limit) || 10;

        const total = await Question.countDocuments(filter);
        const skipNumber = (pageNumber - 1) * limitNumber

        const questions = await Question.find(filter)
            .sort({ [sort]: -1 })
            .skip(skipNumber)
            .limit(limitNumber);

        if (!questions.length) {
            return res.status(404).json({
                success: false,
                message: "No questions found in this quiz"
            });
        }

        return res.status(200).json({
            success: true,
            mode: "paginated",
            page: pageNumber,
            totalPages: Math.ceil(total / limitNumber),
            totalQuestions: total,
            questions
        });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};