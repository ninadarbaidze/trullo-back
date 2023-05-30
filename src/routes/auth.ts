import { registerUser, loginUser, generateNewAccessToken } from 'controllers'
import express from 'express'

const router = express.Router()

router.post('/signup', registerUser)
router.post('/login', loginUser)
router.get('/refresh_token', generateNewAccessToken)

export default router
