import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { randomUUID } from 'node:crypto';
import { products } from './data.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(morgan('dev'));

function sendHealth(_req, res) {
  res.json({ status: 'ok', service: 'virtual-store-backend' });
}

function sendArticles(_req, res) {
  res.json(products);
}

function sendSecurityTraining(_req, res) {
  res.json({
    simulated: true,
    status: 'warning',
    finding: 'Validacion de entrada insuficiente (simulada)',
    severity: 'medium',
    recommendation: 'Implementar validacion estricta del lado del servidor'
  });
}

function sendArticleById(req, res) {
  const product = products.find((item) => item.id === Number(req.params.id));
  if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
  return res.json(product);
}

function createPurchase(req, res) {
  const { customerName, items } = req.body;

  if (!customerName || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Datos de orden incompletos' });
  }

  const total = items.reduce((sum, item) => {
    const product = products.find((current) => current.id === Number(item.productId));
    return product ? sum + product.price * Number(item.quantity || 1) : sum;
  }, 0);

  return res.status(201).json({ id: randomUUID(), customerName, items, total, status: 'created' });
}

// Rutas cortas en espanol para la practica
app.get('/api/salud', sendHealth);
app.get('/api/arts', sendArticles);
app.get('/api/seg', sendSecurityTraining);
app.get('/api/arts/:id', sendArticleById);
app.post('/api/compra', createPurchase);

// Alias temporales para compatibilidad
app.get('/api/health', sendHealth);
app.get('/api/products', sendArticles);
app.get('/api/security-training', sendSecurityTraining);
app.get('/api/products/:id', sendArticleById);
app.post('/api/orders', createPurchase);
