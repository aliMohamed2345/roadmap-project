import JWT from 'jsonwebtoken'
const generateToken = (id, isAdmin, res) => {
    const token = JWT.sign({ id, isAdmin }, process.env.JWT_SECRET_KEY, { expiresIn: "3d" })

    res.cookie('token', token, {
        httpOnly: true,//only allow the server to access the cookie and preventing the XSS Attacks
        sameSite:"none", //prevents the cookie from being sent to other sites
        secure: true, //only allow the cookie to be sent over HTTPS
        maxAge: 3 * 24 * 60 * 60 * 1000 //max age 3 days 
    })
    return token
}
export default generateToken