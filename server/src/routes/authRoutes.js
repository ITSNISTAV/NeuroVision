const router = require('express').Router()
const { postRegister, postLogin } = require('../controllers/authController')

router.post('/register', postRegister)
router.post('/login', postLogin)

module.exports = router
