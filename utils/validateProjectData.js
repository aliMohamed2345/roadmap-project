export const validateProjectData = (title, description, level, tags) => {

    const allowedLevels = ["Beginner", "Intermediate", "Advanced"];

    // Title validation
    if (!title || typeof title !== "string" || !title.trim()) {
        return { isValid: false, message: "Title is required and must be a valid string." };
    }

    // Description validation
    if (!description || typeof description !== "string" || !description.trim()) {
        return { isValid: false, message: "Description is required and must be a valid string." };
    }

    // Level validation
    if (!level || typeof level !== "string") {
        return { isValid: false, message: "Level is required." };
    }

    if (!allowedLevels.includes(level)) {
        return {
            isValid: false,
            message: `Level must be one of: ${allowedLevels.join(", ")}`,
        };
    }

    // Tags validation
    if (!Array.isArray(tags)) {
        return { isValid: false, message: "Tags must be an array of strings." };
    }

    for (const tag of tags) {
        if (typeof tag !== "string") {
            return { isValid: false, message: "Each tag must be a string." };
        }
    }



    return { isValid: true, message: "Validation successful." };
};



export const validateStepsData = (steps) => {
    // Steps validation
    if (!Array.isArray(steps)) {
        return { isValid: false, message: "Steps must be an array." };
    }

    if (steps.length === 0) {
        return { isValid: false, message: "At least one step is required." };
    }
    if (steps.length > 10) {
        return { isValid: false, message: "Maximum 10 steps are allowed only." };
    }

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];

        if (!step.title || typeof step.title !== "string" || !step.title.trim()) {
            return {
                isValid: false,
                message: `Step ${i + 1}: Title is required and must be a valid string.`,
            };
        }

        if (!step.description || typeof step.description !== "string" || !step.description.trim()) {
            return {
                isValid: false,
                message: `Step ${i + 1}: Description is required and must be a valid string.`,
            };
        }

        if (
            step.isCompleted !== undefined &&
            typeof step.isCompleted !== "boolean"
        ) {
            return {
                isValid: false,
                message: `Step ${i + 1}: isCompleted must be a boolean.`,
            };
        }
    }
    return { isValid: true, message: "" }
}
export const validateProjectQueryString = (q = "", page = 1, limit = 1, level) => {
    const allowedLevels = ["Beginner", "Intermediate", "Advanced"];
    if (q) {
        // Query validation
        if (typeof q !== "string") {
            return { isValid: false, message: "Query must be a string." };
        }
    }
    if (page) {

        // Page validation
        if (typeof page !== "number" || page <= 0) {
            return { isValid: false, message: "Page must be a positive number." };
        }
    }

    if (limit) {
        // Limit validation
        if (typeof limit !== "number") {
            return { isValid: false, message: "Limit must be a positive number." };
        }
        if (limit <= 0 || limit > 30) {
            return { isValid: false, message: "Limit must be between 1 and 30." };
        }
    }
    if (level) {
        if (typeof level !== "string") {
            return { isValid: false, message: "Level must be a valid string" };
        }
        if (!allowedLevels.includes(level)) {
            return {
                isValid: false,
                message: `Level must be one of: ${allowedLevels.join(", ")}`,
            };
        }
    }
    return { isValid: true, message: "Validation successful." };
}
export const validateProjectUpdateData = (title, description, level, tags) => {
    const allowedLevels = ["Beginner", "Intermediate", "Advanced"];
    if (title) {
        // Title validation
        if (typeof title !== "string") {
            return { isValid: false, message: "Title must be a valid string." };
        }
    }

    if (description) {
        // Description validation
        if (typeof description !== "string") {
            return { isValid: false, message: "Description must be a valid string." };
        }
    }

    if (level) {
        // Level validation
        if (typeof level !== "string") {
            return { isValid: false, message: "Level must be a valid string" };
        }

        if (!allowedLevels.includes(level)) {
            return {
                isValid: false,
                message: `Level must be one of: ${allowedLevels.join(", ")}`,
            };
        }
    }

    if (tags) {
        // Tags validation
        if (!Array.isArray(tags)) {
            return { isValid: false, message: "Tags must be an array of strings." };
        }

        for (const tag of tags) {
            if (typeof tag !== "string") {
                return { isValid: false, message: "Each tag must be a string." };
            }
        }
    }

    return { isValid: true, message: "Validation successful." };
}