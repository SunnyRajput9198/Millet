import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import { env } from './config';

const PORT = env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});