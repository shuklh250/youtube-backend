import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});
const uploadOnCloud = async (localfile) => {
    
    try {

        if (!localFilePath) return null
        // upload the file on cloudinary

        const response = await cloudinary.uploader.upload(localFilePath, {

            resource_type: "auto"

        })
        // file has been  uploaded successfully
        console.log("File is uploaded on cloudinary", response.url);

        return response;
    } catch (error) {

        fs.unlinkSync(localFilePath)
        // remove the locally saved temporary files as the uoload operation got failed

        return null;
    }

}

export { uploadOnCloudinary }