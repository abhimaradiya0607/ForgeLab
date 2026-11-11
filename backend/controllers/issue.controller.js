import mongoose from "mongoose"
import User from "../models/user.model"
import Repository from "../models/repo.model"
import Issue from "../models/issue.model"


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



export const createIssue=async(res,req)=>{
    const {title,description}=req.body;

    const {id}=req.params;
    if(!isValidId(id)){
        return res.status(404).json({message:'Valid Id is required'});
    }
    try {
        const issue=new Issue({
            title,
            description,
            repository:id,
        });
    
        await issue.save();

        return res.status(201).json({message:'Issue Created Successfully',issue});
    } catch (err) {
        return handleError(res,err,'Error During Issue Creation ')
    }
    
}

export const updateIssueById = async (req, res) => {
    const { id } = req.params;

    const { title, description, status } = req.body;

    if (!isValidId(id)) {
        return res.status(400).json({
            message: "Valid ID is required"
        });
    }

    if (!title && !description && !status) {
        return res.status(400).json({
            message: "At least one field is required to update"
        });
    }

    try {
        const updateFields = {};

        if (title !== undefined) updateFields.title = title;
        if (description !== undefined) updateFields.description = description;
        if (status !== undefined) updateFields.status = status;

        const issue = await Issue.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!issue) {
            return res.status(404).json({
                message: "Issue not found"
            });
        }

        return res.status(200).json({
            message: "Issue updated successfully",
            issue
        });

    } catch (err) {
        return handleError(res, err, "Error During Issue Updation");
    }
};


export const deleteIssueById=async(req,res)=>{
    const id=req.params;

    if(!isValidId(id)){
        return res.status(400).json({
            message: "Valid ID is required"
        });
    };

    try {
        const issue=await Issue.findByIdAndDelete(id);

        if(!issue){
            return res.status(400).json({message:'Failed to Delete Issue'});
        }

        return res.status(200).json({message:'Issue Deleted Successfullyyy'});
    } catch (err) {
        return handleError(res, err, "Error During Deletion");
    }
}

export const getAllIssues=async(req,res)=>{
    const id=req.params;

    if(!isValidId(id)){
        return res.status(400).json({
            message: "Valid ID is required"
        });
    }
    try {
        const issues=await Issue.find({repository:id});

        if(!issues || issues.length==0){
            return res.status(400).json({message:'Issues Not Found'})
        }

        return res.status(200).json({message:'Issues Foundd',issues});
    } catch (err) {
        return handleError(res, err, "Error During Isssue Fetchingg");
    }
}

export const getIssueById=async(req,res)=>{
    const id=req.params;

    if(!isValidId(id)){
        return res.status(400).json({
            message: "Valid ID is required"
        });
    }

    try {
        const issue=await Issue.findById(id);

        if(!issue){
            return res.status(400).json({message:'Issue Not Found for the above id'})
        }
        return res.status(200).json({message:'Issue Foundd for the above Repo',issue});
    } catch (err) {
        return handleError(res, err, "Error During Isssue Fetchingg By Id :");
    }
}
