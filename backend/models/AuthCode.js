import { model, Schema } from 'mongoose';

const authCodeSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    payload: {
        author: {
            type: Schema.Types.Mixed,
            required: true
        },
        token: {
            type: String,
            required: true
        }
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

const AuthCode = model('AuthCode', authCodeSchema);

export default AuthCode;
