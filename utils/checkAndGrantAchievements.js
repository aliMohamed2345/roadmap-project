// utils/checkAndGrantAchievements.js
import Achievement from "../models/achievement.model.js";
import Roadmap from "../models/roadmap.model.js";
import ACHIEVEMENT_RULES from "./achievementRules.js";

const SECONDS_PER_QUESTION = 90;

/**
 * @param {Object} user          — Mongoose user doc (already saved with latest progress)
 * @param {string} triggerType   — "section_complete" | "quiz_submit" | "step_complete"
 * @param {Object} extraData     — trigger-specific data (see below per trigger)
 *
 * extraData for "quiz_submit":
 *   { quizId, totalQuestions, correctAnswers, wrongAnswers, percentage }
 *
 * extraData for "section_complete":
 *   { roadmapId }  — the roadmap that just had a section completed
 */
const checkAndGrantAchievements = async (user, triggerType, extraData = {}) => {
    const ownedIds = new Set(
        user.achievements.map(a => a.achievement.toString())
    );

    // ── Build context ─────────────────────────────────────────────────
    const context = {};

    if (triggerType === "section_complete") {
        // Find all fully completed roadmaps from user progress
        const finishedRoadmapIds = user.progressData.roadmap
            .filter(r => r.numberOfAllSections > 0 &&
                         r.completedSections.length >= r.numberOfAllSections)
            .map(r => r.roadmap);

        // Fetch their titles from DB in one query
        const roadmapDocs = finishedRoadmapIds.length > 0
            ? await Roadmap.find({ _id: { $in: finishedRoadmapIds } }, "title")
            : [];

        context.completedRoadmapTitles = roadmapDocs.map(r => r.title);
        context.finishedRoadmapCount   = roadmapDocs.length;
    }

    if (triggerType === "quiz_submit") {
        const { quizId, totalQuestions, correctAnswers, wrongAnswers, percentage } = extraData;

        // Get startedAt from user progress entry
        const quizEntry = user.progressData.quiz.find(
            q => q.quiz.toString() === quizId.toString()
        );

        const startedAt      = quizEntry?.startedAt ?? null;
        const elapsedSeconds = startedAt
            ? Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
            : null;

        const totalQuizSeconds  = (totalQuestions || 0) * SECONDS_PER_QUESTION;
        const remainingSeconds  = elapsedSeconds !== null
            ? Math.max(0, totalQuizSeconds - elapsedSeconds)
            : null;

        context.elapsedSeconds   = elapsedSeconds;
        context.remainingSeconds = remainingSeconds;
        context.totalQuizSeconds = totalQuizSeconds;
        context.latestQuiz       = { percentage, correctAnswers, wrongAnswers };
    }

    // ── Evaluate rules ────────────────────────────────────────────────
    const relevantRules = ACHIEVEMENT_RULES.filter(r =>
        r.triggers.includes(triggerType)
    );

    // Load all achievement docs once (avoid N queries in the loop)
    const allTitles     = relevantRules.map(r => r.title);
    const achievementsInDB = await Achievement.find({ title: { $in: allTitles } });
    const achievementMap   = new Map(achievementsInDB.map(a => [a.title, a]));

    const newlyEarned = [];

    for (const rule of relevantRules) {
        const achievementDoc = achievementMap.get(rule.title);
        if (!achievementDoc) continue;                               // not seeded yet
        if (ownedIds.has(achievementDoc._id.toString())) continue;  // already owned

        if (rule.condition(user, context)) {
            user.achievements.push({
                achievement: achievementDoc._id,
                earnedAt: new Date()
            });
            ownedIds.add(achievementDoc._id.toString());
            newlyEarned.push(achievementDoc);
        }
    }

    if (newlyEarned.length > 0) {
        await user.save();
    }

    return newlyEarned;
};

export default checkAndGrantAchievements;