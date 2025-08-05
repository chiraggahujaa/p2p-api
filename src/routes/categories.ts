// Category routes

import express from 'express';
import { CategoryController } from '../controllers/CategoryController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const categoryController = new CategoryController();

// Public routes
router.get('/', categoryController.getAllCategories.bind(categoryController));
router.get('/search', categoryController.searchCategories.bind(categoryController));
router.get('/popular', categoryController.getPopularCategories.bind(categoryController));
router.get('/:id', categoryController.getCategory.bind(categoryController));
router.get('/:id/subcategories', categoryController.getSubcategories.bind(categoryController));
router.get('/:id/hierarchy', categoryController.getCategoryHierarchy.bind(categoryController));

// Admin routes (TODO: Add admin auth middleware)
router.post('/', authenticateToken, categoryController.createCategory.bind(categoryController));
router.put('/:id', authenticateToken, categoryController.updateCategory.bind(categoryController));

export default router;