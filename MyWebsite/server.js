const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Initialize Firebase Admin
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "yourproject.appspot.com"
});

const db = admin.firestore();
const usersCollection = db.collection("users");
const seriesCollection = db.collection("series");
const historyCollection = db.collection("history");

// --------------------
// USER SIGNUP
// --------------------
app.post("/api/signup", async (req, res) => {
  try {
    const { email, password, username, isPremium } = req.body;

    const existingUser = await usersCollection.where("email", "==", email).get();
    if (!existingUser.empty) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const userRef = await usersCollection.add({
      email,
      password: hashedPassword,
      username,
      isAdmin: false,
      isPremium: !!isPremium // boolean for subscription
    });

    res.json({ message: "User created", id: userRef.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// --------------------
// USER LOGIN
// --------------------
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const snapshot = await usersCollection.where("email", "==", email).get();

    if (snapshot.empty) return res.status(400).json({ message: "User not found" });

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    const token = jwt.sign({ id: userDoc.id, isAdmin: userData.isAdmin, isPremium: userData.isPremium }, "SECRET_KEY", { expiresIn: "1d" });

    res.json({ message: "Login successful", token, username: userData.username, isAdmin: userData.isAdmin, isPremium: userData.isPremium });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// --------------------
// GET ALL SERIES
// --------------------
app.get("/api/series", async (req, res) => {
  try {
    const snapshot = await seriesCollection.orderBy("createdAt", "desc").get();
    const series = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(series);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// --------------------
// ADD SERIES (ADMIN)
// --------------------
app.post("/api/series", async (req, res) => {
  try {
    const { token, title, description, image, videoUrl, episodes } = req.body;

    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, "SECRET_KEY");
    if (!decoded.isAdmin) return res.status(403).json({ message: "Only admin can add series" });

    const docRef = await seriesCollection.add({
      title,
      description,
      image,
      videoUrl,
      episodes: episodes || [], // array of episodes
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      premiumOnly: req.body.premiumOnly || false
    });

    res.json({ message: "Series added", id: docRef.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// --------------------
// RECORD WATCH HISTORY
// --------------------
app.post("/api/history", async (req, res) => {
  try {
    const { token, seriesId, episode } = req.body;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, "SECRET_KEY");

    await historyCollection.add({
      userId: decoded.id,
      seriesId,
      episode,
      watchedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: "History saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// --------------------
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});