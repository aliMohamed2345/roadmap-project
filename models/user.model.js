import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [50, 'Username cannot be longer than 50 characters'],
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/.+\@.+\..+/, 'Please fill a valid email address'],
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: [6, 'Password must be at least 6 characters long']
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    imageURL: {
        type: String,
        default: "https://cdn-icons-png.flaticon.com/512/149/149071.png"
    },
    bio: {
        type: String,
        default: "No Bio Yet ",
        maxlength: [300, 'Bio cannot be longer than 300 characters'],
    },
    progressData: {
        roadmap: [{
            roadmap: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Roadmap",
                required: true
            },
            completedSections: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: "Section"
            }],
            numberOfAllSections: {
                type: Number,
                default: 0
            }
        }],
        quiz: [{
            quiz: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Quiz",
                required: true
            },
            percentage: Number,
            totalQuestions: Number,
            correctAnswers: Number,
            wrongAnswers: Number,
            grade: String,
            status: String,
            createdAt: {
                type: Date,
                default: Date.now
            },
            startedAt: {
                type: Date,
                default: Date.now
            }
        }],
        project: [{
            project: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Project",
                required: true
            },
            completedSteps: [{
                type: mongoose.Schema.Types.ObjectId
            }],
            totalSteps: {
                type: Number,
                default: 0
            },
            completedCount: {
                type: Number,
                default: 0
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }]
    },
    achievements: [{
        achievement: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Achievement",
            required: true
        },
        earnedAt: {
            type: Date,
            default: Date.now
        },

    }]
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;