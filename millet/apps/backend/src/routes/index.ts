import { Router } from 'express';
import authRouter from './auth/route';
import productRouter from './products/route';
import categoryRouter from './category/route';
import cartRouter from './cartroutes';
import addressRouter from './address/route';

const router = Router();

router.use('/auth', authRouter);
router.use("/addresses", addressRouter);
router.use('/products', productRouter);
router.use('/categories', categoryRouter);
router.use('/cart', cartRouter);
router.use('/addresses', addressRouter);

export default router;