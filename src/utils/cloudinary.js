import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
//fs is the file system , bydefault with nodejs

cloudinary.config({
  cloud_name: process.env.CLOUDNINARY_CLOUD_NAME,
  api_key: process.env.CLOUDNINARY_API_KEY,
  api_secret: process.env.CLOUDNINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // upload the file on cloudninary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // file has been uploaded successfull
    console.log("file is uploaded", response.url);
    fs.unlinkSync(localFilePath)
    return response;

  } catch (error) {
        // to remove the locally saved temporary file as the upload operation got failed
        fs.unlinkSync(localFilePath)
        return null;
  }
};

export {uploadOnCloudinary}

