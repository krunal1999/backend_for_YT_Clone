// require('dotenv').config({path: './env'})

import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

app.on("error", (error) => {
  console.log("APP FAILED", error);
  throw error;
});

connectDB()
  .then((response) => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is runing at port ${process.env.PORT}`);
    });
  })
  .catch((error) => console.log("MONGO CONNECTION FAILED !! ", error));
