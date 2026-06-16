export const validateAchievementData = (title, description) => {

    if (!title || typeof title !== "string" || !title.trim()) {
        return { isValid: false, message: "Title is required and must be a valid string." };
    }
    if (title.trim().length < 3) {
        return { isValid: false, message: "Title must be at least 3 characters long." };
    }
    if (title.trim().length > 100) {
        return { isValid: false, message: "Title cannot exceed 100 characters." };
    }

    if (!description || typeof description !== "string" || !description.trim()) {
        return { isValid: false, message: "Description is required and must be a valid string." };
    }
    if (description.trim().length < 10) {
        return { isValid: false, message: "Description must be at least 10 characters long." };
    }
    if (description.trim().length > 500) {
        return { isValid: false, message: "Description cannot exceed 500 characters." };
    }

    return { isValid: true, message: "Validation successful." };
};

export const validateUpdateAchievementData = (title, description) => {

    if (title !== undefined) {
        if (typeof title !== "string" || !title.trim()) {
            return { isValid: false, message: "Title must be a valid string." };
        }
        if (title.trim().length < 3) {
            return { isValid: false, message: "Title must be at least 3 characters long." };
        }
        if (title.trim().length > 100) {
            return { isValid: false, message: "Title cannot exceed 100 characters." };
        }
    }

    if (description !== undefined) {
        if (typeof description !== "string" || !description.trim()) {
            return { isValid: false, message: "Description must be a valid string." };
        }
        if (description.trim().length < 10) {
            return { isValid: false, message: "Description must be at least 10 characters long." };
        }
        if (description.trim().length > 500) {
            return { isValid: false, message: "Description cannot exceed 500 characters." };
        }
    }

    if (title === undefined && description === undefined) {
        return { isValid: false, message: "At least one field (title or description) must be provided." };
    }

    return { isValid: true, message: "Validation successful." };
};