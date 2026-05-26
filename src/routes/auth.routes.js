import express from 'express'
import authController from '../controllers/auth.controller.js'

const authRouter = express.Router()

authRouter.post('/register', authController.registerUserController)

authRouter.post('/login', authController.loginUserContoroller)

authRouter.post('/get-me', authController.getUserController)

authRouter.post('/refresh-token', authController.newAccessTokenGenerator)

authRouter.post('/logout', authController.logoutUserController)

authRouter.post('/logout-all', authController.logoutAllUserController)


authRouter.get('/verify-email', authController.verifyEmailController)

export default authRouter