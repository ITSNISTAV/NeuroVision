require('dotenv').config()   // ← MUST be first line

const express = require('express')
const app = require('./src/app')

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`app is running on port ${PORT}`)
})