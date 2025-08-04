import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (in production, you'd use a database)
let tokens = [];
let currentNumber = 1;

// API Routes
app.get('/api/queue', (req, res) => {
  res.json({
    currentNumber,
    tokens
  });
});

app.post('/api/book-token', (req, res) => {
  const { name, phone, age, department } = req.body;
  
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }

  const newTokenNumber = tokens.length > 0 ? tokens[tokens.length - 1].tokenNumber + 1 : 1;
  const newToken = {
    tokenNumber: newTokenNumber,
    name,
    phone,
    age,
    department,
    bookedAt: new Date().toISOString()
  };

  tokens.push(newToken);
  res.json(newToken);
});

app.post('/api/next-number', (req, res) => {
  const waitingTokens = tokens.filter(token => token.tokenNumber >= currentNumber);
  if (waitingTokens.length > 0) {
    currentNumber += 1;
  }
  res.json({ currentNumber });
});

app.post('/api/reset-queue', (req, res) => {
  currentNumber = 1;
  tokens = [];
  res.json({ message: 'Queue reset successfully' });
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 