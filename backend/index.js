import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import OpenAI from "openai";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { nanoid } from "nanoid";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = new Low(new JSONFile("db.json"), { chats: [] });
await db.read();
db.data ||= { chats: [] };

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });


// ⭐ Get ALL chat threads
app.get("/chats", async (req, res) => {
  res.json(db.data.chats);
});


// ⭐ Create a new chat thread
app.post("/new-chat", async (req, res) => {
  const newChat = { id: nanoid(), messages: [] };
  db.data.chats.push(newChat);
  await db.write();
  res.json(newChat);
});


// ⭐ Get messages of a specific chat
app.get("/chat/:id", async (req, res) => {
  const chat = db.data.chats.find(c => c.id === req.params.id);
  res.json(chat ? chat.messages : []);
});


// ⭐ Send a message inside a chat thread
app.post("/chat/:id", async (req, res) => {
  const { message } = req.body;
  const chat = db.data.chats.find(c => c.id === req.params.id);

  if (!chat) return res.status(404).json({ error: "Chat not found" });

  const userMessage = { role: "user", content: message };
  chat.messages.push(userMessage);

  const aiRes = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: chat.messages,
  });

  const aiMessage = aiRes.choices[0].message;
  chat.messages.push(aiMessage);

  await db.write();
  res.json(aiMessage);
});
// DELETE a chat thread completely
app.delete("/chat/:id", async (req, res) => {
  const { id } = req.params;

  // Remove chat from db
  db.data.chats = db.data.chats.filter((c) => c.id !== id);
  await db.write();

  res.json({ success: true, message: "Chat deleted" });
});


app.listen(8000, () => console.log("Server running on port 8000"));

