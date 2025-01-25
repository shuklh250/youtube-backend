import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary } from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"


const registerUser = asyncHandler(async (req, res) => {
        // get user details from frontend
        // validation - not empty
        // check if user already exists: user_name , email
        // check for image, check for avtar 
        // upload them to cloudinary, avtar 
        // create user object - create entry in db 
        const { username, email, fullname, passowrd } = req.body

        console.log("email:", email)

        // if(fullname === ""){

        //         throw new ApiError(400,"fullname is required");
        // }

        if (
                [fullname, email, username, password].some((field) =>
                        field?.trim() === "")
        ) {
                throw new ApiError(400, "All fields are required")
        }

        const existedUser = User.findOne({
                $or: [{ username }, { email }]

        })
        if(existedUser){

                throw new ApiError(409,"User with email or username alerady exists")
        }

        const avtarLocalPath = req.files?.avtar[0]?.path;
        const coverImageLocalPath = req.files?.coverImage[0]?.path;

        if(!avtarLocalPath){
                throw new ApiError(400,"Avtar files is required");
        }

        const avatar = await uploadOnCloudinary(avtarLocalPath)
        const coverImage = await uploadOnCloudinary(coverImageLocalPath)

        if(!avatar){

                throw new ApiError(400,"Avtar files is required");
        }

      const user =   await User.create({
                fullname,
                avatar:avatar.url,
                coverImage: coverImage?.url || "",
                email,
                passowrd,
                username:username.toLowerCase()
        })

        const createdUser = await User.findbyId(user._id).select("-password -refreshtoken")

        if(!createdUser){

                throw new ApiError(500,"something went wrong while regstring user ")
        }
        return res.status(201).json(

                new ApiResponse(200, createdUser, "User Register Successfully")
        )
})

export { registerUser }