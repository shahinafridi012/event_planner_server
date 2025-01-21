const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// MongoDB URI (with fallback)
const uri =
  process.env.MONGO_URI ||
  "mongodb+srv://event_planner:OlqVoJVpRp3BvzW8@cluster0.adorufe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' }));


// MongoDB connection and routes
async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const UserCollection = client.db("event_planner").collection("users");
    const EventDetailsCollection = client.db("event_planner").collection("event_details");

    // Admin Login Route
    app.post("/api/admin-login", (req, res) => {
      const { email, password } = req.body;

      const adminEmail = "yasinmunn@gmail.com";
      const adminPassword = "Yasin@0102";

      console.log("Login attempt for:", email);

      if (email === adminEmail && password === adminPassword) {
        return res.status(200).json({ message: "Login successful" });
      }

      res.status(401).json({ message: "Invalid email or password" });
    });

    // Add New User Route
    app.post("/users", async (req, res) => {
      const { name, email, registrationTime } = req.body;

      if (!name || !email || !registrationTime) {
        return res.status(400).json({ message: "All fields are required!" });
      }

      try {
        const newUser = { name, email, registrationTime };
        const result = await UserCollection.insertOne(newUser);
        res.status(201).json({
          message: "User added successfully",
          data: result,
        });
      } catch (error) {
        console.error("Error adding user:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // Fetch All Users Route
    app.get("/users", async (req, res) => {
      try {
        const users = await UserCollection.find().toArray();
        res.status(200).json(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // Save Event Details Route (Replace Previous Data)
    app.post("/save-event-details", async (req, res) => {
      const { headline, deadline,  editorContent, imageLink, webLink, location, time, date } = req.body;
  
      // Log the incoming data
      console.log(req.body);
  
      // Check if all necessary fields are present
      // if (!headline || !deadline  || !time || !editorContent || !imageLink || !webLink) {
      //     return res.status(400).json({ message: "All fields are required!" });
      // }
  
      try {
          await EventDetailsCollection.deleteMany({}); // Delete previous event details
          const newEvent = { headline, deadline,  editorContent, imageLink, webLink, location, date, time };
          const result = await EventDetailsCollection.insertOne(newEvent);
  
          res.status(201).json({ message: "Event details saved successfully!", result });
      } catch (error) {
          console.error("Error saving event details:", error);
          res.status(500).json({ message: "Internal server error" });
      }
  });
  
    // app.post('/save-event-details', async (req, res)=>{
    //   const { headline, deadline, location, date, time, editorContent, imageLink, webLink } = req.body;
    //   const event = {
    //     headline,
    //     deadline,
    //     location,
    //     date,
    //     time,
    //     description,
    //     imageLink,
    //     webLink,
    //   };
    //   const result = await EventDetailsCollection.insertOne(event);
    //   res.send(result);
    // })
    
    

    // Fetch Current Event Details
    app.get("/save-event-details", async (req, res) => {
      try {
        const eventDetails = await EventDetailsCollection.findOne();

        if (!eventDetails) {
          return res.status(404).json({ message: "No event details found!" });
        }

        res.status(200).json(eventDetails);
      } catch (error) {
        console.error("Error fetching event details:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // Test API Connection
    app.get("/", (req, res) => res.send("API is working!"));

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // Exit the process with failure
  }
}

run().catch(console.dir);

