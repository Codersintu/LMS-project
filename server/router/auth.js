import  { Router } from 'express';
const router=Router()
import User from '../model/user.js';
import bcrypt from 'bcrypt'
import  {isLoggedIn}  from '../middleware/auth.middleware.js';
import upload from '../middleware/multer.middleware.js';
import cloudinary from 'cloudinary'
import fs from 'fs/promises'
import sendEmail from '../utility/sendEmail.js';
import crypto from 'crypto'

const cookieOption={
    maxAge:7 * 24 * 60 * 60 * 1000, // for 7days,
    httpOnly:true,
    secure:true,
};

//create register
router.post('/register',upload.single('avatar'),async(req,res)=>{
        const {username,email,password}=req.body;
     
        if (!username || !email || !password) {
          return res.status(400).json('please fill all credentials!')
        }
     
        const userExist=await User.findOne({email:req.body.email})
     
        if (userExist) {
         return res.status(400).json('email allready exist!')
        }
        const salt=await bcrypt.genSalt(10)
        const hashPasssword=await bcrypt.hash(req.body.password,salt)

  
   try {
    const Newuser=await User.create({
        username:req.body.username,
        email:req.body.email,
        password:hashPasssword,
        avatar:{
            public_id:email,
            secure_url:''
        }
        
   })
   if (!Newuser) {
    return res.status(400).json('User registered failed!')
   }

   //file upload todo
   console.log('file detail:',req.file)
   if (req.file) {
  
    try {
        const result=await cloudinary.v2.uploader.upload(req.file.path,{
            folder:'lms',
            width:250,
            height:250,
            gravity:"faces",
            crop:"fill"
        });
        
        if (result) {
            Newuser.avatar.public_id=result.public_id;
            Newuser.avatar.secure_url=result.secure_url;

            //remove file from server
           fs.rm(`uploads/${req.file.filename}`)
        }
    } catch (error) {
        console.log('errors:',error)
        return res.status(500).json("File not upload, please try again!")
    }
   }
   await Newuser.save();
   Newuser.password=undefined;
   const token=await Newuser.generateJwtToken();
   res.cookie('token',token,cookieOption)

   return res.status(201).json({success:true, message:"User registered successfully!", Newuser,token})
   } catch (error) {
    console.error("Error during registration:", error);
    return res.status(500).json('internal error!')
   }
   
})

//login
router.post('/login',async(req,res)=>{
    try {
        const {email,password}=req.body;

        if (!email || !password) {
            return res.status(400).json('email and password are required!')
        }
        const user=await User.findOne({email}).select("+password");
        if (!user || !user.comparePassword(password)) {
            return res.status(400).json('Email and password does not match!')
        }

       
        const token=await user.generateJwtToken();
        user.password=undefined;
        res.cookie('token',token,cookieOption);
        return res.status(201).json({
            success:true,
            message:'user loggedIn successfully',
            user,
            token
        })
    } catch (error) {
        return res.status(500).json('User logged failed!')
    }
   

})

//logout
router.delete('/logOut',async(req,res)=>{
    try {
        res.cookie('token',null,{
            secure:true,
            maxAge:0,
            httpOnly:true,
        });
        return res.status(201).json({
            success:true,
            message:"User logout successfully!"
        })
    } catch (error) {
        return res.status(500).json('Invalid LogOut!')
    }
})


//get user
router.get('/',isLoggedIn,async(req,res)=>{
    try {
        const userId=req.user.id.toString();
       const user= await User.findById(userId)
       if (!user) {
        return res.status(404).json('user not found');
    }
        return res.status(201).json({
            success:true,
            message:"user get successfully!",
            user
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'User could not be fetched',
        });
    }
 
})

//forgot-password
router.post('/reset',async(req,res)=>{
    try {
        const {email}=req.body;
        if (!email) {
            return res.status(400).json('email is required!')
        }
    
        const user=await User.findOne({email})
        if (!user) {
            return res.status(400).json('Email not registered!')
        }
        const resetToken=await user.generatePasswordResetToken();
    
        await user.save();
        const resetPasswordURL=`${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        console.log(resetPasswordURL)
    
        const subject='Reset Password';
         const message=`You can reset your password by clicking <a href=${resetPasswordURL} target="_blank">Reset your password</a>\nIf the above link does not work for some reason then copy paste this link in new tab ${resetPasswordURL}.\n if you have not requested this, kindly ignore.`
        try {
            await sendEmail(email,subject,message);
          return  res.status(201).json({
                success:true,
                message:`Reset password token has been sent to ${email} successfully`
            })
    
        } catch (error) {
            user.forgotPasswordExpiry=undefined;
            user.forgotPasswordToken=undefined;
    
            await user.save();
            return res.status(500).json({
                success: false,
                error: error.message || "Something went wrong!",
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message || "Internal error!",
        });
    }
   
})

//reset password
router.post("/reset/:resetToken",async(req,res)=>{
    try {
        const {resetToken}=req.params;
    const {password}=req.body;

    const forgotPasswordToken=crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

    const user=await User.findOne({
        forgotPasswordToken,
        forgotPasswordExpiry:{$gt:Date.now()}
    });
    if (!user) {
        return res.status(400).json('Token is Invalid or expired, please try again')
    }
    user.password=password;
    user.forgotPasswordToken=undefined;
    user.forgotPasswordExpiry=undefined;
    user.save();

    return res.status(201).json({
        success:true,
        message:"Password changed successfully"
    })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"password reset failed!"
        })
    }
    
})

//changepassword
router.post('/changePassword',isLoggedIn,async(req,res)=>{
    try {
        const {oldPassword,newPassword}=req.body;
        const {id}=req.user;
        if (!oldPassword || !newPassword) {
            return res.status(400).json("All field are mandatory")
        }
        const user=await User.findById(id).select('+password');
        if (!user) {
            return res.status(400).json("user doesn't exist!")
        };
        const isPasswordValid=await user.comparePassword(oldPassword);
        if (!isPasswordValid) {
            return res.status(400).json('Invalide old password!')
        }

        user.password=newPassword;
        await user.save();
        user.password=undefined;
        return res.status(201).json({
            success:true,
            message:"password change successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"failed change password"
        })
    }
})

//update profile
router.put("/update",isLoggedIn,upload.single("avatar"),async(req,res)=>{
    try {
        const {username}=req.body;
    const { id } =req.user.id;
    const user = await User.findById(id);
    if (!user) {
        return res.status(400).json("User does not exist")
    };
    if (req.username) {
        user.username = username;
    };
    if (req.file) {
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);

        try {
            const result=await cloudinary.v2.uploader.upload(req.file.path,{
                folder:'lms',
                width:250,
                height:250,
                gravity:"faces",
                crop:"fill"
            });
            
            if (result) {
                Newuser.avatar.public_id=result.public_id;
                Newuser.avatar.secure_url=result.secure_url;
    
                //remove file from server
               fs.rm(`uploads/${req.file.filename}`)
            }
        } catch (error) {
            console.log('errors:',error)
            return res.status(500).json("File not upload, please try again!")
        }
    }
    await user.save();
    return res.status(201).json({
        success:true,
        message:"User details updated successfully"
    })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"failed update user"
        })
    }
    
})
export default router;