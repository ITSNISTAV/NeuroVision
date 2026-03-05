const express=require("express");
const cors = require('cors')
require('dotenv').config()
const path = require('path')
const authRoutes=require("./src/routes/authRoutes");
const app=express();
app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))
app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})
app.use('/api/auth', authRoutes)
const PORT = process.env.PORT || 3000
app.listen(PORT,()=>{
    console.log(`app is running on port ${PORT}`)
})  
