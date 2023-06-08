import {
  registerUser,
  loginUser,
  generateNewAccessToken,
  verifyAccount,
  uploadAvatar,
  updatePassword,
  updateProfile,
  getProfileInfo,
  logoutUser,
  getAllUsers
} from 'controllers'
import express from 'express'
import { isAuth } from 'middlewares'

import multer from 'multer'

const storageConfig = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, 'images')
  },
  filename: function (_req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  },
})

const upload = multer({ storage: storageConfig })

const router = express.Router()

router.post('/signup', registerUser)
router.post('/login', loginUser)
router.get('/refresh_token', generateNewAccessToken)
router.post('/verify-account/:token', verifyAccount)
router.patch('/update-password/:userId', updatePassword)
router.put('/update-profile/:userId', isAuth, upload.single('image'), updateProfile)
router.get('/profile/:userId', isAuth, getProfileInfo)
router.get('/all-users', isAuth, getAllUsers)

export default router
