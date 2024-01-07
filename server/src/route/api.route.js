import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import userController from "../controller/user.controller.js";

const userRouter = express.Router();


userRouter.use(authMiddleware);
userRouter.get('/api/users/current',userController.get);
userRouter.use((req,res,next) => {
    res.status(404).send('Page Not Found, Response Server 404.');
});

export default userRouter;