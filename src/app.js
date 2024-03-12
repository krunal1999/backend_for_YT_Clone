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

app.use(express.static("public"))

app.use(cookieParser())

export { app };
