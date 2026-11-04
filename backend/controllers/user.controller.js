import dotenv from "dotenv"
import {MongoClient} from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const mongodb_uri=process.env.mongodb_uri;

let client;

async function connectClient() {
    if(!client){
        client=new MongoClient(mongodb_uri,{useNewUrlParser:true,useUnifiedTopology:true});
    }

    await client.connect();
}

export const getAllusers=async(req,res)=>{
    res.status(200).json({
        message:'All users',
    });
};

export const signup=async (req,res) => {
   
};

export const login=async (req,res) => {
    res.status(200).json({
        message:'Login',
    });
};

export const getUserProfile=async (req,res) => {
    res.status(200).json({
        message:'User profile',
    });
};

export const updateUserProfile=async (req,res) => {
    res.status(200).json({
        message:'Update user profile',
    });
};

export const deleteUserProfile=async (req,res) => {
    res.status(200).json({
        message:'Delete user profile',
    });
};

