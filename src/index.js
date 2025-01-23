// import mongoose from "mongoose";
// import {DB_NAME} from "./constants"
import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})

connectDB(  )

.then(()=>{
  aap.listen(process.env.PORT || 8000, () => {
    console.log(`Server is rinning at port :${process.env.PORT}`);

  })

})

.catch((err) =>{

console.log("MONGO db connection failed !!!", err);

})



/*
import express from "express"

const app = express()

(async () =>{

try{
  await  mongoose.connect(`${process.env.MONGODB_URI}`)
  app.on("error",()=>{
    console.log("ERROR",error);
    throw error
  })

  app.listen(process.env.PORT,() => {
        console.log(`App is listing on port ${process.env.PORT}`);
 })
}catch(error){
    console.error("ERROR: ",error)
throw err
}

})()
*/
