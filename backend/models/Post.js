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
        trim: true,
        default: 'Web Development'
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
    },
    // Slug-based category identifier — derived automatically from Category collection
    // on create/update. Optional so existing posts without it remain valid.
    categorySlug: {
        type: String,
        trim: true
    },
    // Multi-tag system. Optional; existing posts default to [].
    // Tags are stored as normalized slugs (lowercase, hyphenated).
    tags: {
        type: [String],
        default: []
    }
},
{
    timestamps: true
});

PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ category: 1, createdAt: -1 });
PostSchema.index({ categorySlug: 1, createdAt: -1 });
PostSchema.index({ tags: 1 });
PostSchema.index({ createdAt: -1 });
// Full-text search index — used by POST /api/v1/posts/search.
// MongoDB allows exactly one text index per collection; all text-searchable
// fields must be declared here together.
PostSchema.index({ title: 'text', content: 'text' });

const Post = model('Post', PostSchema);

export default Post; 
