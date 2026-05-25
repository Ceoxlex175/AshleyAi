import express from "express";
import OpenAI from "openai";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "change-this-to-something-random";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In-memory user store. Replace with Postgres/MongoDB for production
let users = [];

// Middleware to check JWT
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// Health check
app.get("/", (req, res) => {
  res.send("AshleyAi backend is running");
});

// Register
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username ||!password) return res.status(400).json({ error: "Username and password required" });
  if (users.find(u => u.username === username)) return res.status(400).json({ error: "User already exists" });

  const hash = await bcrypt.hash(password, 10);
  users.push({ username, password: hash, createdAt: new Date() });
  res.json({ message: "Registered successfully" });
});

// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
});

// Chat endpoint
app.post("/chat", auth, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages) return res.status(400).json({ error: "Messages required" });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.3,
      max_tokens: 500
    });

    res.json(response);
  } catch (err) {
    console.error("OpenAI error:", err.message);
    res.status(500).json({ error: "OpenAI request failed" });
  }
});

// Image generation endpoint
app.post("/generate-image", auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt required" });

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024"
    });

    res.json({ image: response.data[0].url });
  } catch (err) {
    console.error("Image error:", err.message);
    res.status(500).json({ error: "Image generation failed" });
  }
});

app.listen(PORT, () => console.log(`AshleyAi backend running on http://localhost:${PORT}`));
