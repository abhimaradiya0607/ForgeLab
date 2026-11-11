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
   } catch (err) {
     return handleError(res, err, 'Create Repository');
   }
}

export const getAllRepositories=async (req,res)=>{
    try {
        const repositories=await Repository.find({})
        .populate("owner")
        .populate("issues");

        if(!repositories){
            return res.status(404).json({message:'No Repo Found'})
        }

        return res.json(repositories);
    } catch (err) {
        return handleError(res, err, 'Get All Repository');
    }
}

export const fetchRepositoryById=async (req,res)=>{
    const {id}=req.params;

    if(!isValidId){
        return res.status(404).json({message:'ID is required for the repo'})
    }

    try {
        const repository=await Repository.find({_id:id}) //filter condition
        .populate("owner")
        .populate("issues");

        if (repository.length === 0) {
            return res.status(404).json({
                message: "No repositories found"
            });
        }

        return res.status(200).json(repository);

    } catch (err) {
        return handleError(res, err, 'Fetch Repo By Id: ');
    }

}

export const fetchRepositoryByName=async (req,res)=>{
    const repoName=req.params.name;

    if(!repoName){
        return res.status(404).json({message:'Name is required for the repo'})
    }

    try {
        const repository=await Repository.find({name:repoName}) //filter condition
        .populate("owner")
        .populate("issues");

        if (repository.length === 0) {
            return res.status(404).json({
                message: "No repositories found"
            });
        }

        return res.status(200).json(repository);

    } catch (err) {
        return handleError(res, err, 'Fetch Repo By Name: ');
    }
}

export const fetchRepositoryForCurrentUser=async (req,res)=>{
    const userId=req.user;

    if(!userId){
        return res.status(404).json({message:'You need to be authorized'})
    }

    try {
        const repositories=await Repository.find({owner:userId});

        if(!repositories || repositories.length==0){
            return res.status(404).json({
                message: "No repositories found"
            });
        }

        return res.status(200).json({message:'Repositories foundd',repositories});
    } catch (error) {
        return handleError(res, err, 'Fetch Repo Of Current User: ');
    }
}

export const updateRepositoryById=async (req,res)=>{
    const id=req.params;

    const {description,content}=req.body;


    if(!isValidId(id)){
        return res.status(404).json({message:'Valid Id is required'});
    }

    try {
        const repository=await Repository.findById(id);

        if(!repository){
            return res.status(404).json({message:'Repository which needs to be updated not foound'})
        }

        repository.content.push(content);
        repository.description=description;

        const updatedRepo=await Repository.save();

        return res.json({message:'Repository Updated Successfullyy',updatedRepo});
    } catch (err) {
        return handleError(res, err, 'Error During Repo Update: ');
    }
}

export const toggleVisibilityById=async (req,res)=>{
    const id=req.params;

    if(!isValidId(id)){
        return res.status(404).json({message:'Valid Id is required'});
    }

    try {
        const repository=await Repository.findById(id);

        if(!repository){
            return res.status(404).json({message:'Repository which needs to be Toggled not foound'})
        }

        repository.visibility=!repository.visibility;

        const updatedRepo=await Repository.save();

        return res.json({message:'Repository Toggled Successfullyy',updatedRepo});
    } catch (err) {
        return handleError(res, err, 'Error During Repo Toggle: ');
    }
}

export const deleteRepositoryById=async(req,res)=>{
   const id=req.params;

   if(!isValidId(id)){
    return res.status(404).json({message:'Valid Id is required'});
   }

   try {
    const repository=await Repository.findByIdAndDelete(id);

    if(!repository){
        return res.status(404).json({message:'Cannot Delete The Repository'})
    }
    return res.json({message:'Repository Deleted Successfully',repository});
   } catch (err) {
    return handleError(res, err, 'Error During Delete: ');
   }
}



