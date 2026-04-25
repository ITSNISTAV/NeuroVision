const express=require("express");
const app = require("./src/app");
require('dotenv').config()
const { connectDB } = require("./src/config/db");
// const port =3000;

const PORT = process.env.PORT || 3000

const startServer = async () => {
    await connectDB();
    app.listen(PORT,()=>{
        console.log(`app is running on port ${PORT}`)
    })
}

startServer()