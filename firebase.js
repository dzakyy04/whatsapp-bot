const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const { FIREBASE_CONFIG } = require('./config');

const firebaseApp = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(firebaseApp);

module.exports = { db };