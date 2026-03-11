import { validateLogInCredentials, validateSignUpCredentials } from "../utils/validateUserCredentials.js"
import User from "../models/user.model.js"
import bcrypt from "bcryptjs"
import env from 'dotenv'
import generateToken from "../utils/generateToken.js"
env.config();

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required to access this endpoint
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@email.com
 *               password:
 *                 type: string
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 */
export const Login = async (req, res) => {
    try {
        const defaultImage = "https://cdn-icons-png.flaticon.com/512/149/149071.png"
        const { email, password } = req.body
        const { isValid, message } = validateLogInCredentials(email, password)

        //check the validation of the login credentials 
        if (!isValid) return res.status(400).json({ success: false, message })

        //check if the user exists
        const user = await User.findOne({ email })
        if (!user) return res.status(404).json({ success: false, message: `User not found` })

        //check if the password is correct 
        const isPasswordMatch = await bcrypt.compare(password, user.password)
        if (!isPasswordMatch) return res.status(400).json({ success: false, message: "Incorrect password" })

        //create and assign token
        generateToken(user._id, user.isAdmin, res)

        return res.status(200).json({
            success: true,
            message: "Login successfully",
            user: { id: user._id, username: user.username, email: user.email, isAdmin: user.isAdmin, imageURL: user.imageURL || defaultImage }
        })

    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, message: error.message })
    }
}

/**
 * @swagger
 * /api/v1/auth/signup:
 *   post:
 *     summary: Register new user
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required to access this endpoint
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: ali123
 *               email:
 *                 type: string
 *                 example: ali@email.com
 *               password:
 *                 type: string
 *                 example: Password123!
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 */
export const SignUp = async (req, res) => {
    try {
        const defaultImage = `"https://cdn-icons-png.flaticon.com/512/149/149071.png"`
        const { username, email, password } = req.body

        //check the validation of the signup credentials
        const { isValid, message } = validateSignUpCredentials(email, password, username)
        if (!isValid) return res.status(400).json({ success: false, message })


        //encrypting the password 
        const salt = await bcrypt.genSalt(12)
        const hashedPassword = await bcrypt.hash(password, salt)

        //check if the user already exists
        const existingUser = await User.findOne({ email })
        if (existingUser) return res.status(400).json({ success: false, message: `User already exist please login ` })

        //create the user
        const user = await User.create({ username, email, password: hashedPassword })

        //create and and assign token
        generateToken(user._id, user.isAdmin, res)
        return res.status(201).json({
            success: true,
            message: "User created successfully",
            user: { id: user._id, username: user.username, email: user.email, isAdmin: user.isAdmin, imageURL: user.imageURL || defaultImage }
        })
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, message: error.message })
    }

}

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         description: API key required to access this endpoint
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Logout successful
 */
export const Logout = (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            sameSite: "none",  
            secure: true,      
        })
        return res.status(200).json({ success: true, message: "Logout successfully" })
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, message: error.message })
    }
}

