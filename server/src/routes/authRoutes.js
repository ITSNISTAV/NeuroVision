const router = require('express').Router()
const { postRegister, postLogin, postGoogleAuth } = require('../controllers/authController')

router.post('/register', postRegister)
router.post('/login', postLogin)

router.post('/google', postGoogleAuth)

module.exports = router