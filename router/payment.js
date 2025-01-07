import {json, Router} from 'express';
const router=Router();
import {authorizedRoles, isLoggedIn} from '../middleware/auth.middleware.js'
import Course from '../model/Payment.js'
import User from '../model/User.js'
import { razorpay } from '../index.js';
import Payment from '../model/Payment.js';

//getrazorkey
router.get('/razorpay-key',isLoggedIn,async (req,res) => {
    res.status(200).json({
        success:true,
        message:"Razarpay API key",
        key:process.env.RAZORPAY_KEY_ID
    });
})

//create get subscription

router.post("/subscribe",isLoggedIn,async(req,res)=>{
    try {
        const {id}=req.user;
        const user=await User.findById(id);
     
        if (!user) {
         return res.status(401).json("User not found");
        }
        if (user.role === "ADMIN") {
         return res.status(400).json("Admin cannot purchase a subscription")
        }
     
        const subscription=await razorpay.subscriptions.create({
         plan_id:process.env.RAZORPAY_PLAN_ID,
         customer_notify:1
        });
        user.subscription.id=subscription.id;
        user.subscription.status=subscription.status;
     
        await user.save();
        return res.status(201).json({
         success:true,
         message:"Subscribed Successfully",
         subscription_id:subscription.id
        })
    } catch (error) {
        return res.status(500).json({
            success:true,
            message:"subscribed failed"
        })
    }
  
})

//verifysubscription

router.post("/verify",isLoggedIn,async(req,res)=>{
    try {
        const {id}=req.user;
        const { payment_id,subscription_id,signature}=req.body;
  
        const user=await User.findById(id);
       
          if (!user) {
           return res.status(401).json("User not found");
          }


          const subscriptionId=user.subscription.id;

          const generatedSignature=crypto
          .createHmac('sha256',process.env.RAZORPAY_SECRET)
          .update(`${payment_id}|${subscriptionId}`)
          .digest('hex');

          if (generatedSignature !== signature) {
            return res.status(500).json("payment not verified,please try again")
          }

          await Payment.create({
            payment_id,
            signature,
            subscription_id
          })

          user.subscription.status='active';
          await user.save();
          return res.status(201).json({
            success:true,
            message:"payment verified successfully",
           })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"payment verified failed",
           })
    }
    
});

//cancelsubscription
router.post("/unsubscribe",isLoggedIn,async(req,res)=>{
     try {
        const {id}=req.user;
  
        const user=await User.findById(id);
       
          if (!user) {
           return res.status(401).json("User not found");
          }

          if (user.role === "ADMIN") {
            return res.status(400).json("Admin cannot purchase a subscription")
           }

           const subscriptionId=user.subscription.id;
           const subscription=await razorpay.subscriptions.cancel(
            subscriptionId
           )
           user.subscription.status=subscription.status;
           await user.save();
           return res.status(201).json({
            success:true,
            message:"subscription cancel successfully",
           })
     } catch (error) {
        return res.status(500).json({
            success:false,
            message:"subscription cancel failed",
           })
     }
});

//getallpayment
router.get('/',isLoggedIn,authorizedRoles("ADMIN"),async(req,res)=>{
      try {
        const {count}=req.query;

        const subscription=await razorpay.subscriptions.all({
            count: count || 10,
        });
        return res.status(200).json({
            success:true,
            message:'ALL PAYMENT',
            subscription
        })
      } catch (error) {
        return res.status(500).json({
            success:false,
            message:"failed fetch all subscription"
        })
      }
})
export default router;