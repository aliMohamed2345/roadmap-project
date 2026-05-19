import { validateQuizData, validateUpdateQuizData } from "../utils/validateQuestionData.js";
import Question from "../models/question.model.js";
import Quiz from '../models/quiz.model.js'
import User from "../models/user.model.js";
import mongoose from "mongoose";
import { getGrade } from "../utils/getGrade.js";
import {
    PDF_COLORS,
    PDF_FONTS,
    PDF_SIZES,
    fillBackground,
    drawRoundedRect,
    RANK_COLORS
} from "../utils/PDFBuilder.js";
import { Parser } from "json2csv";
import PDFDocument from 'pdfkit'
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
                rank: quiz.rank
            });
        }

        // ✅ If no question query 
        const populatedQuiz = await Quiz.findById(quizId).select('title _id description rank').populate("questions");

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
        const { title, description, rank, tags } = req.body;
        //validate the quiz data
        const { isValid, message } = validateQuizData(title, description, rank, tags)
        if (!isValid) return res.status(400).json({ success: false, message })

        const newQuiz = await Quiz.create({ title, description, rank, tags });

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
        const { title, description, rank, tags } = req.body;

        //validate the quiz data 
        const { isValid, message } = validateUpdateQuizData(title, description, rank, tags)
        if (!isValid) return res.status(400).json({ success: false, message })

        const isQuizExist = await Quiz.findById(id)
        if (!isQuizExist) return res.status(404).json({ success: false, message: `Quiz not found` })

        const updatedData = {}

        if (title !== undefined) {
            updatedData.title = title.trim()
        }

        if (description !== undefined) {
            updatedData.description =
                description.trim()
        }

        if (rank !== undefined) {
            updatedData.rank = rank
        }

        if (tags !== undefined) {
            updatedData.tags = tags
        }

        const updatedQuiz = await Quiz.findByIdAndUpdate(id, updatedData, { new: true })

        return res.status(200).json({ success: true, message: "Quiz updated successfully.", updatedQuiz });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
}


/**
 * @swagger
 * /api/v1/quiz/{id}/export/json:
 *   get:
 *     summary: Export a quiz and its questions as a JSON file
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The quiz ID to export
 *     responses:
 *       200:
 *         description: JSON file download
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Quiz not found
 *       500:
 *         description: Server error
 */
export const exportQuizToJSON = async (req, res) => {
    try {
        const { id: quizId } = req.params;
        const quiz = await Quiz.findById(quizId).populate("questions");

        if (!quiz)
            return res.status(404).json({ success: false, message: "Quiz not found." });

        const payload = {
            exported_at: new Date().toISOString(),
            quiz: {
                id: quiz._id,
                title: quiz.title,
                description: quiz.description,
                rank: quiz.rank,
                total_questions: quiz.questions.length,
                questions: quiz.questions.map((q, index) => ({
                    number: index + 1,
                    id: q._id,
                    question: q.question,
                    options: q.options ?? [],
                    answer: q.answer,
                })),
            },
        };

        const filename = `${quiz.title.replace(/\s+/g, "_")}_quiz.json`;
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        return res.status(200).json(payload);
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/v1/quiz/{id}/export/pdf:
 *   get:
 *     summary: Export a quiz and its questions as a styled PDF file
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The quiz ID to export
 *     responses:
 *       200:
 *         description: PDF file download
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Quiz not found
 *       500:
 *         description: Server error
 */
export const exportQuizToPDF = async (req, res) => {
    try {
        const { id: quizId } = req.params;
        const quiz = await Quiz.findById(quizId).populate("questions");
        if (!quiz)
            return res.status(404).json({ success: false, message: "Quiz not found." });

        const { pageWidth, pageHeight, marginX, marginY, contentWidth } = PDF_SIZES;

        const doc = new PDFDocument({
            size: "A4",
            margins: { top: marginY, bottom: marginY, left: marginX, right: marginX },
            bufferPages: true,
            info: {
                Title: quiz.title,
                Author: "MERN Roadmap Platform",
                Subject: "Quiz Export",
            },
        });

        const filename = `${quiz.title.replace(/\s+/g, "_")}_quiz.pdf`;
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        doc.pipe(res);

        // ── Page 1 background ─────────────────────────────────────────────────
        fillBackground(doc);

        // ── Header ────────────────────────────────────────────────────────────
        const HEADER_H = 160;
        drawRoundedRect(doc, 0, 0, pageWidth, HEADER_H, 0, PDF_COLORS.surface);
        doc.rect(0, 0, 5, HEADER_H).fillColor(PDF_COLORS.accent).fillOpacity(1).fill();

        // Decorative circles
        doc.save().circle(pageWidth - 60, 30, 80).fillColor(PDF_COLORS.accentSoft).fillOpacity(0.06).fill().restore();
        doc.save().circle(pageWidth - 20, 80, 50).fillColor(PDF_COLORS.accentSoft).fillOpacity(0.05).fill().restore();

        // Platform label
        doc
            .fillColor(PDF_COLORS.accentSoft).fillOpacity(1)
            .font(PDF_FONTS.body).fontSize(10)
            .text("MERN ROADMAP PLATFORM", marginX + 10, marginY, { characterSpacing: 1.5 });

        // Quiz title — measure height to avoid cursor drift
        const titleText = quiz.title;
        const titleWidth = contentWidth - 60;
        doc.font(PDF_FONTS.heading).fontSize(24);
        const titleHeight = doc.heightOfString(titleText, { width: titleWidth });

        doc
            .fillColor(PDF_COLORS.textPrimary).fillOpacity(1)
            .font(PDF_FONTS.heading).fontSize(24)
            .text(titleText, marginX + 10, marginY + 22, { width: titleWidth, lineBreak: true });

        const afterTitleY = marginY + 22 + titleHeight + 10;


        const rankColor = RANK_COLORS[quiz.rank] ?? PDF_COLORS.accent;
        const rankLabel = quiz.rank ?? "Unranked";
        doc.font(PDF_FONTS.bold).fontSize(10);
        const rankW = doc.widthOfString(rankLabel) + 22;
        doc.save().roundedRect(marginX + 10, afterTitleY, rankW, 22, 5)
            .fillColor(rankColor).fillOpacity(0.15).fill().restore();
        doc
            .fillColor(rankColor).fillOpacity(1)
            .font(PDF_FONTS.bold).fontSize(10)
            .text(rankLabel, marginX + 21, afterTitleY + 6, { lineBreak: false });

        // Total questions badge
        const totalLabel = `${quiz.questions.length} Questions`;
        doc.font(PDF_FONTS.bold).fontSize(10);
        const totalW = doc.widthOfString(totalLabel) + 22;
        const totalX = marginX + 10 + rankW + 8;
        doc.save().roundedRect(totalX, afterTitleY, totalW, 22, 5)
            .fillColor(PDF_COLORS.accentSoft).fillOpacity(0.12).fill().restore();
        doc
            .fillColor(PDF_COLORS.accentSoft).fillOpacity(1)
            .font(PDF_FONTS.bold).fontSize(10)
            .text(totalLabel, totalX + 11, afterTitleY + 6, { lineBreak: false });


        // ── Description ───────────────────────────────────────────────────────
        let cursorY = HEADER_H + 20;
        doc.rect(marginX, cursorY, contentWidth, 1).fillColor(PDF_COLORS.border).fillOpacity(1).fill();

        doc
            .fillColor(PDF_COLORS.accentSoft).fillOpacity(1)
            .font(PDF_FONTS.bold).fontSize(11)
            .text("DESCRIPTION", marginX, cursorY + 12, { characterSpacing: 1 });

        doc
            .fillColor(PDF_COLORS.textSecondary).fillOpacity(1)
            .font(PDF_FONTS.body).fontSize(11)
            .text(quiz.description, marginX, cursorY + 30, { width: contentWidth, lineGap: 4 });

        // ── Questions section ─────────────────────────────────────────────────
        cursorY = doc.y + 22;
        doc.rect(marginX, cursorY, contentWidth, 1).fillColor(PDF_COLORS.border).fillOpacity(1).fill();

        doc
            .fillColor(PDF_COLORS.accentSoft).fillOpacity(1)
            .font(PDF_FONTS.bold).fontSize(11)
            .text("QUESTIONS", marginX, cursorY + 12, { characterSpacing: 1 });

        cursorY += 32;

        if (quiz.questions.length === 0) {
            drawRoundedRect(doc, marginX, cursorY, contentWidth, 50, 8, PDF_COLORS.surface);
            doc
                .fillColor(PDF_COLORS.textMuted).fillOpacity(1)
                .font(PDF_FONTS.body).fontSize(11)
                .text("No questions have been added to this quiz yet.", marginX, cursorY + 18, {
                    width: contentWidth,
                    align: "center",
                });
        }

        for (let i = 0; i < quiz.questions.length; i++) {
            const q = quiz.questions[i];
            const options = q.options;

            // Measure card height
            doc.font(PDF_FONTS.bold).fontSize(11);
            const questionH = doc.heightOfString(q.question, { width: contentWidth - 60 });
            const optionsH = options.length * 20;
            const answerH = 20;
            const cardHeight = Math.max(70, questionH + optionsH + answerH + 36);

            // Page break
            if (cursorY + cardHeight > pageHeight - marginY - 30) {
                doc.addPage();
                fillBackground(doc);
                cursorY = marginY;
            }

            // Card background
            drawRoundedRect(doc, marginX, cursorY, contentWidth, cardHeight, 8, PDF_COLORS.surface);

            // Left accent stripe
            doc.rect(marginX, cursorY, 4, cardHeight).fillColor(PDF_COLORS.accent).fillOpacity(1).fill();

            // Question number circle
            const circleX = marginX + 26;
            const circleY = cursorY + 26;
            doc.save().circle(circleX, circleY, 13)
                .fillColor(PDF_COLORS.accent).fillOpacity(0.15).fill().restore();
            doc
                .fillColor(PDF_COLORS.accent).fillOpacity(1)
                .font(PDF_FONTS.bold).fontSize(11)
                .text(`${i + 1}`, circleX - (i >= 9 ? 5 : 3), circleY - 7, { lineBreak: false });

            // Question text
            const questionTextX = marginX + 50;
            const questionTextW = contentWidth - 58;
            doc
                .fillColor(PDF_COLORS.textPrimary).fillOpacity(1)
                .font(PDF_FONTS.bold).fontSize(11)
                .text(q.question, questionTextX, cursorY + 14, { width: questionTextW });

            let innerY = cursorY + 14 + questionH + 10;

            // Options
            const optionLetters = ["A", "B", "C", "D"];
            for (let j = 0; j < options.length; j++) {
                const optLabel = optionLetters[j] ?? String(j + 1);
                const isAnswer = options[j] === q.answer;

                // Option pill background
                const optW = contentWidth - 60;
                drawRoundedRect(doc, questionTextX, innerY, optW, 17, 4,
                    isAnswer ? PDF_COLORS.answerAccent : PDF_COLORS.optionBg,
                    isAnswer ? 0.18 : 1
                );

                // Letter label
                doc
                    .fillColor(isAnswer ? PDF_COLORS.textPrimary : PDF_COLORS.textMuted)
                    .fillOpacity(1)
                    .font(PDF_FONTS.bold).fontSize(9)
                    .text(optLabel, questionTextX + 7, innerY + 4, { lineBreak: false });

                // Option text
                doc
                    .fillColor(isAnswer ? PDF_COLORS.textPrimary : PDF_COLORS.textSecondary)
                    .fillOpacity(1)
                    .font(PDF_FONTS.body).fontSize(9)
                    .text(options[j], questionTextX + 22, innerY + 4, { lineBreak: false });

                innerY += 21;
            }



            cursorY += cardHeight + 10;
        }

        // ── Footer on every page ──────────────────────────────────────────────
        const pageCount = doc.bufferedPageRange().count;
        for (let p = 0; p < pageCount; p++) {
            doc.switchToPage(p);
            doc.rect(0, pageHeight - 36, pageWidth, 36)
                .fillColor(PDF_COLORS.surface).fillOpacity(1).fill();
            doc.rect(0, pageHeight - 36, pageWidth, 1)
                .fillColor(PDF_COLORS.border).fillOpacity(1).fill();
            doc
                .fillColor(PDF_COLORS.textMuted).fillOpacity(1)
                .font(PDF_FONTS.body).fontSize(8)
                .text("MERN Roadmap Platform  •  Quiz Export", marginX, pageHeight - 22, { lineBreak: false });
            doc
                .fillColor(PDF_COLORS.textMuted).fillOpacity(1)
                .font(PDF_FONTS.body).fontSize(8)
                .text(`Page ${p + 1} of ${pageCount}`, pageWidth - marginX - 50, pageHeight - 22, { lineBreak: false });
        }

        doc.end();
    } catch (error) {
        console.error(error.message);
        if (!res.headersSent)
            return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @swagger
 * /api/v1/quiz/{id}/export/csv:
 *   get:
 *     summary: Export a quiz and its questions as a CSV file
 *     tags: [Quizzes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The quiz ID to export
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Quiz not found
 *       500:
 *         description: Server error
 */
export const exportQuizToCSV = async (req, res) => {
    try {
        const { id: quizId } = req.params;
        const quiz = await Quiz.findById(quizId).populate("questions");

        if (!quiz)
            return res.status(404).json({ success: false, message: "Quiz not found." });

        const rows = quiz.questions.length
            ? quiz.questions.map((q, index) => ({
                quiz_id: quiz._id.toString(),
                quiz_title: quiz.title,
                quiz_description: quiz.description,
                quiz_rank: quiz.rank,
                question_number: index + 1,
                question: q.question,
                options: (q.options ?? []).join(" | "),
                answer: q.answer,
            }))
            : [
                {
                    quiz_id: quiz._id.toString(),
                    quiz_title: quiz.title,
                    quiz_description: quiz.description,
                    quiz_rank: quiz.rank,
                    question_number: "",
                    question: "",
                    options: "",
                    answer: "",
                },
            ];

        const fields = [
            "quiz_id",
            "quiz_title",
            "quiz_description",
            "quiz_rank",
            "question_number",
            "question",
            "options",
            "answer",
        ];

        const parser = new Parser({ fields });
        const csv = parser.parse(rows);

        const filename = `${quiz.title.replace(/\s+/g, "_")}_quiz.csv`;
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        return res.status(200).send(csv);
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};


/**
 * @swagger
 * /api/v1/quiz/{quizId}/recommended:
 *   get:
 *     summary: Get recommended quiz based on shared tags
 *     tags: [Quizzes]
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the quiz to base recommendations on
 *     responses:
 *       200:
 *         description: List of recommended quizzes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 recommendedQuizzes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       level:
 *                         type: string
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *       400:
 *         description: Invalid quiz ID format
 *       404:
 *         description: Quiz not found or no related quizzes exist
 *       500:
 *         description: Internal server error
 */
export const getRecommendedQuizzes = async (req, res) => {

    try {
        const { id: quizId } = req.params

        const quiz = await Quiz.findById(quizId);

        //check if the quiz with the given id exists
        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: "Quiz not found"
            });
        }

        const recommendedQuizzes = await Quiz.find(
            {
                tags: { $in: quiz.tags },
                //make sure to not return the current quiz id 
                _id: { $ne: quizId }
            }
        ).select("-__v")

        //checking if there are recommended quiz
        if (!recommendedQuizzes || recommendedQuizzes.length === 0) {
            return res.status(404).json({ success: false, message: `No recommended quizzes found!` })
        }

        return res.status(200).json({
            success: true,
            message: `Recommended quizzes fetched successfully`,
            quizNumber: recommendedQuizzes.length,
            recommendedQuizzes
        })

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
}