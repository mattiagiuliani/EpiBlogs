import { model, Schema } from 'mongoose';

const emailRegex = /^[\w+.]+@\w+\.\w+$/;

const CommentSchema = new Schema(
    {
        _id: {
            type: Schema.Types.ObjectId,
            auto: true
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: 'Author',
            required: true
        },
        comment: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

const PostSchema = new Schema ({
    _id:  {
            type: Schema.Types.ObjectId,
            auto: true
        },
    category: {
        type: String,
        required: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    cover: {
        type: String,
        required: true,
        trim: true
    },
    readTime: {
        value: {
            type: Number,
            required: true,
            min: 1
        },
        unit: {
            type: String,
            required: true,
            trim: true,
            enum: ['min']
        }
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'Author',
        required: true
    },
    authorEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: [emailRegex, 'Not valid email']
    },
    content: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: (value) => typeof value === 'string' && value.trim().length > 0,
            message: 'Content is required'
        }
    },
    comments: {
        type: [CommentSchema],
        default: []
    }
},
{
    timestamps: true
});

PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ category: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1 });

const Post = model('Post', PostSchema);

export default Post; 
