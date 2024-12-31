//why am i requiring everything
const express = require('express');
const OpenAI = require('openai'); //i hate the 4v version
const cors = require('cors');
const admin = require("firebase-admin");
const serviceAccount = require("./firebaseKey.json");
require('dotenv').config();



const app = express();
const PORT = 5000;




//firebase type 
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const dataBase = admin.firestore();

//you know who s up 3am on december 31st 2024? me. why? cause of this. 
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY 
});





app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Backend is running');
});

const corsSETTINGS = {
  origin: 'https://book-recommender.pages.dev/',
  methods: ['GET', 'POST'], 
  credentials: true, 
};
app.use(cors(corsSETTINGS)); // OPEN UP ALL THE ROUTES!! SAIL THE SEVEN SEAS
//testing 
function handleTestRequest(request, res) {
  res.send("whats up gang");
}
app.get('/hello', handleTestRequest);

//openai api
app.post('/generateBook', async (req, res) => {
    console.log("Request received. Bitch. ");
  try {
    const message = req.body.message;
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{"role": "user", "content": `${process.env.APP_PROMPT} ${message}`}],
      });
      console.log(completion.choices[0].message);
    res.json({ response: completion.choices[0].message});

  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    res.status(500).json({ error: error });
  }
});

//add data firestore

app.post('/addData', async(req, res) =>{
    console.log("Adding data brrrr");
    try{
        const {
            email,
            prompt,
            genre,
            bookLength,
            complexity,
            sliderValue,
            summary,
            title,
            author,
            link,
            bookCoverSource,
            pages,
            bookGenre,
            date,
        } = req.body;
        
        const docRef = await dataBase.collection(email).add({
            prompt,
            genre,
            bookLength,
            complexity,
            sliderValue,
            summary,
            title,
            author,
            link,
            bookCoverSource,
            pages,
            bookGenre,
            date: admin.firestore.FieldValue.serverTimestamp(), //real specific now huh
          });
          res.status(200).json({ message: 'Book added successfully', id: docRef.id });
    }catch(error){
        console.error('Error adding document: ', error);
        res.status(500).json({ error: 'SOMETHING GOT MESSED UP AND I DONT KNOW WHAT TO DO' });
    }
});



app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
