import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import inventoryRoutes from './routes/inventory-route.js';
import authRoutes from './routes/auth.route.js';
import calculateRoutes from './routes/calculate.route.js';
dotenv.config();

const app = express();
app.use(cors({
  origin: 'http://localhost:5501',  // must match the frontend origin exactly
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

app.use(cookieParser());
app.use('/api/inventory', inventoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/calculate', calculateRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

//Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass