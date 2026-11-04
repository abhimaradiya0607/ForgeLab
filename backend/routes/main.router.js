import express from 'express';
import UserRouter from './user.router.js';
import RepoRouter from './repo.router.js';
import IssueRouter from './issue.router.js';

const mainRouter=express.Router();

mainRouter.use(UserRouter);
mainRouter.use(RepoRouter);
mainRouter.use(IssueRouter);


mainRouter.get('/',(req,res)=>{
    res.status(200).json({
        message:'Hello World',
    });
});

export default mainRouter;
