import { Router } from 'express';
import { protect } from '../middleware/authmiddleware.js';
import { validate } from '../middleware/validatemiddleware.js';
import { addressSchema } from '../dtos';
import {
  createAddress,
  getUserAddresses,
  updateAddress,
  deleteAddress,
} from '../controllers/address.controller.js';

const router = Router();

// All address routes are protected
router.use(protect);

router.route('/')
  .post(validate(addressSchema), createAddress)
  .get(getUserAddresses);

router.route('/:id')
  .put(validate(addressSchema), updateAddress)
  .delete(deleteAddress);

export default router;