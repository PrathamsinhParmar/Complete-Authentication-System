import userModel from "../models/user.model.js";
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import config from "../config/config.js";
import sessionModel from "../models/session.model.js";
import emailService from "../services/email.service.js";
import emailUtils from "../utils/otp.utils.js"
import otpModel from "../models/otp.model.js";


const registerUserController = async(req, res)=>{
    const { username, email, password } = req.body

    const isUserExists = await userModel.findOne({
        $or: [
            {username},
            {email}
        ]
    })
    
    if(isUserExists){
        return res.status(401).json({
            message: "Email already registered!"
        })
    }
    
    const hashPassword = crypto.createHash("sha256").update(password).digest("hex")

    const user = await userModel.create({
        username: username,
        email: email,
        password: hashPassword
    })

    const otp = emailUtils.generateOtp()
    const html = emailUtils.getOtpHtml(otp)

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex")

    await otpModel.create({
        user: user._id,
        email: user.email,
        otpHash: otpHash
    })

    await emailService.sendEmail(email, "OTP Verification", `Youe OTP code is ${otp}`, html)
    


    // IMPORTTANT : When the email verify feature is implemented, then We dont directly generate accessToken and refreshToken

    // const refreshToken = jwt.sign({
    //     id: user._id
    // }, config.JWT_SECRET,
    // {
    //     expiresIn: "7d"
    // })

    // const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex")

    // const session = await sessionModel.create({
    //     user: user._id,
    //     refreshToken: refreshTokenHash,
    //     ip: req.ip,
    //     userAgent: req.headers["user-agent"]
    // })

    // const accessToken = jwt.sign({
    //     id: user._id
    // }, config.JWT_SECRET, {
    //     expiresIn: "15m"
    // })


    // res.cookie("refreshToken", refreshToken, {
    //     httpOnly: true,
    //     secure: true,
    //     sameSite: "strict",
    //     maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Days 
    // })

    res.status(201).json({
        message: "User registered successfully!",
        user: user
        // accessToken
    })

}

const loginUserContoroller = async (req, res)=>{
    const { username, email, password } = req.body

    const user = await userModel.findOne({
        $or: [
            {username},
            {email}
        ]
    })


    if(!user){
        return res.status(400).json({
            message: "User not found!"
        })
    }

    if(!user.verified){
        return res.status(401).json({
            message: "Email not verified!"
        })
    }

    const hashPassword = crypto.createHash("sha256").update(password).digest("hex") 

    if(hashPassword !== user.password){
        return res.status(402).json({
            message: "Invalid password!"
        })
    }

    // const isPasswordCorrect = await bcrypt.compare(password, user.password)

    // if(!isPasswordCorrect){
    //     return res.status(402).json({
    //         message: "Invalid password!"
    //     })
    // }

    const refreshToken = jwt.sign({
        id: user._id
    }, config.JWT_SECRET,
    {
        expiresIn: "7d"
    })

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex")

    const session = await sessionModel.create({
        user: user._id,
        refreshToken: refreshTokenHash,
        ip: req.ip,
        userAgent: req.headers["user-agent"]
    })

    const accessToken = jwt.sign({
        id: user._id,
        sessionId: session._id
    }, config.JWT_SECRET, {
        expiresIn: "15m"
    })

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Days
    })

    res.status(200).json({
        message: "User loggedin successfully!",
        user: user,
        accessToken
    })

}

const getUserController = async (req, res)=>{
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if(!token){
        return res.status(403).json({
            message: "Unauthorized access, Token is missing!"
        })
    }

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET)

        if(!decoded){
            return res.status(402).json({
                message: "Unauthorized access, User not found!"
            })
        }

        const user = await userModel.findById(decoded.id)

        res.status(200).json({
            message: "User fetched successfully!",
            user: user
        })
    } catch (error) {
        return res.status(400).json({
            message: "Unauthorized, Error!"
        })
    }

    
}

const logoutUserController = async (req, res)=>{
    const refreshToken = req.cookies.refreshToken

    if(!refreshToken){
        return res.status(400).json({
            message: "Refresh token not found!"
        })
    }

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex")

    const session = await sessionModel.findOne({
        refreshToken: refreshTokenHash,
        revoked: false
    })

    if(!session){
        return res.status(400).json({
            message: "Session not found!"
        })
    }

    session.revoked = true   // if revoked, then refresh token is not use to generate access token
    await session.save();

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "strict"
    });

    res.status(200).json({
        message: "User Loggedout Successfully!"
    })
}

const newAccessTokenGenerator = async (req, res)=>{
    const refreshToken = req.cookies.refreshToken

    if(!refreshToken){
        return res.status(403).json({
            message: "Unauthorized, Refresh Token Missing!"
        })
    }

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex")

    const session = await sessionModel.findOne({
        refreshToken: refreshTokenHash,
        revoked: false  // Important
    })

    if(!session){
        return res.status(401).json({
            message: "Invalid refresh token!"     // Because revoked: true
        })
    }

    const decoded = await jwt.verify(refreshToken, config.JWT_SECRET)

    const accessToken = jwt.sign({
        id: decoded.id
    }, config.JWT_SECRET, 
    {
        expiresIn : "15m"
    })

    const newRefreshToken = jwt.sign({
        id: decoded.id
    }, config.JWT_SECRET,
    {
        expiresIn: "7d"
    })

    const newRefreshTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex")

    session.refreshToken = newRefreshTokenHash
    await session.save()

    res.cookie("refreshToken", newRefreshToken , {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Days

    })

    res.status(200).json({
        message: "Access token refershed successfully!",
        accessToken
    })
}

const logoutAllUserController = async (req, res)=>{
    const refreshToken = req.cookies.refreshToken

    if(!refreshToken){
        return res.status(400).json({
            message: "Unauthorized, refresh token missing!"
        })
    }

    const decoded = jwt.verify(refreshToken, config.JWT_SECRET)

    await sessionModel.updateMany({
        user: decoded.id,
        revoked: false
    }, {
        revoked: true    // Condition
    })

    res.clearCookie("refreshToken")

    res.status(200).json({
        message: "User Logout From All Devices!"
    })
}


const verifyEmailController = async (req, res)=>{
    const { email, otp } = req.body

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex")

    const otpDoc = await otpModel.findOne({
        email, 
        otpHash
    })

    if(!otpDoc){
        return res.status(401).json({
            message: "Invalid OTP!"
        })
    }

    const user = await userModel.findByIdAndUpdate(otpDoc.user, {
        verified: true
    })

    await otpModel.deleteMany({
        user: otpDoc.user
    })

    res.status(200).json({
        message: "User email verified successfully!",
        user: user
    })
}

export default {
    registerUserController,
    loginUserContoroller,
    getUserController,
    newAccessTokenGenerator,
    logoutUserController,
    logoutAllUserController,
    verifyEmailController
}