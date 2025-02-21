require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;


//middleware
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}));
app.use(express.json());




const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.a75ke.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();



       const database = client.db("Task24Hr");
       const usersCollection = database.collection("users");
       const tasksCollection = database.collection("tasks"); // Tasks collection
         

       
         
         //save user  data to the database

        // Create User - POST /users
        app.post("/users", async (req, res) => {
            try {
                const { email, name, image } = req.body; // Get user data from request body

                if (!email) {
                    return res.status(400).send({ message: "Email is required" });
                }

                // Check if the user already exists by email
                const existingUser = await usersCollection.findOne({ email });
                if (existingUser) {
                    return res.status(400).send({ message: "User already exists" });
                }

                // Insert new user into the database
                const result = await usersCollection.insertOne({
                    email,
                    name,
                    image,
                    location: req.body.location || '',
                    description: req.body.description || ''
                });

                return res.status(201).send({ message: "User created successfully", user: result });
            } catch (error) {
                console.error("Error creating user:", error);
                return res.status(500).send({ message: "Server error" });
            }
        });
         
        // Update User - PUT /users
        app.put("/users", async (req, res) => {
            try {
                const { email, name, location, description, image } = req.body; // Get updated user data from request body

                if (!email) {
                    return res.status(400).send({ message: "Email is required" });
                }

                // Check if the user exists
                const existingUser = await usersCollection.findOne({ email });
                if (!existingUser) {
                    return res.status(404).send({ message: "User not found" });
                }

                // Update user data
                const updatedUser = await usersCollection.updateOne(
                    { email },
                    { $set: { name, location, description, image } }
                );

                return res.send({ message: "User updated successfully", updatedUser });
            } catch (error) {
                console.error("Error updating user:", error);
                return res.status(500).send({ message: "Server error" });
            }
        });

        
        // Get User Profile - GET /users/:email
        app.get("/users/:email", async (req, res) => {
            try {
                const email = req.params.email; // Get email from URL parameter

                // Find the user by email
                const user = await usersCollection.findOne({ email });

                if (!user) {
                    return res.status(404).send({ message: "User not found" });
                }

                // Return user data
                return res.send({ message: "User profile fetched successfully", user });
            } catch (error) {
                console.error("Error fetching user profile:", error);
                return res.status(500).send({ message: "Server error" });
            }
        });
        


        // Create Task - POST /tasks
        
        // app.post("/tasks", async (req, res) => {
        //     try {
        //         const { email, title, description, status, category } = req.body;  // Add category

        //         if (!email || !title || !category) {  // Ensure category is provided
        //             return res.status(400).send({ message: "Email, Title, and Category are required" });
        //         }

        //         const result = await tasksCollection.insertOne({
        //             email,
        //             title,
        //             description: description || "",
        //             status: status || 'pending',
        //             category,  // Include category in the task
        //             timestamp: new Date().toISOString(),
        //         });

        //         return res.status(201).send({ message: "Task created successfully", task: result.ops[0] });
        //     } catch (error) {
        //         console.error("Error creating task:", error);
        //         return res.status(500).send({ message: "Failed to create task" });
        //     }
        // });

       
        app.post("/tasks", async (req, res) => {
            const { email, title, description, status, category } = req.body;

            // Ensure required fields are provided
            if (!email || !title || !category) {
                return res.status(400).send({ message: "Email, Title, and Category are required" });
            }

            try {
                // Insert the new task into the database
                const result = await tasksCollection.insertOne({
                    email,
                    title,
                    description: description || "",
                    status: status || "pending",
                    category, // Include category in the task
                    timestamp: new Date().toISOString(),
                });

                // Send response with the task including its inserted ID
                res.status(201).send({
                    message: "Task created successfully",
                    task: { _id: result.insertedId, email, title, description, status, category, timestamp: new Date().toISOString() },
                });
            } catch (error) {
                console.error("Error creating task:", error);
                res.status(500).send({ message: "Failed to create task", error: error.message });
            }
        });

        app.get("/tasks", async (req, res) => {
            try {
                const tasks = await tasksCollection.find().toArray();
                if (!tasks || tasks.length === 0) {
                    return res.status(404).json({ message: "No tasks found" });
                }
                res.status(200).json({ tasks });  // Send the tasks array
            } catch (error) {
                console.error("Error fetching tasks:", error);
                res.status(500).json({ message: "Failed to fetch tasks", error: error.message });
            }
        });








           

        app.get('/', (req, res) => {
            res.send('task manager is tasking!');
        });






        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);








app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});