import express from "express";
import OpenAI from "openai";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors()); // allows your HTML to call this backend

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // fast + cheap
      messages: messages,
      temperature: 0.3,
      max_tokens: 400
    });
    
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("AshleyAi backend is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AshleyAi backend running on http://localhost:${PORT}`));
