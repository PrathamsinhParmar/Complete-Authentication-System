import app from './src/app.js'
import config from './src/config/config.js'
import connectDB from './src/config/db.js'

connectDB()

app.listen(config.PORT, (req, res)=>{
    console.log(`Server is running on : http://localhost:${config.PORT}`)
})