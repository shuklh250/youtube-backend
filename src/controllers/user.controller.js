import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId) => {
        try {
                const user = await User.findById(userId);
                const accessToken = user.generateAccessToken();
                const refreshToken = user.generateRefreshToken();
                console.log(accessToken);

                user.refreshToken = refreshToken;
                await user.save({ validateBeforeSave: false });

                return { accessToken, refreshToken };
        } catch (error) {
                throw new ApiError(
                        500,
                        "Something went wrong while generating refresh and access token"
                );
        }
};

const registerUser = asyncHandler(async (req, res) => {
        // get user details from frontend
        // validation - not empty
        // check if user already exists: user_name , email
        // check for image, check for avtar
        // upload them to cloudinary, avtar
        // create user object - create entry in db
        const { username, email, fullname, password } = req.body;

        // if(fullname === ""){

        //         throw new ApiError(400,"fullname is required");
        // }

        if (
                [fullname, email, username, password].some(
                        (field) => field?.trim() === ""
                )
        ) {
                throw new ApiError(400, "All fields are required");
        }

        const existedUser = await User.findOne({
                $or: [{ username }, { email }],
        });
        if (existedUser) {
                throw new ApiError(409, "User with email or username alerady exists");
        }

        const avtarLocalPath = req.files.avatar[0].path;
        // const coverImageLocalPath = req.files?.coverImage[0]?.path;

        // console.log(avtarLocalPath);
        let coverImageLocalPath;
        if (
                req.files &&
                Array.isArray(req.files.coverImage) &&
                req.files.coverImage.length > 0
        ) {
                coverImageLocalPath = req.files.coverImage[0].path;
        }

        if (!avtarLocalPath) {
                throw new ApiError(400, "Avatar files is required");
        }

        const avatar = await uploadOnCloudinary(avtarLocalPath);
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);
        console.log(req.body);
        console.log(avatar, "here");

        if (!avatar) {
                throw new ApiError(400, "Avtar files is required");
        }

        const user = await User.create({
                fullname,
                avatar: avatar.url,
                coverImage: coverImage?.url || "",
                email,
                password,
                username: username.toLowerCase(),
        });

        const createdUser = await User.findById(user._id).select(
                "-password -refreshtoken"
        );

        if (!createdUser) {
                throw new ApiError(500, "something went wrong while regstring user ");
        }
        return res
                .status(201)
                .json(new ApiResponse(200, createdUser, "User Register Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
        // req body -> data
        // username or email
        // find the user
        // password check
        // generate acceess token and refresh token
        //send cookie

        const { email, username, password } = req.body;

        console.log(email);

        if (!(username || email)) {
                throw new ApiError(400, "username or password is required");
        }

        const user = await User.findOne({
                $or: [{ username }, { email }],
        });

        if (!user) {
                throw new ApiError(404, "Userdoes not exist ");
        }

        const isPasswordValid = await user.isPasswordCorrect(password);

        if (!isPasswordValid) {
                throw new ApiError(401, "Invalid user credentials");
        }
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
                user._id
        );
        console.log(accessToken)
        const loggedInUser = await User.findById(user._id).select(
                "-password -refreshToken"
        );

        const options = {
                httpOnly: true,
                secure: true,
        };

        return res
                .status(200)
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", refreshToken, options)
                .json(
                        new ApiResponse(
                                200,
                                {
                                        user: loggedInUser,
                                        accessToken,
                                        refreshToken,
                                },
                                "User logged In Successfully"
                        )
                );
});

const logoutUser = asyncHandler(async (req, res) => {
        await User.findByIdAndUpdate(req.user._id, {
                $set: {
                        refreshToken: undefined,
                },
        });
        const options = {
                httpOnly: true,
                secure: true,
        };

        return res
                .status(200)
                .clearCookie("accessToken", options)
                .clearCookie("refreshToken", options)
                .json(new ApiResponse(200, {}, "User loged Out "));
});



const refreshAccessToken = asyncHandler(async (req, res) => {

        const incomingRefereshToken = req.cookies.refreshAccessToken || req.body.refreshToken

        if (!incomingRefereshToken) {
                throw new ApiError(401, "unauthorized request")
        }

        try {
                const decodedToken = jwt.verify(
                        incomingRefereshToken, process.env.REFRESH_TOKEN_SCREAT
                )

                const user = await User.findById(decodedToken?._id)
                if (!user) {
                        throw new ApiError(401, "Invalid refresh token")
                }
                if (incomingRefereshToken !== user?.refreshtoken) {
                        throw new ApiError(401, "Refresh token is expired or used")

                }

                const options = {

                        httpOnly: true,
                        secure: true
                }
                const { accessToken, newrefreshToken } = await generateAccessAndRefreshTokens(user._id)
                return res
                        .status(200)
                        .cookie("accessToken", accessToken, options)
                        .cookie("refreshToken", newrefreshToken, options)
                        .json(
                                new ApiResponse(
                                        200,
                                        { accessToken, refreshToken: newrefreshToken },
                                        "Access Token refreshed"

                                )

                        )
        } catch (error) {

                throw new ApiError(401, error?.message || "Invalid refresh token")
        }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {

        const { oldPassword, newPassword } = req.body
        const user = await User.findById(req.user?._id)

        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

        if (!isPasswordCorrect) {
                throw new ApiError(400, "Invalid old password");
        }

        user.password = newPassword
        await user.save({ validationBeforeSave: false })
        return res
                .status(200)
                .json(new ApiResponse(200, {}, "Password changed successfully"))

})

const getCurrentUser = asyncHandler(async (req, res) => {

        return res
                .status(200)
                .json(new ApiResponse(200, req.user, "current user fatched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {

        const { fullname, email } = req.body

        if (!fullname || !email) {

                throw new ApiError(400, "All feilds are required")
        }
        User.findByIdAndUpdate(

                req.user?._id, {

                $set: {
                        fullname,
                        email: email
                }
        },
                { new: true }
        ).select("-password")

        return res
                .status(200)
                .json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {

        const avatarLocalPath = req.file?.path
        if (!avatarLocalPath) {
                throw new ApiError(400, "Avatar file is missing")
        }
        const avatar = await uploadOnCloudinary(avatarLocalPath)

        if (!avatar.url) {
                throw new ApiError(400, "Error while uploading on avatar")
        }

        const user = await User.findByIdAndUpdate(

                req.user?._id,
                {
                        $set: {
                                avatar: avatar.url
                        }
                },
                { new: true }
        ).select("-password")
        return res
                .status(200)
                .json(

                        new ApiResponse(200, user, "Avatar  updated successfully")
                )

})

const updateUserCoverImage = asyncHandler(async (req, res) => {

        const coverImageLocalPath = req.file?.path
        if (!coverImageLocalPath) {
                throw new ApiError(400, "Cover Image file is missing")
        }
        const coverImage = await uploadOnCloudinary(coverImageLocalPath)

        if (!coverImage.url) {
                throw new ApiError(400, "Error while uploading on coverImage")
        }

        const user = await User.findByIdAndUpdate(

                req.user?._id,
                {
                        $set: {
                                coverImage: coverImage.url
                        }
                },
                { new: true }
        ).select("-password")

        return res
                .status(200)
                .json(

                        new ApiResponse(200, user, "Cover image updated successfully")
                )

})

const getUserChannelProfile = asyncHandler(async (req, res) => {

        const { username } = req.params

        if (!username?.trim()) {
                throw new ApiError(400, "username is missing")

        }

        const channel = await User.aggregate([


                
        ])

})

export {
        registerUser,
        loginUser,
        logoutUser,
        refreshAccessToken,
        changeCurrentPassword,
        getCurrentUser,
        updateAccountDetails,
        updateUserAvatar,
        updateUserCoverImage,
        getUserChannelProfile
};
