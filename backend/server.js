const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Task = require("./models/Task");
const { auth, JWT_SECRET } = require("./middleware/auth");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 🔥 GPT Parsing Function
async function parseTaskUsingGPT(input) {
  const prompt = `From this task: "${input}", extract JSON like if input is "Finish landing page Aman by 11pm 20th June" 
  then output :
{
  "task": "Finish landing page",
  "assignee": "Aman",
  "due": "2024-06-20T23:00:00",
  "priority": "P3"
} please take care convert date into "yyyy-mm-ddThh:mm:ss" Default priority P3 unless specified as P1, P2, or P4`;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Extract task info from input" },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "http://localhost:3000",
          "Content-Type": "application/json",
        },
      }
    );

    const jsonString = response.data.choices[0].message.content;
    const parsed = JSON.parse(jsonString);
    console.log("this is parsed", parsed);
    return {
      name: parsed.task,
      assignee: parsed.assignee,
      dueDate: new Date(parsed.due),
      priority: parsed.priority,  
    };
  } catch (error) {
    console.error(
      "OpenRouter Parsing Error:",
      error.response?.data || error.message
    );
    return null;
  }
}

// Authentication Routes
app.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const user = new User({ email, password, name });
    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET);

    // Create a user object without password
    const userResponse = {
      _id: user._id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };
    res.status(201).json({ user: userResponse, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      throw new Error("Invalid login credentials");
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    // Create a user object without password
    const userResponse = {
      _id: user._id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };
    res.json({ user: userResponse, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Protected Task Routes
app.post("/tasks", auth, async (req, res) => {
  const { input } = req.body;
  console.log("tasks", input);
  if(!input){

  }
  const parsedTask = await parseTaskUsingGPT(input);

  if (!parsedTask) {
    return res.status(500).json({ error: "Failed to parse task." });
  }

  const task = new Task({
    ...parsedTask,
    user: req.userId,
  });

  await task.save();
  res.json(task);
});

app.get("/tasks", auth, async (req, res) => {
  const tasks = await Task.find({ user: req.userId });
  res.json(tasks);
});

// 🚀 Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
