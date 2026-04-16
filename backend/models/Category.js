import { model, Schema } from 'mongoose';

const CategorySchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        description: {
            type: String,
            trim: true
        },
        color: {
            type: String,
            trim: true
        }
    },
    { timestamps: true }
);

// Auto-generate slug from name when a new category is saved without one.
// The seed script always provides explicit slugs, so this is purely a safety net
// for categories created manually through the DB or a future admin endpoint.
CategorySchema.pre('validate', function (next) {
    if (!this.slug && this.name) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-{2,}/g, '-')
            .replace(/^-|-$/g, '');
    }
    next();
});

const Category = model('Category', CategorySchema);

export default Category;
