import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        unique: [true, "Username must be unique!"],
        required: [true, "Username is required!"]
    },
    email:{
        type: String,
        unique: [true, "Email must be unique!"],
        required: [true, "Email is required!"]
    },
    password:{
        type: String,
        required: [true, "Password is required!"]
    },
    verified: {
        type: Boolean,
        default: false
    }
},{
    timestamps: true
})

const userModel = mongoose.model("user", userSchema)

export default userModel