//why am i requiring everything
const express = require('express');
const OpenAI = require('openai'); //i hate the 4v version
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch'); // Make sure this is installed: npm install node-fetch
const firebaseBackend = require('./firebaseBackend.js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// CORS Settings
const corsSETTINGS = {
  origin: "*",
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'], // Allowed methods
  allowedHeaders: '*',
  exposedHeaders: ['Content-Length', 'X-JSON'], 
};

// Middleware
app.use(express.json());
app.use(authenticateToken);
app.use(cors(corsSETTINGS));

// Routes
app.get('/', (req, res) => {
  res.send('Backend is running');
});

// Testing
function handleTestRequest(req, res) {
  res.send('whats up gang');
}
app.get('/hello', handleTestRequest);

// Token Generator
app.post('/generateJWT', (req, res) => {
  try {
    const { UID } = req.body;
    const token = jwt.sign({ UID }, process.env.JWT_KEY, { expiresIn: '1h' });
    return res.status(200).json({ token }); // Use return to stop function
  } catch (error) {
    console.log('Cannot generate token: ', error);
    return res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Token Authenticator Middleware
function authenticateToken(req, res, next) {
  // Bypass authentication for /generateJWT
  if (req.path === '/generateJWT') {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_KEY, (err) => {
      if (err) {
        // If token is invalid, respond once and return
        return res.status(403).json({ error: 'Invalid token' });
      }
      next();
    });
  } catch (error) {
    console.log('Error authenticating token: ', error);
    return res.status(500).json({ error: 'Could not authenticate token' });
  }
}

// Check Token Endpoint
app.post('/checkToken', authenticateToken, (req, res) => {
  return res.status(200).json({ message: 'Token is valid' });
});

// OpenAI API
app.post('/generateBook', async (req, res) => {
  try {
    const { message } = req.body;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `${process.env.APP_PROMPT} ${message}`,
        },
      ],
    });

    console.log(completion.choices[0].message);
    return res.json({ response: completion.choices[0].message });
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return res.status(500).json({ error: error });
  }
});

// Fetch Book
app.post('/grabBook', async (req, res) => {
  try {
    const { bookName } = req.body;
    console.log('Fetching book... ', bookName);

    const results = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${bookName}:keyes&key=${process.env.GOOGLE_API_KEY}`
    );
    const yata = await results.json();
    return res.status(200).json(yata);
  } catch (error) {
    console.log('Error!', error);
    return res.status(500).json({ error: 'Failed to fetch book data' });
  }
});

// Firebase Routes
app.use('/firebase', firebaseBackend);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
