export const validateQuestionData = (question, answer, options) => {
    if (question) {
        if (!question || typeof question !== "string" || question.trim().length < 5)
            return { isValid: false, message: "Question must be a valid text with at least 5 characters." };
    }

    if (answer) {
        if (!answer || typeof answer !== "string" || !answer.trim())
            return { isValid: false, message: "Answer is required and must be a valid string." };
    }
    if (options) {
        if (!options || !Array.isArray(options))
            return { isValid: false, message: "Options must be an array." };

        if (options.length !== 4) return { isValid: false, message: "Each question must have 4 options with the answer" };

        // Check for duplicate options
        const uniqueOptions = new Set(options.map(o => o.trim().toLowerCase()));
        if (uniqueOptions.size !== options.length)
            return { isValid: false, message: "Options must be unique." };
    }



    return { isValid: true, message: "" };
};
export const validateCreationQuestionData = (question, answer, options) => {
    if (!question) {
        return { isValid: false, message: "Question is required" }
    }
    if (!answer) {
        return { isValid: false, message: `Answer is required` }
    }
    if (!options) {
        return { isValid: false, message: `Options are required` }
    }

    if (typeof question !== "string" || question.trim().length < 5)
        return { isValid: false, message: "Question must be a valid text with at least 5 characters." };

    if (typeof answer !== "string" || !answer.trim())
        return { isValid: false, message: "Answer is required and must be a valid string." };

    if (!Array.isArray(options))
        return { isValid: false, message: "Options must be an array." };

    if (options.length !== 4) return { isValid: false, message: "Each question must have 4 options with the answer" };

    // Check for duplicate options
    const uniqueOptions = new Set(options.map(o => o.trim().toLowerCase()));
    if (uniqueOptions.size !== options.length)
        return { isValid: false, message: "Options must be unique." };

    return { isValid: true, message: "" };
};

export const validateQuizData = (title, description, rank) => {
    const allRanks = ["Beginner", "Intermediate", "Advanced", "Expert", "Master"]

    if (!title || !description)
        return { isValid: false, message: 'Title and description are required.' };

    if (!rank) return { isValid: false, message: "Ranks is required." }

    if (!allRanks.includes(rank))
        return { isValid: false, message: `Rank must be one of following: ${allRanks.join(', ')}` }

    const wordCount = description.trim().split(/\s+/).length;
    if (wordCount < 5 || wordCount > 50)
        return { isValid: false, message: 'Description must be between 5 and 50 words.' };

    return { isValid: true, message: "" };
}

export const validateQuestionQueryString = ({
    page,
    limit,
    q,
    sort,
    random
}) => {

    const allowedSortFields = ["createdAt", "updatedAt", "question"];
    const allowedRandomValues = ["true", "false"];

    if (page) {
        const pageNumber = Number(page);

        if (!Number.isInteger(pageNumber) || pageNumber <= 0) {
            return {
                isValid: false,
                message: "Page must be a positive integer."
            };
        }
    }

    if (limit) {
        const limitNumber = Number(limit);

        if (!typeof limitNumber !== "number") {
            return {
                isValid: false,
                message: "Limit must be a valid integer."
            };
        }

        if (limitNumber <= 0 || limitNumber > 50) {
            return {
                isValid: false,
                message: "Limit must be between 1 and 50."
            };
        }
    }

    if (q) {
        if (typeof q !== "string") {
            return {
                isValid: false,
                message: "Search query must be a string."
            };
        }

        if (q.length > 100) {
            return {
                isValid: false,
                message: "Search query is too long."
            };
        }
    }

    if (sort) {
        if (!allowedSortFields.includes(sort)) {
            return {
                isValid: false,
                message: `Sort must be one of: ${allowedSortFields.join(", ")}`
            };
        }
    }

    if (random) {
        if (!allowedRandomValues.includes(random)) {
            return {
                isValid: false,
                message: "Random must be either 'true' or 'false'."
            };
        }

        if (random === "true" && limit !== undefined && Number(limit) > 20) {
            return {
                isValid: false,
                message: "Random mode limit cannot exceed 20."
            };
        }
    }

    return {
        isValid: true,
        message: "Validation successful."
    };
};