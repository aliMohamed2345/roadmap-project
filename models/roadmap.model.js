import mongoose from "mongoose";


const roadmapSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    tags: [String],
    sections: [{ type: mongoose.Schema.Types.ObjectId, ref: "Section" }]

}, { timestamps: true })




const Roadmap = mongoose.model('Roadmap', roadmapSchema)

export default Roadmap;