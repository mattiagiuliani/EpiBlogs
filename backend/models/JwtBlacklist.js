import { model, Schema } from 'mongoose';

const jwtBlacklistSchema = new Schema({
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    expiresAt: {
        type: Date,
        required: true,
        expires: 0
    }
}, {
    timestamps: true
});

const JwtBlacklist = model('JwtBlacklist', jwtBlacklistSchema);

export default JwtBlacklist;