import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
} from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// injecting middleware
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    { name: "coverImage", maxcount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refreshtoken").post(refreshAccessToken);

router.route("/changepassword").post(verifyJWT, changeCurrentPassword);

router.route("/currentuser").post(verifyJWT, getCurrentUser);

router.route("/updateaccount").patch(verifyJWT, updateAccountDetails);

router
  .route("/update-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateAvatar);

router
  .route("/update-cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateCoverImage);

router.route("/c/:username").get(verifyJWT, getUserChannelProfile);

router.route("/watchhistory").get(verifyJWT, getWatchHistory);

export { router };
