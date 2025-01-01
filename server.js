//why am i requiring everything
const express = require('express');
const OpenAI = require('openai'); //i hate the 4v version
const cors = require('cors');
const jwt = require('jsonwebtoken');
const firebaseBackend = require('./firebaseBackend.js');



require('dotenv').config();



const app = express();
const PORT = 5000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const corsSETTINGS = {
  origin: process.env.DEVELOPMENT_MODE === 'true'
    ? 'http://localhost:3000' // development origin
    : 'https://book-recommender.pages.dev', // production origin
  methods: ['GET', 'POST'],
  credentials: true,
};




//my middlewares
app.use(express.json());
app.use(authenticateToken);
app.use(cors(corsSETTINGS)); // OPEN UP ALL THE ROUTES!! SAIL THE SEVEN SEAS

// Routes
app.get('/', (req, res) => {
  res.send('Backend is running');
});


//testing 
function handleTestRequest(request, res) {
  res.send("whats up gang");
}
app.get('/hello', handleTestRequest);



//token generator
app.post('/generateJWT', (req, res) => {
  try {
    const { UID } = req.body;
    const token = jwt.sign({ UID }, process.env.JWT_KEY, { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (error) {
    console.log("Cannot generate token: ", error);
  }
});



//token authenticator
function authenticateToken(req, res, next) {
  if (req.path === '/generateJWT') {
    return next();
  }
  function verifyToken(err){
    if(err){
      return res.sendStatus(403).json({error: 'Invalid token'});
    }
    next();
  }

  try {
    const authHeader = req.headers.authorization; 
    const token = authHeader && authHeader.split(' ')[1];

    if(token == null)
      return res.sendStatus(401).json({error: 'No token provided'});

    jwt.verify(token, process.env.JWT_KEY, verifyToken);

  } catch (error) {
    console.log("Error authenticating token: ", error);
    res.sendStatus(500).json({error: 'Couldnt authenticate Token'});
  }

}

app.post('/checkToken', authenticateToken, (req, res) => {
  res.status(200).json({message: 'Token is valid'});
});



//openai api
app.post('/generateBook', async (req, res) => {
  try {
    const message = req.body.message;
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ "role": "user", "content": `${process.env.APP_PROMPT} ${message}` }],
    });
    console.log(completion.choices[0].message);
    res.json({ response: completion.choices[0].message });

  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    res.status(500).json({ error: error });
  }
});



//fetch book
app.post('/grabBook', async (req, res) => {
  try {
    const { bookName } = req.body;
    console.log("Fetching book... ", bookName);
    const results = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${bookName}:keyes&key=${process.env.GOOGLE_API_KEY}`)
    const yata = await results.json();
    res.status(200).json(yata);

  } catch (error) {
    console.log('Error!', error)
  }
})



app.use('/firebase', firebaseBackend); //importing firebase backend


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
