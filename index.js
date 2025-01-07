import express from  "express" 
const app = express();
import mongoose from  "mongoose" ;
import dotenv from  "dotenv" ;
import morgan from  "morgan";
import cors from  "cors" 
import  cloudinary  from 'cloudinary'
dotenv.config();
import authRoute from "./router/auth.js";
import cookieParser from "cookie-parser";
import courseRoute from './router/courses.js'
import paymentRoute from './router/payment.js'
import Razorpay from "razorpay";

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(morgan("common"));
app.use(cookieParser());


// app.use(cors({
//     origin: "http://localhost:5173", 
//     methods: ["GET", "POST", "PUT", "DELETE"],
//   }));

async function mongoDB(){
    try {
    await mongoose.connect(process.env.MONGO_URL);
      console.log('database is connected!')
    } catch (error) {
        console.log('database connection is failed!',error)
    }

}
mongoDB();
app.use('/api/auth',authRoute)
app.use('/api/course',courseRoute)
app.use("/api/payment",paymentRoute)

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        
})

export const razorpay=new Razorpay({
    key_id:process.env.RAZORPAY_KEY_ID,
    key_secret:process.env.RAZORPAY_SECRET,
});

app.all('*',(req,res)=>{
    return res.send('OOPS something wrong!')
})

const PORT=process.env.PORT || 5004
app.listen(PORT,()=>{
    console.log(`server on http://localhost:${PORT}`)
})