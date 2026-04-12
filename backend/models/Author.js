import { model, Schema } from 'mongoose';

const emailRegex = /^[\w+.]+@\w+\.\w+$/;

const authorSchema = new Schema({
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
            emailRegex,
              
           'Not valid email' 
        ]
    },
    password: {
        type: String,
        required() {
            return !this.googleId;
        },
        minlength: 6,
        select: false
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        select: false
    },
    tokenGoogle: {
        type: String,
        select: false
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    birthDate:  {
        type: Date,
        min: '1930-01-01', 
        max: Date.now
    },
    avatar: {
        type: String,
        trim: true
    },
    profile: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    toJSON: {
        transform: (_document, returnedObject) => {
            delete returnedObject.password;
            delete returnedObject.googleId;
            delete returnedObject.tokenGoogle;
            return returnedObject;
        }
    },
    toObject: {
        transform: (_document, returnedObject) => {
            delete returnedObject.password;
            delete returnedObject.googleId;
            delete returnedObject.tokenGoogle;
            return returnedObject;
        }
    }
});

const Author = model('Author', authorSchema); 

export default Author; 
