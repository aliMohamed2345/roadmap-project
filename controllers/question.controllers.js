import { validateCreationQuestionData, validateQuestionData, validateQuestionQueryString } from "../utils/validateQuestionData.js";
import Question from "../models/question.model.js";
import Quiz from "../models/quiz.model.js";
import mongoose from 'mongoose'
import AI from "../lib/ai.js";
import { explainAnswerPrompt, generateQuestionsPrompt } from "../utils/prompts.js";

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
 *         schema:
 *           type: string
 *         description: Quiz ID
 *
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of questions per page
 *
 *       - in: query
 *         name: q
 *         required: false
 *         schema:
 *           type: string
 *         description: Search term to filter questions
 *
 *       - in: query
 *         name: sort
 *         required: false
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field used for sorting questions
 *
 *       - in: query
 *         name: random
 *         required: false
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: false
 *         description: Return random questions instead of paginated result
 *
 *     responses:
 *       200:
 *         description: Successfully retrieved questions
 *       400:
 *         description: Invalid query parameters or quiz ID
 *       404:
 *         description: No questions found
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

        const { isValid, message } = validateQuestionQueryString(page, limit, q, sort, random);
        if (!isValid) return res.status(400).json({ success: false, message });

        if (!mongoose.Types.ObjectId.isValid(quizId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quiz ID"
            });
        }

        if (req.user) {
            const user = await User.findById(req.user.id);
            if (user) {
                const existingEntry = user.progressData.quiz.find(
                    q => q.quiz.toString() === quizId
                );

                if (!existingEntry) {
                    user.progressData.quiz.push({
                        quiz: quizId,
                        startedAt: new Date()
                    });
                    await user.save();
                } else if (!existingEntry.startedAt) {
                    existingEntry.startedAt = new Date();
                    await user.save();
                }
            }
        }

        const filter = {
            quizId: new mongoose.Types.ObjectId(quizId)
        };

        if (q) {
            filter.question = { $regex: q, $options: "i" };
        }

        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(limit) || 10;
        const skipNumber = (pageNumber - 1) * limitNumber;

        const total = await Question.countDocuments(filter);

        let questions;

        if (random === "true") {
            questions = await Question.aggregate([
                { $match: filter },
                { $sample: { size: limitNumber } }
            ]);
        } else {
            questions = await Question.find(filter)
                .sort({ [sort]: -1 })
                .skip(skipNumber)
                .limit(limitNumber);
        }

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
        const { isValid, message } = validateCreationQuestionData(question, answer, options)
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
 * /api/v1/quiz/{quizId}/questions/bulk:
 *   post:
 *     summary: Create multiple questions at once
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *         description: Quiz ID
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
 *             type: object
 *             properties:
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [question, answer, options]
 *                   properties:
 *                     question:
 *                       type: string
 *                     answer:
 *                       type: string
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *     responses:
 *       201:
 *         description: Questions created successfully
 *       400:
 *         description: Invalid input or quiz ID
 *       404:
 *         description: Quiz not found
 *       500:
 *         description: Internal server error
 */
export const createMultipleQuestions = async (req, res) => {

    try {
        const { quizId } = req.params;
        const { questions } = req.body;


        // Check if questions array exists and is not empty
        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Questions array is required and cannot be empty"
            });
        }

        // Validate each question
        for (let i = 0; i < questions.length; i++) {
            const { question, answer, options } = questions[i];
            const { isValid, message } = validateCreationQuestionData(question, answer, options);

            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    message: `Validation failed for question at index ${i}: ${message}`
                });
            }
        }
        questions.map((questionItem) => {
            const { question, answer, options } = questionItem;
            const { isValid, message } = validateCreationQuestionData(question, answer, options);

            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    message: `Validation failed for question at index ${i}: ${message}`
                });
            }
        })

        // Check if quiz exists
        const isQuizExist = await Quiz.findById(quizId);
        if (!isQuizExist) {
            return res.status(404).json({
                success: false,
                message: "Quiz not found"
            });
        }

        // Prepare questions with quizId
        const questionsToCreate = questions.map(q => ({
            ...q,
            quizId: new mongoose.Types.ObjectId(quizId)
        }));

        // Bulk create questions
        const createdQuestions = await Question.insertMany(questionsToCreate);

        // Update quiz with all new question IDs
        const questionIds = createdQuestions.map(q => q._id);

        await Quiz.findByIdAndUpdate(
            quizId,
            { $push: { questions: { $each: questionIds } } }
        );

        return res.status(201).json({
            success: true,
            message: `${createdQuestions.length} questions created successfully`,
            count: createdQuestions.length,
            questions: createdQuestions
        });

    } catch (error) {
        console.error(error.message)
        return res.status(500).json({ success: false, message: error.message })
    }
}

/**
 * @swagger
 * /api/v1/quiz/{quizId}/questions/generate-questions:
 *   post:
 *     summary: Generate quiz questions using AI
 *     tags: [Questions, AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *         description: Quiz ID
 *
 *       - in: query
 *         name: number
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *           maximum: 20
 *         description: Number of questions to generate
 *
 *     responses:
 *       201:
 *         description: Questions generated and added to the quiz successfully
 *       400:
 *         description: Invalid quiz ID or invalid number of questions
 *       404:
 *         description: Quiz not found
 *       500:
 *         description: AI generation failed or internal server error
 */
export const generateAIQuestions = async (req, res) => {
    try {
        const { quizId } = req.params;
        const questionNumber = +(req.query.number ?? 1);

        // Validate question number
        if (
            isNaN(questionNumber) ||
            questionNumber < 1 ||
            questionNumber > 20
        ) {
            return res.status(400).json({
                success: false,
                message: "Number of questions should be between 1 and 20",
            });
        }

        const quiz = await Quiz.findById(quizId)

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: "Quiz not found",
            });
        }

        const prompt = generateQuestionsPrompt(
            quiz.title,
            questionNumber,
        );

        const aiResponse = await AI(prompt);

        // Remove markdown if Gemini adds it
        const cleanedResponse = aiResponse
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        let parsedResponse;

        try {
            parsedResponse = JSON.parse(cleanedResponse);
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "AI returned invalid JSON",
            });
        }

        // Validate AI structure
        if (
            !parsedResponse.questions ||
            !Array.isArray(parsedResponse.questions)
        ) {
            return res.status(500).json({
                success: false,
                message: "Invalid AI response structure",
            });
        }

        const questionsToCreate = parsedResponse.questions.map((q) => ({
            question: q.question,
            options: q.options,
            answer: q.answer,
            quizId: quiz._id,
        }));

        // Insert questions
        const createdQuestions = await Question.insertMany(
            questionsToCreate
        );

        const questionIds = createdQuestions.map((q) => q._id);

        // Update quiz
        await Quiz.findByIdAndUpdate(quizId, {
            $push: {
                questions: {
                    $each: questionIds,
                },
            },
        });

        return res.status(201).json({
            success: true,
            message: `${createdQuestions.length} questions created successfully`,
            questionsNumber: createdQuestions.length,
            questions: createdQuestions,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * @swagger
 * /api/v1/quiz/{quizId}/questions/{questionId}/explain-question:
 *   post:
 *     summary: Generate an AI explanation for a question's correct answer
 *     tags: [Questions, AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *         description: Quiz ID
 *
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *
 *     responses:
 *       200:
 *         description: Question explanation generated successfully
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
 *                   example: Question explained successfully
 *                 question:
 *                   type: string
 *                   example: What is Node.js?
 *                 correctAnswer:
 *                   type: string
 *                   example: A JavaScript runtime environment
 *                 explanation:
 *                   type: string
 *                   example: Node.js allows JavaScript to run outside the browser using Google's V8 engine.
 *
 *       400:
 *         description: Invalid question ID
 *       404:
 *         description: Question not found
 *       500:
 *         description: AI explanation failed or internal server error
 */
export const explainQuestionAI = async (req, res) => {
    try {
        const { questionId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(questionId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid question id",
            });
        }

        const question = await Question.findById(questionId);

        if (!question) {
            return res.status(404).json({
                success: false,
                message: "Question not found",
            });
        }

        // Generate Prompt
        const prompt = explainAnswerPrompt(
            question.question,
            question.options,
            question.answer
        );

        const aiResponse = await AI(prompt);

        // Remove Markdown if Gemini adds it
        const cleanedResponse = aiResponse
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        let parsedResponse;

        // Parse JSON
        try {
            parsedResponse = JSON.parse(cleanedResponse);
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "AI returned invalid JSON",
            });
        }

        // Validate Response Structure
        if (
            !parsedResponse.question ||
            !parsedResponse.correctAnswer ||
            !parsedResponse.explanation
        ) {
            return res.status(500).json({
                success: false,
                message: "Invalid AI response structure",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Question explained successfully",
            question: parsedResponse.question,
            correctAnswer: parsedResponse.correctAnswer,
            explanation: parsedResponse.explanation,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};