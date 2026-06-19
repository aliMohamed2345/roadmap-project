// utils/achievementRules.js
import Roadmap from "../models/roadmap.model.js";
import ROADMAP_ACHIEVEMENT_MAP from "./achievementRoadmapTItles.js";
/**
 * Rule types:
 *   - static:  condition(user) → Boolean
 *   - dynamic: condition(user, context) → Boolean  (needs extra data fetched at runtime)
 *
 * context shape (passed from checkAndGrantAchievements):
 * {
 *   completedRoadmapTitles: [String],   // populated for section_complete trigger
 *   finishedRoadmapCount:   Number,     // total fully-completed roadmaps
 *   elapsedSeconds:         Number,     // for quiz_submit trigger
 *   remainingSeconds:       Number,     // for quiz_submit trigger
 *   totalQuizSeconds:       Number,     // for quiz_submit trigger
 * }
 */

const ACHIEVEMENT_RULES = [

    // ─────────────────────────────────────────────
    // ROADMAP-SPECIFIC (one per roadmap)
    // ─────────────────────────────────────────────
    ...ROADMAP_ACHIEVEMENT_MAP.map(({ roadmapTitle, achievement }) => ({
        title: achievement,
        triggers: ["section_complete"],
        condition: (user, context) =>
            context.completedRoadmapTitles.includes(roadmapTitle)
    })),

    // ─────────────────────────────────────────────
    // ROADMAP COUNT MILESTONES
    // ─────────────────────────────────────────────
    {
        title: "Locked in",
        triggers: ["section_complete"],
        condition: (user, context) => context.finishedRoadmapCount >= 5
    },
    {
        title: "Tryhard",
        triggers: ["section_complete"],
        condition: (user, context) => context.finishedRoadmapCount >= 10
    },
    {
        title: "What a sweat",
        triggers: ["section_complete"],
        condition: (user, context) => context.finishedRoadmapCount >= 15
    },

    // ─────────────────────────────────────────────
    // SECTION  COUNT
    // ─────────────────────────────────────────────
    {
        title: "Baby Steps",
        triggers: ["section_complete"],
        condition: (user) => {
            const total = user.progressData.roadmap.reduce(
                (sum, r) => sum + r.completedSections.length, 0
            );
            return total >= 1;
        }
    },
    {
        title: "Milestone Spark",
        triggers: ["section_complete"],
        condition: (user) => {
            const total = user.progressData.roadmap.reduce(
                (sum, r) => sum + r.completedSections.length, 0
            );
            return total >= 10;
        }
    },
    {
        title: "Milestone Runner",
        triggers: ["section_complete"],
        condition: (user) => {
            const total = user.progressData.roadmap.reduce(
                (sum, r) => sum + r.completedSections.length, 0
            );
            return total >= 20;
        }
    },
    {
        title: "Milestone Machine",
        triggers: ["section_complete"],
        condition: (user) => {
            const total = user.progressData.roadmap.reduce(
                (sum, r) => sum + r.completedSections.length, 0
            );
            return total >= 50;
        }
    },

    // ─────────────────────────────────────────────
    // QUIZ — SCORE BASED
    // ─────────────────────────────────────────────
    {
        title: "Flawless",
        triggers: ["quiz_submit"],
        condition: (user) =>
            user.progressData.quiz.some(q => q.percentage === 100)
    },
    {
        title: "Genius",
        triggers: ["quiz_submit"],
        condition: (user) => {
            const perfect = user.progressData.quiz.filter(q => q.percentage === 100);
            return perfect.length >= 5;
        }
    },
    {
        title: "Geeked out",
        triggers: ["quiz_submit"],
        condition: (user) => {
            const perfect = user.progressData.quiz.filter(q => q.percentage === 100);
            return perfect.length >= 10;
        }
    },
    {
        title: "Schrödinger's Score",
        triggers: ["quiz_submit"],
        condition: (user, context) => context.latestQuiz?.percentage === 50
    },
    {
        title: "Total Blackout",
        triggers: ["quiz_submit"],
        condition: (user, context) => context.latestQuiz?.percentage === 0
    },
    {
        title: "Almost",
        triggers: ["quiz_submit"],
        condition: (user, context) => context.latestQuiz?.wrongAnswers === 1
    },
    {
        title: "Lucky Guess",
        triggers: ["quiz_submit"],
        condition: (user, context) => context.latestQuiz?.correctAnswers === 1
    },

    // ─────────────────────────────────────────────
    // QUIZ — TIME BASED
    // ─────────────────────────────────────────────
    {
        title: "Speedrunner",
        triggers: ["quiz_submit"],
        // Finished the entire quiz in under 60 seconds total
        condition: (user, context) => context.elapsedSeconds < 60
    },
    {
        title: "Rushed",
        triggers: ["quiz_submit"],
        // Submitted with less than 60 seconds remaining on the timer
        condition: (user, context) =>
            context.remainingSeconds !== null &&
            context.remainingSeconds < 60 &&
            context.remainingSeconds >= 30
    },
    {
        title: "Pressured",
        triggers: ["quiz_submit"],
        condition: (user, context) =>
            context.remainingSeconds !== null &&
            context.remainingSeconds < 30 &&
            context.remainingSeconds >= 10
    },
    {
        title: "Clutch",
        triggers: ["quiz_submit"],
        condition: (user, context) =>
            context.remainingSeconds !== null &&
            context.remainingSeconds < 10 &&
            context.remainingSeconds >= 0
    },

    // ─────────────────────────────────────────────
    // PROJECT BASED
    // ─────────────────────────────────────────────
    {
        title: "Initiate",
        triggers: ["step_complete"],
        condition: (user) => {
            const finished = user.progressData.project.filter(
                p => p.totalSteps > 0 && p.completedCount >= p.totalSteps
            );
            return finished.length >= 1;
        }
    },
    {
        title: "Specialist",
        triggers: ["step_complete"],
        condition: (user) => {
            const finished = user.progressData.project.filter(
                p => p.totalSteps > 0 && p.completedCount >= p.totalSteps
            );
            return finished.length >= 5;
        }
    },
    {
        title: "Expert",
        triggers: ["step_complete"],
        condition: (user) => {
            const finished = user.progressData.project.filter(
                p => p.totalSteps > 0 && p.completedCount >= p.totalSteps
            );
            return finished.length >= 10;
        }
    },

    // ─────────────────────────────────────────────
    // LOGIN STREAKS
    // ─────────────────────────────────────────────

    {
        title: "Routine",
        triggers: ["streak_update"],
        condition: (user) => user.streakData.currentStreak >= 3
    },
    {
        title: "Discipline",
        triggers: ["streak_update"],
        condition: (user) => user.streakData.currentStreak >= 7
    },
    {
        title: "Dedication",
        triggers: ["streak_update"],
        condition: (user) => user.streakData.currentStreak >= 30
    },
    {
        title: "Devotion",
        triggers: ["streak_update"],
        condition: (user) => user.streakData.currentStreak >= 100
    },
    {
        title: "Relentless",
        triggers: ["streak_update"],
        condition: (user) => user.streakData.currentStreak >= 365
    },
];

export default ACHIEVEMENT_RULES;