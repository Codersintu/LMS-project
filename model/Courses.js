import  mongoose  from  'mongoose';
const courseschema = new mongoose.Schema ({
    title: {
        type: String,
        required: [true, 'title is required'],
        minlength: [8, 'title must be at least 5 characters'],
           maxlength:[50,'title should be less than 50 characters'],
        trim: true, // Removes unnecessary spaces
    },
    description: {
        type: String,
        required: [true, 'description is required'],
        minlength: [8, 'description must be at least 5 characters'],
        maxlength:[200,'description should be less than 200 characters'],
    
    },
    category: {
        type: String,
        required: [true, 'category is required'],
    },
    thumbnail: {
        public_id: {
            type: String,
            required: true
        },
        secure_url: {
            type: String,
            required: true
        }
    },
    lectures: [
        {
            title: String,
            description: String,
            lecture: {
                public_id: {
                    type: String,
                    required: true
                },
                secure_url: {
                    type: String,
                    required: true
                }
            }
        }
    ],
    numbersoflectures: {
        type: Number,
        default:0,
    },
    createdBy: {
        type: String,
        required: true

    }
},{
    timestamps: true
})

const Course = mongoose.model('course', courseschema);
export default Course;