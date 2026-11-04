import mongoose from 'mongoose';
import { Schema } from 'mongoose';


const repoSchema=new Schema({
    name:{
        type:String,
        unique:true,
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
});

const Repository=mongoose.model('Repository',repoSchema);

export default Repository;