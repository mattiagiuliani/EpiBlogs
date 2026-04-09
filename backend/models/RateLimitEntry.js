import { model, Schema } from 'mongoose';

const rateLimitEntrySchema = new Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    count: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    expiresAt: {
        type: Date,
        required: true,
        index: {
            expireAfterSeconds: 0
        }
    }
}, {
    timestamps: true
});

const RateLimitEntry = model('RateLimitEntry', rateLimitEntrySchema);

export default RateLimitEntry;
