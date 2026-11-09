import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true,
        unique: true,
        trim:true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase:true,
        trim:true,
    },
    password:{
        type:String,
        select: false,  //keeps the password field out of user model when called .can be added if want in query.
    },
    repositories:[
        {
            
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Repository',
        }
    ],
    followedUsers:[
        {
            
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    starredRepositories:[
        {
            
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Repository',
        },
    ],
},
{ timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;