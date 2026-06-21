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
    image: {
        type: String,
        default: `https://res.cloudinary.com/dlfxewfvl/image/upload/v1782040952/default-roadmap-placeholder_fvblrn.png`
    },
    sections: [{ type: mongoose.Schema.Types.ObjectId, ref: "Section" }]

}, { timestamps: true })




const Roadmap = mongoose.model('Roadmap', roadmapSchema)

export default Roadmap;