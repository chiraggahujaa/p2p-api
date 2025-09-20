// Item routes with authentication and validation

import express from 'express';
import { ItemController } from '../controllers/ItemController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();
const itemController = new ItemController();

// Public routes (no authentication required)
router.get('/search', itemController.searchItems.bind(itemController));
router.get('/popular', itemController.getPopularItems.bind(itemController));
router.get('/featured', itemController.getFeaturedItems.bind(itemController));
router.get('/:id', optionalAuth, itemController.getItem.bind(itemController));
router.get('/:id/similar', itemController.getSimilarItems.bind(itemController));
router.get('/:id/availability', itemController.checkAvailability.bind(itemController));

// Protected routes (authentication required)
router.post('/', authenticateToken, itemController.createItem.bind(itemController));
router.put('/:id', authenticateToken, itemController.updateItem.bind(itemController));
router.delete('/:id', authenticateToken, itemController.deleteItem.bind(itemController));

// Favorites routes
router.post('/:id/favorites', authenticateToken, itemController.addToFavorites.bind(itemController));
router.delete('/:id/favorites', authenticateToken, itemController.removeFromFavorites.bind(itemController));

// Analytics routes (for item owners)
router.get('/:id/analytics', authenticateToken, itemController.getItemAnalytics.bind(itemController));

// Admin/management routes
router.get('/', optionalAuth, itemController.getAllItems.bind(itemController));

export default router;