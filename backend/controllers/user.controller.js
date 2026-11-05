import dotenv from "dotenv"
import {MongoClient} from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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

export const getAllusers=async(req,res)=>{
    res.status(200).json({
        message:'All users',
    });
};

export const signup = async (req, res) => {
    const { username, password, email } = req.body;

    try {
        await connectClient();

        const db = client.db("forgeLab");
        const usersCollection = db.collection("users");

        const user = await usersCollection.findOne({ username });

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

