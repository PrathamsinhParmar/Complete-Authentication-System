import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: [true, "User is required"]
    },
    email: {
        type: String,
        required: [true, "Email is required"]
    },
    otpHash:{
        type: String,
        required: [true, "OTP is required"]
    }
}, {
    timestamps: true
})

const otpModel = mongoose.model("otp", otpSchema)

export default otpModel