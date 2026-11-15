import express from 'express';
import { clerkMiddleware } from "@clerk/express";
import { authenticate } from '../middleware/authenticate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import {
    getAllusers,
    signup,
    login,
    clerkLogin,
    getUserProfile,
    updateUserProfile,
    deleteUserProfile,
    getMyActivity,
    followUser,
    unfollowUser,
    getUserActivity
} from '../controllers/user.controller.js';

const UserRouter = express.Router();

UserRouter.post('/signup', authLimiter,signup);
UserRouter.post('/login', authLimiter,login);
UserRouter.post('/auth/clerk', clerkMiddleware(), clerkLogin);
UserRouter.get('/me', authenticate, getMyActivity);
UserRouter.post('/user/:id/follow', authenticate, followUser);
UserRouter.delete('/user/:id/follow', authenticate, unfollowUser);
UserRouter.get('/userProfile/:id/activity', getUserActivity);
UserRouter.get('/allUsers', getAllusers);
UserRouter.get('/userProfile/:id',authenticate, getUserProfile);
UserRouter.put('/updateProfile/:id', updateUserProfile);
UserRouter.delete('/deleteProfile/:id', deleteUserProfile);

export default UserRouter;