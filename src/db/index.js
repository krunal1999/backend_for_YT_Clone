import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    //mongoose return the object
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URL}/${DB_NAME}`
    );
    console.log(`\n MONGODB connected !! DB HOST: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.log(error);
    // read more about it
    process.exit(1);
  }
};

export default connectDB;
