const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken'); // For token generation
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
const SECRET_KEY = "f5e3f5b55eb9feebc7e3586934d627eafee87f1bb64a02f717ddbf0a0b6c746d"; // Replace with your secret key

const uri = "mongodb+srv://event_planner:OlqVoJVpRp3BvzW8@cluster0.adorufe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});


// Connect to MongoDB
async function run() {
    try {
        await client.connect();
        const User_collection = client.db('event_planner').collection('users');
        const EventDetails_collection = client.db('event_planner').collection('event_details');

        app.use(cors());
        app.use(express.json());

        // Middleware to verify token
        const verifyToken = (req, res, next) => {
            const token = req.headers['authorization']?.split(' ')[1];
            if (!token) {
              return res.status(401).json({ message: 'No token provided' });
            }
            jwt.verify(token, SECRET_KEY, (err, decoded) => {
              if (err) {
                return res.status(401).json({ message: 'Failed to authenticate token' });
              }
              req.user = decoded;
              next();
            });
          };

       
        // Admin login route
        app.post('/login', (req, res) => {
            const { email, password } = req.body;
            const ADMIN_EMAIL = "yasinmunn@gmail.com"; // Replace with actual admin email
            const ADMIN_PASSWORD = "Yasin@0102"; // Replace with actual admin password

            if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
                const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: "1h" });
                res.json({ token });
            } else {
                res.status(401).json({ message: "Invalid email or password!" });
            }
        });

        // Protected route for event details submission
        app.post('/event-details',  async (req, res) => {
            const {
                deadline,
                headline,
                eventDetails_date,
                eventDetails_time,
                eventDetails_location,
                whatYoullLearn,
                whoShouldAttend,
                whatYoullLearnTitle,
                whoShouldAttendTitle
            } = req.body;

            if (!deadline || !headline || !eventDetails_date || !eventDetails_time || !eventDetails_location) {
                return res.status(400).json({ message: "All event details fields are required!" });
            }

            // Step 1: Delete previous event details
            await EventDetails_collection.deleteMany({});

            // Step 2: Insert the new event details
            const eventDetails = {
                deadline,
                headline,
                eventDetails_date,
                eventDetails_time,
                eventDetails_location,
                whatYoullLearn,
                whoShouldAttend,
                whatYoullLearnTitle,
                whoShouldAttendTitle,
                createdAt: new Date(),
            };

            const result = await EventDetails_collection.insertOne(eventDetails);
            res.status(201).json(result);
        });

        // Protected route to fetch event details
        app.get('/event-details',  async (req, res) => {
            const eventDetails = await EventDetails_collection.find().toArray();
            res.json(eventDetails);
        });
        app.post('/users', async (req, res) => {
            const { name, email, registrationTime } = req.body;

            // Validate required fields
            if (!name || !email || !registrationTime) {
                return res.status(400).json({ message: "All fields are required!" });
            }

            // Create a user object and insert it into the collection
            const user = { name, email, registrationTime };
            const result = await User_collection.insertOne(user);

            res.status(201).json(result); // Return the result to the client
        });
        app.get('/users',  async (req, res) => {
            const users = await User_collection.find().toArray(); // Retrieve all users from the collection
            res.json(users); // Send the users back as a JSON response
        });

        // Test API connection
        app.get('/', (req, res) => res.send('API is working!'));

        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    } catch (error) {
        console.error(error);
    }
}

run().catch(console.dir);
