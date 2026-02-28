import { validateQuestionData, validateQuestionQueryString } from "../utils/validateQuestionData.js";
import Question from "../models/question.model.js";
import Quiz from "../models/quiz.model.js";
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