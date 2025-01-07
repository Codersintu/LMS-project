import jwt from 'jsonwebtoken'
const isLoggedIn=async(req,res,next)=>{
    const {token}=req.cookies;
    if (!token) {
        return res.status(401).json("Unauthenticated,please login again")
    }
    const userDetails=await jwt.verify(token,process.env.JWT_SECRET) ;
    req.user=userDetails;
    next();
}

const authorizedRoles = (...roles) => async (req, res, next) =>{
    const currentUserRole = req.user.role;
    if (!roles.includes(currentUserRole)) {
        return res.status(400).json("you do not have access this page")
        
    }
    next();

}

const authorizedSubscribe=async(req,res,next)=>{
    const subscription=req.user.subscription;
    const currentUserRole=req.user.role;

    if (currentUserRole !== "ADMIN" && subscription.status !== "active") {
        return res.status(403).json("please subscribe to access this route!")
    }
    next()
}

export { isLoggedIn,authorizedRoles,authorizedSubscribe};