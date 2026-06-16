import mongoose from 'mongoose';

const achievementSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        default: "https://res.cloudinary.com/dlfxewfvl/image/upload/v1781586692/badges/nvjuxzrokjkqqkhwecll.webp",
        trim: true
    },

}, { timestamps: true })

const Achievement = mongoose.model("Achievement", achievementSchema);
export default Achievement