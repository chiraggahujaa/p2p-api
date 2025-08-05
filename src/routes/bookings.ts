// Booking routes with authentication and validation

import express from 'express';
import { BookingController } from '../controllers/BookingController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const bookingController = new BookingController();

// All booking routes require authentication
router.use(authenticateToken);

// Booking CRUD operations
router.post('/', bookingController.createBooking.bind(bookingController));
router.get('/my', bookingController.getUserBookings.bind(bookingController));
router.get('/my/stats', bookingController.getUserBookingStats.bind(bookingController));
router.get('/:id', bookingController.getBooking.bind(bookingController));

// Booking status management
router.put('/:id/status', bookingController.updateBookingStatus.bind(bookingController));
router.put('/:id/confirm', bookingController.confirmBooking.bind(bookingController));
router.put('/:id/start', bookingController.startBooking.bind(bookingController));
router.put('/:id/complete', bookingController.completeBooking.bind(bookingController));
router.put('/:id/cancel', bookingController.cancelBooking.bind(bookingController));

// Rating and feedback
router.post('/:id/rating', bookingController.addRatingAndFeedback.bind(bookingController));

// Admin/management routes
router.get('/', bookingController.getAllBookings.bind(bookingController));

export default router;