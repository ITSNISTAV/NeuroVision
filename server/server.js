const app = require("./src/app");
require('dotenv').config()
const connectDB = require('./src/config/db');

// Connect to Database
connectDB();

const PORT = process.env.PORT || 3000
app.listen(PORT,()=>{
    console.log(`app is running on port ${PORT}`)
})  
