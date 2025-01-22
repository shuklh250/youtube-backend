import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const viedoSchema = new Schema(
    {
        viedoFile: {
            type: String,
            required: true
        },
        thumbnail: {

            type: String,
            rewquired: true
        },
        title: {
            type: String,
            required: true
        },
        description:{
            type:String,
            required: true            
        },
        duration:{

            type:Number,
            required:true
        },
        views:{
            type:Number,
            default:0

        },
        isPublished:{
            type:Boolean,
            default:true
        
        },
        owner:{


        }

    },
    {
        timestamps: true
    }
)
viedoSchema.plugin(mongooseAggregatePaginate) 

export const Viedo = mongoose.model("Viedo", viedoSchema)
