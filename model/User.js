import mongoose from "mongoose";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import crypto from 'crypto'

const UserSchema = new mongoose.Schema(
  {
    username: { 
        type: String,
         required: [true,'username is required'],
         minLength:[5,'Username must be at least 5 character'],
         maxLength:[50,'Name should be less than 50 characters'],
         lowercase:true,
         trim:true,
        },
    email: {
         type: String,
          required: [true,'Email is required'],
          lowercase:true,
          trim:true,
           unique: true,
        },
    password: { 
        type: String,
         required: [true,'password is required'],
         minLength:[8,'password must be at least 8 characters'],
         select:false,
         },
         avatar:{
            public_id:{
                type:String,
            },
            secure_url:{
                type:String,
            },
         },
    role: {
      type: String,
      enum:['USER','ADMIN'],
      default:"USER"
    },
    forgotPasswordToken:String,
    forgotPasswordExpiry:Date
  },
  { timestamps: true }
);
UserSchema.methods={
  generateJwtToken: async function(){
    return await jwt.sign(
      {id:this._id, email:this.email, subscription:this.subscription, role:this.role},
      process.env.JWT_SECRET || "2A7$uN76*P1c!b%3^xZqG47HJm&8uB",
      {
        expiresIn:process.env.JWT_EXPIRY || "7d",
      },
    );
  },
  comparePassword:async function(plainTextPassword){
    return await bcrypt.compare(plainTextPassword,this.password)
  },
  generatePasswordResetToken: async function(){
   const resetToken=crypto.randomBytes(20).toString("hex");

   this.forgotPasswordToken = crypto
   .createHash('sha256')
   .update(resetToken)
   .digest('hex')
   ;
   this.forgotPasswordExpiry=Date.now() + 15 * 60 * 1000; //15min from now
   await this.save(); // Save the user document with the new token and expiry
   return resetToken; // Return the un-hashed token
  }
}

const User= mongoose.models.User || mongoose.model("User", UserSchema);
export default  User;