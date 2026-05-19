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

export const validateQuizData = (title, description, rank, tags) => {
    const allRanks = ["Beginner", "Intermediate", "Advanced", "Expert", "Master"]

    if (!title || !description)
        return { isValid: false, message: 'Title and description are required.' };

    if (!rank) return { isValid: false, message: "Ranks is required." }

    if (!allRanks.includes(rank))
        return { isValid: false, message: `Rank must be one of following: ${allRanks.join(', ')}` }

    const wordCount = description.trim().split(/\s+/).length;
    if (wordCount < 5 || wordCount > 50)
        return { isValid: false, message: 'Description must be between 5 and 50 words.' };
    if (!tags) {
        return {
            isValid: false,
            message: "Tags are required."
        }
    }

    if (!Array.isArray(tags)) {
        return {
            isValid: false,
            message: "Tags must be an array."
        }
    }

    if (tags.length < 1) {
        return {
            isValid: false,
            message: "At least one tag is required."
        }
    }

    if (tags.length > 10) {
        return {
            isValid: false,
            message: "Maximum 10 tags are allowed."
        }
    }

    for (const tag of tags) {

        if (typeof tag !== "string") {
            return {
                isValid: false,
                message: "Each tag must be a string."
            }
        }

        if (tag.trim().length < 2) {
            return {
                isValid: false,
                message:
                    "Each tag must be at least 2 characters."
            }
        }

        if (tag.trim().length > 20) {
            return {
                isValid: false,
                message:
                    "Tag cannot exceed 20 characters."
            }
        }
    }

    return { isValid: true, message: "" };
}

export const validateUpdateQuizData = (title,description,rank,tags) => {

    const allRanks = [
        "Beginner",
        "Intermediate",
        "Advanced",
        "Expert",
        "Master"
    ]


    if (title !== undefined) {
        if (typeof title !== "string") {
            return {
                isValid: false,
                message: "Title must be a string."
            }
        }
        if (title.trim().length < 3) {
            return {
                isValid: false,
                message: "Title must be at least 3 characters."
            }
        }
        if (title.trim().length > 100) {
            return {
                isValid: false,
                message: "Title cannot exceed 100 characters."
            }
        }
    }


    if (description !== undefined) {

        if (typeof description !== "string") {
            return {
                isValid: false,
                message: "Description must be a string."
            }
        }

        const wordCount =
            description.trim().split(/\s+/).length

        if (wordCount < 5 || wordCount > 50) {
            return {
                isValid: false,
                message:
                    "Description must be between 5 and 50 words."
            }
        }
    }

    if (rank !== undefined) {

        if (!allRanks.includes(rank)) {
            return {
                isValid: false,
                message:
                    `Rank must be one of: ${allRanks.join(", ")}`
            }
        }
    }

    if (tags !== undefined) {

        if (!Array.isArray(tags)) {
            return {
                isValid: false,
                message: "Tags must be an array."
            }
        }

        if (tags.length < 1) {
            return {
                isValid: false,
                message: "At least one tag is required."
            }
        }

        if (tags.length > 10) {
            return {
                isValid: false,
                message: "Maximum 10 tags are allowed."
            }
        }

        for (const tag of tags) {

            if (typeof tag !== "string") {
                return {
                    isValid: false,
                    message: "Each tag must be a string."
                }
            }

            if (tag.trim().length < 2) {
                return {
                    isValid: false,
                    message:
                        "Each tag must be at least 2 characters."
                }
            }

            if (tag.trim().length > 20) {
                return {
                    isValid: false,
                    message:
                        "Tag cannot exceed 20 characters."
                }
            }
        }
    }

    return {
        isValid: true,
        message: ""
    }
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