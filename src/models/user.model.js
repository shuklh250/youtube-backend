import mongoose ,{Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"


const userSchema = new Schema(
    {

        username:{
            type:String,
            required:[true,"Username field is required"],
            unique:true,
            lowercase:true,
            trime:true,
            index:true
        },
         email:{

            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trime:true
         },
         fullname:{

            type:String,
            required:true,
            trime:true,
            index:true

         },
         avatar:{
            type:String,
            required:true
         },
         coverImage:{
            type:String
         },
         watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"Video"
            }
         ],
         password:{
            type:String,
            required:[true,'Password is required']

         },
         refreshtoken:{
            type:String

         },
         owner:[
            {
         
            type:Schema.Types.ObjectId,
              ref:"User"  
         
            }
        ]
},
    {
        timestamps: true
    }

)

userSchema.pre("save", async function(next) {

    if(!this.isModified("password")) return next(); 
    this.password = await bcrypt.hash(this.password,10)
    next()


    // ++++++ this method is also use 

    // if(this.isModified("password")){
    //     this.password = bcrypt.hash(this.password,10)
    //     next()
    // }
    
})

userSchema.methods.isPasswordCorrect = async function (password){
    
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){

    return jwt.sign({

        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname

    },
    process.env.ACCESS_TOKEN_SCREAT,
    {

        expiresIn: process.env.ACCESS_TOEKEN_EXPIRY
    }
)
}

userSchema.methods.generateRefreshToken = function(){

    return jwt.sign({

             _id: this._id,   

    },
    process.env.REFRESH_TOKEN_SCREAT,
        {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY

        }
)
}

export const User = mongoose.model("User",userSchema)