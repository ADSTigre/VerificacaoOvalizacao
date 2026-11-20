import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCJ1bTGAvv4F3yrXBk4dRMGnrn94M4ohnc",
  authDomain: "verificacaodeovalizacao.firebaseapp.com",
  projectId: "verificacaodeovalizacao",
  storageBucket: "verificacaodeovalizacao.firebasestorage.app",
  messagingSenderId: "19031722736",
  appId: "1:19031722736:web:eb3be24d2306c1d9421035"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);