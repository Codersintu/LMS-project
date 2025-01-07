import  mongoose  from  'mongoose';

const paymentSchema=new mongoose.Schema({
     payment_id:{
        type:String,
        required:true
     },
     subscription_id:{
        type:String,
        required:true
     },
     signature:{
        type:String,
        required:true
     }
},{
    timestamps:true
}
);

const Payment=mongoose.model("Payment",paymentSchema);
export default Payment;