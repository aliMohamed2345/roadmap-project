const QUIZ_RANK_ORDER = {
    "Beginner": 1,
    "Intermediate": 2,
    "Advanced": 3,
    "Expert": 4,
    "Master": 5
}
const PROJECT_RANK_ORDER = {
    "Beginner": 1,
    "Intermediate": 2,
    "Advanced": 3,
};

export const sortByRank = (items, type = "quiz" | "project") => {
    if (type === "project") {
        return [...items].sort((a, b) => {
            const rankA = PROJECT_RANK_ORDER[a.level] ?? Infinity;
            const rankB = PROJECT_RANK_ORDER[b.level] ?? Infinity;
            return rankA - rankB;
        });
    }
    else if (type = "quiz") {
        return [...items].sort((a, b) => {
            const rankA = QUIZ_RANK_ORDER[a.rank] ?? Infinity;
            const rankB = QUIZ_RANK_ORDER[b.rank] ?? Infinity;
            return rankA - rankB;
        });
    }
};

export default sortByRank;