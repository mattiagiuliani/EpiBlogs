import { Router } from 'express';
import { listCategories } from './categories/handlers.js';

const categoryRouter = Router();

categoryRouter.get('/', listCategories);

export default categoryRouter;
