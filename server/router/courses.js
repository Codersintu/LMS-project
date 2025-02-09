import {Router} from 'express';
import Course from '../model/Courses.js';
import  {authorizedRoles, authorizedSubscribe, isLoggedIn}  from '../middleware/auth.middleware.js';
const router=Router();
import cloudinary from 'cloudinary'
import fs from 'fs'
import upload from '../middleware/multer.middleware.js';


//create course
router.post("/create",isLoggedIn,authorizedRoles("ADMIN"),upload.single("thumbnail"),async(req,res)=>{
 try {
    console.log(req.body);
    console.log(req.file)
const { title, description, category, createdBy} = req.body;
 if (!title || !description || !category || !createdBy) {
   return res.status(400).json("all field are manadatory"); 
 };

    console.log("Preparing to upload file to Cloudinary");
    const result = await cloudinary.v2.uploader.upload(req.file.path,{
        folder: 'lms'
      });

      if (result) { 
        course.thumbnail.public_id = result.public_id;
        course.thumbnail.secure_url = result.secure_url;
        
      }
      fs.rm(`uploads/${req.file.filename}`);

    console.log("Deleting local file");
    fs.unlinkSync(req.file.path);

    console.log("Creating course document in MongoDB");
    const course = await Course.create({
      title,
      description,
      category,
      createdBy,
      thumbnail,
    });

    console.log("Course created successfully, sending response");
    await  course.save ();
      res.status(201).json({
        success: true,
        message: 'coursde is created successsfuly',
        course,
      })
    
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"course create failed!"
        })
    }
})

//updatecourse
router.put("/:id",isLoggedIn,authorizedRoles("ADMIN"),async(req,res)=>{
    try {
        const {id}=req.params;
        const course=await Course.findByIdAndUpdate(
            id,
            {  
               $set:req.body
             },
             {
                runValidators:true
             }
        );
        if (!course) {
            return res.status(201).json('course with given id does not found')
        }
        res.status(200).json({
            success:true,
            message:"course updated successfully",
            course
        }) 
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"course updated failed"
        })
    }
    
})

//removecourse
router.delete("/:id",isLoggedIn,authorizedRoles("ADMIN"),async(req,res)=>{
    try {
        const {id}=req.params;
    const course=await Course.findById(id);
    if (!course) {
        return res.status(201).json('course with given id does not found')
    }

    await Course.findByIdAndDelete(id);
    res.status(200).json({
        success:true,
        message:"course remove successfully",
        course
    }) 
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"course remove failed"
        })
    }
    
})

//craete leccture in course

router.post("/:id",isLoggedIn,authorizedRoles("ADMIN"),upload.single("lecture"),async(req,res)=>{
    try {
        const { title, description} = req.body;
    const {id}=req.params;
 if (!title || !description) {
   return res.status(400).json("all field are manadatory"); 
 }; 
    const course=await Course.findById(id);
    if (!course) {
        return res.status(201).json('course with given id does not found')
    }
    const lectureData={
        title,
        description,
        lecture:{}
    };
    if (req.file) {
        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path,{
                folder: 'lms'
              });
                 console.log(JSON.stringify(result))
              if (result) { 
                lectureData.lecture.public_id = result.public_id;
                lectureData.lecture.secure_url = result.secure_url;
                
              }
              fs.rm(`uploads/${req.file.filename}`);
        } catch (error) {
            return res.status(500).json({message:error.message})
        }
       
    };
    course.lectures.push(lectureData);
    course.numbersoflectures=course.lectures.length;
    await course.save();
    return res.status(200).json({
        success:true,
        message:"lecture successfully added to the course",
        course
       })

    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"failed to add lecture in course"
        })
    }
    
})

//delete lecture
// router.delete("/:id",isLoggedIn,authorizedRoles('ADMIN'),async(req,res)=>{
//     try {
//         const {id}=req.params;
//         const course=await Course.findById(id)
//         if (!course) {
//             return res.status(400).json("course not found")
//         };

//         await
//     } catch (error) {
        
//     }
// })
//getallcourses
router.get('/',async(req,res)=>{
    try {
        const course=await Course.find({}).select('-lectures');
  return res.status(200).json({
    success:true,
    message:"All courses",
    course
   })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"failed fetch all courses"
        });
    }
   
});

//getlectureBycourseId
router.get("/:id",isLoggedIn,authorizedSubscribe,async(req,res)=>{
    try {
        const {id}=req.params;
        const course=await Course.findById(id);

        if (!course) {
            return res.status(400).json('course is not found')
        }
        return res.status(201).json({
            success:true,
            message:"course lecture fetch successfully",
            lectures:course.lectures
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"course lecture fetch failed!"
        })
    }
})
export default router;