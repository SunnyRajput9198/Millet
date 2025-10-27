import { Router } from 'express';
import authRouter from './auth/route';
import productRouter from './products/route';
import categoryRouter from './category/route';
import cartRouter from './cart/route';
import addressRouter from './address/route';
import orderRouter from './order/route';
import wishlistRouter from './wishlist/route';
import reviewsRouter from './reviews/route';
import couponRouter from './coupon/route';
import notificationRouter from './notification/route';
import shipmentRouter from './shipment/route';
import recentlyViewedRoute from './recently-viewed/route'

const router = Router();

router.use('/auth', authRouter);
router.use("/addresses", addressRouter);
router.use('/products', productRouter);
router.use('/categories', categoryRouter);
router.use('/cart', cartRouter);
router.use('/orders', orderRouter);
router.use('/wishlist', wishlistRouter);
router.use('/', reviewsRouter); 
router.use('/recently-viewed', recentlyViewedRoute);
router.use('/shipments', shipmentRouter);
router.use('/notifications', notificationRouter);
router.use('/coupons', couponRouter);
router.use('/addresses', addressRouter);

export default router;