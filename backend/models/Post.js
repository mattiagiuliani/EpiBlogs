import{model, Schema} from 'mongoose';
import Author from './Author.js';


const PostSchema = new Schema ({
    _id:  {
            type: Schema.Types.ObjectId,
            auto: true
        },
    category: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    cover: {
        type: String,
        required: true
    },
    readTime: {
        value: {
            type: Number,
            required: true
        },
        unit: {
            type: String,
            required: true
        }
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: Author,
        required: true
    },
    content: {
        type: String,
        required: true
    }
});

const Post = model('Post', PostSchema);

export default Post; 