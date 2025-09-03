// User routes with authentication and validation

import express from 'express';
import { UserController } from '../controllers/UserController.js';
import { UserLocationController } from '../controllers/UserLocationController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();
const userController = new UserController();
const userLocationController = new UserLocationController();

// Public routes
router.get('/search', userController.searchUsers.bind(userController));
router.get('/all', userController.getAllUsers.bind(userController));
router.get('/:id', userController.getUserById.bind(userController));
router.get('/:id/items', userController.getItemsByUserId.bind(userController));

// Protected routes (current user)
router.get('/me/profile', authenticateToken, userController.getProfile.bind(userController));
router.put('/me/profile', authenticateToken, userController.updateProfile.bind(userController));
router.get('/me/items', authenticateToken, userController.getUserItems.bind(userController));
router.get('/me/bookings', authenticateToken, userController.getUserBookings.bind(userController));
router.get('/me/favorites', authenticateToken, userController.getUserFavorites.bind(userController));
router.get('/me/stats', authenticateToken, userController.getUserStats.bind(userController));
router.delete('/me/account', authenticateToken, userController.deactivateAccount.bind(userController));

// User Location routes (Protected)
router.get('/me/locations', authenticateToken, userLocationController.getUserLocations.bind(userLocationController));
router.get('/me/locations/default', authenticateToken, userLocationController.getDefaultLocation.bind(userLocationController));
router.post('/me/locations', authenticateToken, userLocationController.addLocationToUser.bind(userLocationController));
router.post('/me/locations/create-and-add', authenticateToken, userLocationController.createAndAddLocation.bind(userLocationController));
router.put('/me/locations/:userLocationId', authenticateToken, userLocationController.updateUserLocation.bind(userLocationController));
router.delete('/me/locations/:userLocationId', authenticateToken, userLocationController.removeUserLocation.bind(userLocationController));

// Admin routes (placeholder - add admin auth middleware)
router.put('/:id/verify', authenticateToken, userController.verifyUser.bind(userController));

export default router;