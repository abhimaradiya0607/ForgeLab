import Repository from "../models/repo.model.js";
import User from "../models/user.model.js";
import Issue from '../models/issue.model.js'
import mongoose from "mongoose";


function isValidId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

function handleError(res, err, label) {
    if (err.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    if (err.code === 11000) {
        return res.status(409).json({ message: 'Username or email already in use' });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: err.message });
    }

    console.error(`Error during ${label}:`, err.message);
    return res.status(500).json({ message: 'Server Error' });
}


 export const createRepository=async (req,res)=>{
    const {owner,name,issues,content,description,visibility}=req.body;

    if(!mongoose.Types.ObjectId.isValid(owner)){
        return res.status(400).json({error:'You should be a valid user!!'})
    }

    if(!name||!issues||!content||!description||!visibility){
        return res.status(400).json({error:'All Fields Are not required!!'})
    }
   try {
    const newRepository=new Repository({
        name,
        description,
        visibility,
        content,
        issues,
        owner,
    });

    const result =await newRepository.save();

    return res.status(201).json({
        message:"New Repository Created",
        repositoryId:result._id,
    })
   } catch (error) {
     return handleError(res, err, 'Create Repository');
   }
}

export const getAllRepositories=(req,res)=>{
    res.send("ALl REpoos fetched");
}

export const fetchRepositoryById=(req,res)=>{
    res.send("Repoo with id fetched");
}

export const fetchRepositoryByName=(req,res)=>{
    res.send("Repoo of the name fetched");
}

export const fetchRepositoryForCurrentUser=(req,res)=>{
    res.send("Repo of cuurent user fetched");
}

export const updateRepositoryById=(req,res)=>{
    res.send("repo updated");
}

export const toggleVisibilityById=(req,res)=>{
    res.send("Repooos visibility toggledd");
}

export const deleteRepositoryById=(req,res)=>{
    res.send("Repoo deleted");
}



