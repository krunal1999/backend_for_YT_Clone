import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

// most of the time , to use middlerware or configuration we use app.use
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "16kb",
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);
app.use(express.static("public"));
app.use(cookieParser());

// routes imports
import { router as userRouter } from "./routes/user.routes.js";

// routes decalaration
// app.get() when we were using this, at that time we were giving routes and controller at the same place
// But now we have differnet files for routes and controllers, we need to use app.use()
app.use("/api/v1/users", userRouter);
// http://localhost:3000/api/v1/users/register

export { app };
