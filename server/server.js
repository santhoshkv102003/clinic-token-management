import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Clinic Token System Backend is running' });
});

// Sample API endpoints for clinic token system
app.get('/api/tokens', (req, res) => {
  // Mock data - replace with database queries
  res.json({
    currentNumber: 5,
    tokens: [
      { id: 1, number: 1, patientName: 'John Doe', status: 'completed' },
      { id: 2, number: 2, patientName: 'Jane Smith', status: 'completed' },
      { id: 3, number: 3, patientName: 'Bob Johnson', status: 'waiting' },
      { id: 4, number: 4, patientName: 'Alice Brown', status: 'waiting' },
      { id: 5, number: 5, patientName: 'Charlie Wilson', status: 'current' }
    ]
  });
});

app.post('/api/tokens', (req, res) => {
  const { patientName } = req.body;
  // Mock token creation - replace with database operations
  const newToken = {
    id: Date.now(),
    number: Math.floor(Math.random() * 100) + 1,
    patientName,
    status: 'waiting'
  };
  res.status(201).json(newToken);
});

app.put('/api/tokens/:id/next', (req, res) => {
  const { id } = req.params;
  // Mock next patient logic - replace with database operations
  res.json({ message: `Called next patient with token ${id}` });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
}); 