import { Router } from 'express';
import authRouter from './authroutes';
import productRouter from './product.routes';
import categoryRouter from './cartroutes';
import cartRouter from './cartroutes';
import addressRouter from './addressroutes';

const router = Router();

router.use('/auth', authRouter);
router.use('/products', productRouter);
router.use('/categories', categoryRouter);
router.use('/cart', cartRouter);
router.use('/addresses', addressRouter);

export default router;