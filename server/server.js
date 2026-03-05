const express=require("express");
const cors = require('cors');
const app = require("./src/app");
require('dotenv').config()
const authRoutes=require("./src/routes/authRoutes");
const app=express();
app.use(cors())
app.use(express.json({ limit: '1mb' }))
// const port =3000;
app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})
app.use('/api/auth', authRoutes)
const PORT = process.env.PORT || 3000
app.listen(PORT,()=>{
    console.log(`app is running on port ${PORT}`)
})  
