import { asyncHandler } from "../utils/asynceHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import { User } from "../models/users.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

import jsonwebtoken from "jsonwebtoken";

const genrateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Sommething went wrong while generating Token");
  }
};

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
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
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

const loginUser = asyncHandler(async (req, res) => {
  // get the user data
  // data validation
  // check if user exist
  // check if user credential match
  // if match then generte access token and refresh tokem
  // send tokens to user using secure cookies

  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Username or Email is required!!!");
  }

  // alternate of above code
  // if (!(username || email)) {
  //   throw new ApiError(400, "Username or Email is required!!!");
  // }

  const currentUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!currentUser) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await currentUser.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "User or Password does not match");
  }
  const { accessToken, refreshToken } = await genrateAccessAndRefreshToken(
    currentUser._id
  );

  const loggedInUser = await User.findById(currentUser._id).select(
    "-password -refreshToken"
  );

  // sending cookies
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
        { user: loggedInUser, accessToken, refreshToken },
        "user logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // clear the cookies
  // clear the token
  // we need middleware (authMiddleware) to bring the userId with it
  // we need to create secure route and middleware and add user detail there in middleware req.user._id

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // get the refresh token via cookie

  try {
    const token =
      req.cookies?.refreshToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (token) {
      throw new ApiError(401, "UnAuthorized Request");
    }

    const decodedToken = jsonwebtoken.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET
    );

    console.log(decodedToken);

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "UnAuthorized Request");
    }

    if (token !== user?.refreshToken) {
      throw new ApiError(401, "UnAuthorized Request");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newrefreshToken } = await genrateAccessAndRefreshToken(
      user,
      _id
    );

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
      );
  } catch (error) {
    throw new ApiError(401, "Invalid Refresh Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  // here it will check if password is modified or not, if yes then it will encrypt it
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current User fetched"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const newUserData = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, newUserData, "Account Details updated"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploding avatar");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }.select("-password -refreshToken")
  );
  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Avatar image updated"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverLocalPath = req.file?.path;

  if (!coverLocalPath) {
    throw new ApiError(400, "cover Image file is missing");
  }
  const coverImage = await uploadOnCloudinary(coverLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploding coverImage");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }.select("-password -refreshToken")
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "cover image updated"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
};
