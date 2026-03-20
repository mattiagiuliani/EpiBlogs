import{model, Schema} from 'mongoose';

const authorSchema = new Schema ({
    _id: {
        type: Schema.Types.ObjectId,
        auto: true
    },
    email: {
         type: String,
        required: true, 
        unique: true, 
        lowercase: true,
        trim: true, 
        match: [
            /[\w+.]*@\w+\.\w+/,   
              
           'Not valid email' 
        ]
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    tokenGoogle: {
        type: String
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: String,
    birthDate:  {
        type: Date,
        min: '1930-01-01', 
        max: Date.now
    },
    avatar: String
});

const Author = model('Author', authorSchema); 

export default Author; 