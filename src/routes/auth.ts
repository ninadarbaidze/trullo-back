import {registerUser} from 'controllers'
import express from "express"

const router = express.Router()

router.post('/signup', registerUser)

export default router
