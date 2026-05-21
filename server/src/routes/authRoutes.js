const router = require('express').Router()
const { postRegister, postLogin, postGoogleAuth, uploadAvatar, forgotPassword, resetPassword } = require('../controllers/authController')
const upload = require('../middleware/multer')

router.post('/register', postRegister)
router.post('/login', postLogin)

router.post('/google', postGoogleAuth)
router.post('/upload-avatar', upload.single('avatar'), uploadAvatar)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

module.exports = router