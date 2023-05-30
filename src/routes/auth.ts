import { registerUser, loginUser, generateNewAccessToken, verifyAccount } from 'controllers'
import express from 'express'

const router = express.Router()

router.post('/signup', registerUser)
router.post('/login', loginUser)
router.get('/refresh_token', generateNewAccessToken)
router.post('/verify-account/:token', verifyAccount)


export default router
