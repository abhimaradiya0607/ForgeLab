import express from 'express';
import { getAllusers, signup, login, getUserProfile, updateUserProfile, deleteUserProfile } from '../controllers/user.controller.js';

const UserRouter=express.Router();

UserRouter.get('/allUsers',getAllusers);

UserRouter.post('/signup',signup);
UserRouter.post('/login',login);


UserRouter.get('/userProfile',getUserProfile);
UserRouter.put('/updateProfile',updateUserProfile);
UserRouter.delete('/deleteProfile',deleteUserProfile);

export default UserRouter;

