import { asyncHandler } from "../utils/asynceHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import { User } from "../models/users.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation
  // check if user already exist
  // check for images , check for avtar
  // upload them to cloudinary , check success or not
  // create user object , create entry in db
  // remove password and refresh token field from response back to user
  // check for user creation
  // return res

  // get user details from frontend
  const { fullname, email, username, password } = req.body;

  // validation
  //   if (fullname === "") {
  //     throw new ApiError(400, "FullName is Required");
  //   }

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields are compulsary");
  }

  // check if user already exist
  // here we want to check for both email and username, both should be unique
  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  });

  if (!existedUser) {
    throw new ApiError(409, "User or Email already exist");
  }

  //   check for images , check for avtar
  const avatarlocalPath = req.files?.avatar[0]?.path;
  const coverImagelocalPath = req.files?.coverImage[0]?.path;

  if (!avatarlocalPath) throw new ApiError(400, "Avatar file is required");

  //upload them to cloudinary , check success or not
  const avatar = await uploadOnCloudinary(avatarlocalPath);
  const coverImage = await uploadOnCloudinary(coverImagelocalPath);

  if (!avatar) throw new ApiError(400, "Avatar file is required");

  // create user object , create entry in db
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username,
  });

  // remove password and refresh token field from response back to user
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // check for user creation
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong registering the user");
  }

  // return res
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Created"));
    
});

export { registerUser };
