// Address routes with rate limiting for external API calls

import express from 'express';
import { AddressController } from '../controllers/AddressController.js';
import { createRateLimit } from '../middleware/security.js';

const router = express.Router();
const addressController = new AddressController();

// Custom rate limit for address search - stricter due to external API limits
// 30 requests per 5 minutes (6 per minute average) to respect Nominatim's 1 req/sec limit
const addressSearchRateLimit = createRateLimit(
  5 * 60 * 1000, // 5 minutes
  30,
  'Address search rate limit exceeded. Please wait before making more requests.'
);

// Public routes (no authentication required, but rate limited)
router.get('/search', addressSearchRateLimit, addressController.searchAddresses.bind(addressController));
router.get('/suggestions', addressSearchRateLimit, addressController.getAddressSuggestions.bind(addressController));

export default router;