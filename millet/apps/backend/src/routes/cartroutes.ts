import { Router } from 'express';
import { protect } from '../middleware/authmiddleware.js';
import { validate } from '../middleware/validatemiddleware.js';
import { cartItemSchema, updateCartItemSchema } from '../dtos';
import {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
} from '../controllers/cart.controller.js';

const router = Router();

router.use(protect);

router.route('/')
  .get(getCart)
  .post(validate(cartItemSchema), addItemToCart);

router.route('/items/:itemId')
  .put(validate(updateCartItemSchema), updateCartItem)
  .delete(removeCartItem);

export default router;