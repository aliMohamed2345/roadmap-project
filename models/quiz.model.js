import mongoose from "mongoose";



const quizSchema = mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    tags: [String],
    rank: { type: String, enum: ["Beginner", "Intermediate", "Advanced", "Expert", "Master"], default: "Beginner" },
}, { timestamps: true })



const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz