const express = require('express');
const router = express.Router();

const admin = require("firebase-admin");
const serviceAccount = require("./firebaseKey.json");
require('dotenv').config();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const dataBase = admin.firestore();



//add data firestore
router.post('/addData', async(req, res) =>{
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
        res.status(500).json({ error: 'SOMETHING GOT MESSED UP' });
    }
});

router.post('/deleteData', async(req, res) =>{
    console.log("Deleting data...");
    try{
        const{
            email,
            docID,
        } = req.body;
        await dataBase.collection(email).doc(docID).delete();
        res.status(200).json({ message: 'Book deleted successfully'});
    }catch(error){
        console.error('Error deleting document: ', error);
        res.status(500).json({ error: 'COULDNT DELETE DATA'});
    }
});





module.exports = router;