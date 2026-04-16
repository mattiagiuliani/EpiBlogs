import Category from '../../models/Category.js';
import logger from '../../utils/logger.js';

export const listCategories = async (_request, response) => {
    try {
        const categories = await Category.find().sort({ name: 1 }).lean();
        response.send(categories);
    } catch (error) {
        logger.error({ err: error });
        response.status(500).send({ message: error.message });
    }
};
