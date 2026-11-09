import dotenv from "dotenv"
import mongoose from "mongoose"
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from '../models/user.model.js';
import Repository from '../models/repo.model.js';
dotenv.config();


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


const createToken = (userId) =>{
    return jwt.sign({ id: userId.toString() }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
}

function isValidId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

export const signup = async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'username, email and password are required' });
    }

    try {
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user =await User.create({
            username,
            email,
            password: hashedPassword,
        });

        return res.status(201).json({
            message: 'User registered successfully',
            token: createToken(user._id),
        });
    } catch (err) {
        return handleError(res, err, 'signup');
    }
};

export const login=async (req,res) => {
    const {email,password}=req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'email and password are required' });
    }

    try{
      
        //check if email exists
        const user = await User.findOne({ email }).select('+password'); //as we have not selected password we manually add it here.

        //if email does not we cannot perform 
        if (!user) {
            return res.status(401).json({message: "Invalid Credentialss"});
        }

        const isMatch= await bcrypt.compare(password,user.password);

        if(!isMatch){
            return res.status(401).json({message: "Invalid Credentialss"});
        }

        return res.json({ token: createToken(user._id), userId: user._id });

    }catch(err){
        return handleError(res, err, 'login');
    }
};

export const getAllusers=async(req,res)=>{
    try {
        const users=await User.find().select('username email');
        return res.json(users);
    } catch (err) {
        return handleError(res, err, 'fetching users');
    }
};


export const getUserProfile=async (req,res) => {
    const {id}=req.params;

    if(!isValidId(id)){
        return res.status(400).json({ message: 'Invalid ID' });
    }

    try {
        const user=await User.findById(id).populate('repositories', 'name visibility');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.json({ message: 'Profile fetched', user });
    } catch (err) {
        return handleError(res, err, 'fetching profile');
    }
};

export const updateUserProfile=async (req,res) => {
    const {id}=req.params;

    const {username,email,password}=req.body;

    if (!isValidId(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }
    try {
        // Only add the fields the user actually sent
        let updates={};

        if(username){
            updates.username=username;
        }

        if(email){
            updates.email=email;
        }

        if(password){
            updates.password=await bcrypt.hash(password,10);
        }

        const user=await User.findByIdAndUpdate(id,updates,{
            new:true,
            runValidators: true,
        }
    );

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(user);
    } catch (error) {
        return handleError(res, err, 'profile update');
    }
};

export const deleteUserProfile=async (req,res) => {
    const {id}=req.params;

    if (!isValidId(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    try {
        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

       return  res.json({message:"User Profile Deleted!!"});
    } catch (error) {
        return handleError(res, err, 'profile deletion');
    }
};

