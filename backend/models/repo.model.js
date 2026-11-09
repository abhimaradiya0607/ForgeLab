import mongoose from 'mongoose';
import { Schema } from 'mongoose';


const repoSchema=new Schema({
    name:{
        type:String,
        unique:true,
        required:true,
        trim: true,
    },
    description:{
        type:String,
    },
    content:[
        {
            type:String,
        },
    ],
    visibility:{
      type:Boolean,
      default:true,
    },
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    issues:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:'Issue',
        }
    ]
},
{ timestamps: true }
);

const Repository=mongoose.model('Repository',repoSchema);

export default Repository;