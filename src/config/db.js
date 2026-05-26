import mongoose from "mongoose";
import config from "./config.js";

const connectDB = async ()=>{
    mongoose.connect(config.MONGO_URI)
    .then(()=>{
        console.log("Database Connected Successfully")
    })
    .catch((err)=>{
        console.log(`Error Connecting To Database, ${err}`)
    })
}

export default connectDB