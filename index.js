const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY || "f5e3f5b55eb9feebc7e3586934d627eafee87f1bb64a02f717ddbf0a0b6c746d"; // Replace with your actual secret key
const uri = process.env.MONGO_URI || "mongodb+srv://event_planner:OlqVoJVpRp3BvzW8@cluster0.adorufe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Replace with your MongoDB URI

const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

// Middleware
app.use(cors({
  
  origin: "https://eventplanner-two.vercel.app", // Vercel frontend
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    req.user = decoded;
    next();
  });
};

// MongoDB connection and routes
async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const UserCollection = client.db("event_planner").collection("users");
    const EventDetailsCollection = client.db("event_planner").collection("event_details");

    // Route: Admin Login
    app.post("/login", (req, res) => {
      const { email, password } = req.body;
      const ADMIN_EMAIL = "yasinmunn@gmail.com"; // Admin email
      const ADMIN_PASSWORD = "Yasin@0102"; // Admin password

      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: "1h" });
        return res.json({ token });
      } else {
        return res.status(401).json({ message: "Invalid email or password" });
      }
    });

    // Route: Save Event Details
    app.post("/save-event-details", async (req, res) => {
      const { headline, deadline, location, date, time, editorContent, imageLink, webLink } = req.body;

      if (!headline || !deadline || !location || !date || !time || !editorContent  ) {
        return res.status(400).json({ message: "All fields are required!" });
      }

      try {
        // Delete previous event details
        await EventDetailsCollection.deleteMany({});

        // Insert new event details
        const eventDetails = {
          headline,
          deadline,
          location,
          date,
          time,
          imageLink,
          webLink,
          description: editorContent,
          createdAt: new Date(),
        };

        const result = await EventDetailsCollection.insertOne(eventDetails);
        res.status(201).json(result);
      } catch (error) {
        console.error("Error saving event details:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // Route: Get Event Details
    app.get("/save-event-details", async (req, res) => {
      try {
        const eventDetails = await EventDetailsCollection.findOne({}, { sort: { createdAt: -1 } });
        res.json(eventDetails || {});
      } catch (error) {
        console.error("Error fetching event details:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // Route: Fetch All Users
    app.get("/users", async (req, res) => {
      try {
        const users = await UserCollection.find().toArray();
        res.json(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // Route: Add New User
    app.post("/users", async (req, res) => {
      const { name, email, registrationTime } = req.body;

      if (!name || !email || !registrationTime) {
        return res.status(400).json({ message: "All fields are required!" });
      }

      try {
        const newUser = { name, email, registrationTime };
        const result = await UserCollection.insertOne(newUser);
        res.status(201).json(result);
      } catch (error) {
        console.error("Error adding user:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // Test API Connection
    app.get("/", (req, res) => res.send("API is working!"));

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

run().catch(console.dir);
