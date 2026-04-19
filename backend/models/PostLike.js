import { model, Schema } from 'mongoose';

const PostLikeSchema = new Schema(
    {
        post: {
            type: Schema.Types.ObjectId,
            ref: 'Post',
            required: true
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: 'Author',
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Each author can like a given post at most once.
PostLikeSchema.index({ post: 1, author: 1 }, { unique: true });

// Fast count queries per post.
PostLikeSchema.index({ post: 1 });

const PostLike = model('PostLike', PostLikeSchema);

export default PostLike;
