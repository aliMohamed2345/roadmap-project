import mongoose from "mongoose";

const sectionSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    roadmapId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Roadmap'
    },
    resources: [{ type: mongoose.Schema.Types.ObjectId, ref: "Resource" }],
    difficulty: {
        type: String,
        enum: ["Beginner", "Intermediate", "Advanced", "Expert"]
    }
}, { timestamps: true })


const Section = mongoose.model('Section', sectionSchema);

export default Section