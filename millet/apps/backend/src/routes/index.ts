import { Router } from 'express';
import authRouter from './auth/route';
import productRouter from './products/route';
import categoryRouter from './category/route';
import cartRouter from './cart/route';
import addressRouter from './address/route';
import orderRouter from './order/route';
import wishlistRouter from './wishlist/route';
import reviewsRouter from './reviews/route';
import { app } from '../app';

const router = Router();

router.use('/auth', authRouter);
router.use("/addresses", addressRouter);
router.use('/products', productRouter);
router.use('/categories', categoryRouter);
router.use('/cart', cartRouter);
router.use('/orders', orderRouter);
router.use('/wishlist', wishlistRouter);
router.use('/reviews', reviewsRouter); 
router.use('/addresses', addressRouter);

export default router;