import express, { Request, Response } from 'express';
import { CityController } from '../controllers/CityController.js';

const router = express.Router();

// GET /api/cities
router.get('/', async (req: Request, res: Response) => {
  await CityController.listCities(req, res);
});

export default router;


