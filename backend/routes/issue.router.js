import express from 'express';
import {createIssue,deleteIssueById,updateIssueById,getAllIssues,getIssueById } from '../controllers/issue.controller.js';

const IssueRouter=express.Router();

IssueRouter.post('/issue/create',createIssue);

IssueRouter.get('/issue/all',getAllIssues);

IssueRouter.get('/issue/:id',getIssueById);

IssueRouter.put('/issue/update/:id',updateIssueById);

IssueRouter.delete('/issue/delete/:id',deleteIssueById);


export default IssueRouter;

