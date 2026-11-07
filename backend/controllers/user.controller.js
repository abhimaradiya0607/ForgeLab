import dotenv from "dotenv"
import {MongoClient, ReturnDocument} from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

dotenv.config();

const mongodb_uri=process.env.MONGODB_URI;

let client;

async function connectClient() {
    if (!client) {
        const uri = process.env.MONGODB_URI;

        if (!uri) {
            throw new Error("MONGODB_URI is missing from environment variables");
        }

        client = new MongoClient(uri);
        await client.connect();

        console.log("Connected to MongoDB");
    }

    return client;
}



export const signup = async (req, res) => {
    const { username, password, email } = req.body;

    try {
        await connectClient();

        const db = client.db("forgeLab");
        const usersCollection = db.collection("users");

        //check user exists
        const user = await usersCollection.findOne({ username });
        //if exists cannot create another
        if (user) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            username,
            password: hashedPassword,
            email,
            repositories: [],
            followedUsers: [],
            starRepos: []
        };

        const result = await usersCollection.insertOne(newUser);

        const token = jwt.sign(
            { id: result.insertedId.toString() },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "1h" }
        );

        return res.status(201).json({
            message: "User registered successfully",
            token
        });

    } catch (error) {
        console.error("Error during signup:", error);
        return res.status(500).json({
            message: "Server Error"
        });
    }
};

export const login=async (req,res) => {
    const {email,password}=req.body;

    try{
        await connectClient();

        const db = client.db("forgeLab");
        const usersCollection = db.collection("users");

        //check if email exists
        const user = await usersCollection.findOne({ email });

        //if email does not we cannot perform 
        if (!user) {
            return res.status(500).json({
                message: "Invalid Credentialss"
            });
        }

        const isMatch=await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.status(500).json({
                message: "Invalid Credentialss"
            });
        }

        const token=jwt.sign({id:user._id},process.env.JWT_SECRET_KEY,{expiresIn:"1h"});

        res.json({token,userId:user._id});
    }catch(err){
        console.error("Error During Login:",err.message);
        res.status(500).send("Server Error");
    }
};

export const getAllusers=async(req,res)=>{
    try {
        await connectClient();

        const db = client.db("forgeLab");
        const usersCollection = db.collection("users");

        const users=await usersCollection.find({}).toArray();

        res.json(users);
    } catch (error) {
        console.error("Error During fetching:",err.message);
        res.status(500).send("Server Error");
    }
};


export const getUserProfile=async (req,res) => {
    const currentId=req.params.id;

    try {
        await connectClient();

        const db = client.db("forgeLab");
        const usersCollection = db.collection("users");

        const user=await usersCollection.findOne({
            _id:new ObjectId(currentId),
        });

        if (!user) {
            return res.status(404).json({
                message: "User Not Found"
            });
        }
        res.send(user,{message:"Profile Fetched!!!"})
        
    } catch (error) {
            console.error("Error During fetching User Profile:",error.message);
            res.status(500).send("Server Error");
    }
};

export const updateUserProfile=async (req,res) => {
    const currentId=req.params.id;

    const {email,password}=req.body;

    try {
        await connectClient();

        const db = client.db("forgeLab");
        const usersCollection = db.collection("users");

        let updateFields={email};

        if(password){
            const salt=await bcrypt.genSalt(10);
            const hashedPassword=await bcrypt.hash(password,salt);
            updateFields.password=hashedPassword;
        }

        const result=await usersCollection.findOneAndUpdate({
            _id:new ObjectId(currentId)
        },{$set:updateFields},
        {returnDocument:"after"}
    );

    if (!result) {
        return res.status(404).json({
            message: "User not found"
        });
    }

    res.status(200).json(result);
    } catch (error) {
        console.error("Error During Profile Updation:",error.message);
        res.status(500).send("Server Error");
    }
};

export const deleteUserProfile=async (req,res) => {
    const currentId=req.params.id;

    try {
        await connectClient();

        const db = client.db("forgeLab");
        const usersCollection = db.collection("users");

        const result=await usersCollection.deleteOne({
            _id:new ObjectId(currentId),
        });

        if(result.deleteCount==0){
            return res.status(404).json({message:"user not Found"})
        }

        res.json({message:"User Profile Deleted!!"});
    } catch (error) {
        console.error("Error During Profile Deletion:",error.message);
        res.status(500).send("Server Error");
    }
};

