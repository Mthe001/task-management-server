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
// Global Error Handler Middleware
app.use((err, req, res, next) => {
    console.error("Server Error:", err.stack);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
});



const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectId } = require('mongodb');
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
           
        app.post("/tasks", async (req, res) => {
            const { email, title, description, status, category } = req.body;

            // Ensure required fields are provided
            if (!email || !title || !category) {
                return res.status(400).send({ message: "Email, Title, and Category are required" });
            }

            try {
                const categories = [
                    { name: "To-Do", active: category === "To-Do" },
                    { name: "In Progress", active: category === "In Progress" },
                    { name: "Done", active: category === "Done" }
                ];

                const newTask = {
                    email,
                    title,
                    description: description || "",
                    categories,
                    timestamp: new Date().toISOString(),
                };

                const result = await tasksCollection.insertOne(newTask);
                res.status(201).send({
                    message: "Task created successfully",
                    task: { _id: result.insertedId, ...newTask },
                });
            } catch (error) {
                console.error("Error creating task:", error);
                res.status(500).send({ message: "Failed to create task", error: error.message });
            }
        });

        // Update Task - PUT /tasks/:taskId
        app.put("/tasks/:id", async (req, res) => {
            const { id } = req.params;
            const { category } = req.body;

            try {
                const updatedTask = await tasksCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: {
                            category: category,  // ✅ Update category field
                            categories: [
                                { name: "To-Do", active: category === "To-Do" },
                                { name: "In Progress", active: category === "In Progress" },
                                { name: "Done", active: category === "Done" },
                            ],  // ✅ Update categories array
                        }
                    }
                );

                res.status(200).json({ message: "Task updated successfully" });
            } catch (error) {
                console.error("Error updating task:", error);
                res.status(500).json({ message: "Server error", error: error.message });
            }
        });




        // Delete Task - DELETE /tasks/:taskId
        app.delete('/tasks/:id', async (req, res) => {
            const taskId = req.params.id;
            try {
                const task = await tasksCollection.findOne({ _id: new ObjectId(taskId) });
                if (!task) {
                    return res.status(404).json({ message: 'Task not found' });
                }
                await tasksCollection.deleteOne({ _id: new ObjectId(taskId) });
                res.status(200).json({ message: 'Task deleted successfully' });
            } catch (error) {
                console.error("Error deleting task:", error);
                res.status(500).json({ message: 'Error deleting task' });
            }
        });





        app.patch("/tasks/:id", async (req, res) => {
            const { id } = req.params;
            const { categories } = req.body; // The new categories

            try {
                const task = await tasksCollection.findById(id);
                if (!task) {
                    return res.status(404).json({ message: "Task not found" });
                }

                // Update the task's categories
                task.categories = categories;

                // Save the updated task
                await task.save();

                res.status(200).json(task); // Return the updated task
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: "Failed to update task" });
            }
        });





        
        // Example for updating task order
        app.post('/tasks/reorder', async (req, res) => {
            const { taskIds } = req.body;
            try {
                // Reorder tasks
                for (let i = 0; i < taskIds.length; i++) {
                    await tasksCollection.updateOne(
                        { _id: taskIds[i] },
                        { $set: { position: i } }
                    );
                }

                // Respond back
                res.status(200).send('Task order updated successfully');
            } catch (error) {
                res.status(500).send('Failed to update task order');
            }
        });

       



     




        // Route to get tasks by email
        app.get("/tasks/:email", async (req, res) => {
            try {
                const { email } = req.params;

                // Validate email format using regex
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    return res.status(400).json({ message: "Invalid email format" });
                }

                // Fetch tasks from the database based on email
                const tasks = await tasksCollection.find({ email: email }).toArray();

                if (!tasks.length) {
                    return res.status(404).json({ message: "No tasks found for this email" });
                }

                res.status(200).json({ tasks });
            } catch (error) {
                console.error("Error fetching tasks:", error);
                res.status(500).json({ message: "Server error", error: error.message });
            }
        });

        

        // // Route to get a task by its ID
        app.get("/tasks/:id", async (req, res, next) => {
            try {
                const { id } = req.params;
                console.log("Received ID:", id);

                if (!ObjectId.isValid(id)) {
                    return res.status(400).json({ message: "Invalid task ID format" });
                }

                const task = await tasksCollection.findOne({ _id: new ObjectId(id) });

                if (!task) {
                    return res.status(404).json({ message: "Task not found" });
                }

                res.status(200).json(task);
            } catch (error) {
                next(error); // Passes error to Express error-handling middleware
            }
        });

       






        app.get("/tasks", async (req, res) => {
            try {
                const tasks = await tasksCollection.find().toArray();
                console.log(tasks); // Log the tasks fetched from the DB to verify the response
                if (!tasks || tasks.length === 0) {
                    return res.status(404).json({ message: "No tasks found" });
                }
                res.status(200).json({ tasks });
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