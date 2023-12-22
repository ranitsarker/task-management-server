const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174',
    'https://task-management-e6a25.web.app',
    'https://task-management-e6a25.firebaseapp.com',

  
  ], 
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wgcoqid.mongodb.net/?retryWrites=true&w=majority`;

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
    await client.connect();
    const tasksCollection = client.db('taskManagement').collection('tasks');

    // auth related endpoint or api
    app.post('/jwt', async(req, res) => {
      const user = req.body;
      console.log('user for token:', user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res
      .cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      })
      
      .send({success: true});
    })
    // user logout:
    app.post('/logout', async(req, res) =>{
      const user = req.body;
      console.log('logged out user:', user)
      res.clearCookie('token', 
      {maxAge: 0,
        sameSite: "none",
        secure: true
      }).send({success: true})
    })



// endpoint to create a new task
app.post('/create-task', async (req, res) => {
  try {
    const { title, description, deadline, priority, createdBy } = req.body;

    // Ensure that the required fields are provided
    if (!title || !description || !deadline || !priority || !createdBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // Extract display name and email from createdBy object
    const { displayName, email } = createdBy;
    // Create a new task object with user information
    const newTask = {
      title,
      description,
      deadline,
      priority,
      createdBy: { displayName, email },
      status: 'todo',
    };

    // Insert the task into the tasks collection
    const result = await tasksCollection.insertOne(newTask);

    // Check if the task was successfully inserted
    if (result && result.insertedId) {
      console.log('Task inserted successfully. Inserted ID:', result.insertedId);
      return res.status(201).json({ success: true, task: newTask });
    } else {
      console.error('Failed to insert task. Result:', result);
      return res.status(500).json({ error: 'Failed to create task' });
    }
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a new endpoint to get tasks for a specific user
app.get('/get-user-tasks/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Fetch tasks for the specified user from the tasks collection
    const tasks = await tasksCollection.find({ 'createdBy.email': userId }).toArray();
    res.status(200).json({ success: true, tasks });
  } catch (error) {
    console.error('Error fetching tasks for user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update endpoint to use tasksCollection directly
app.put('/update-task/:taskId', async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const { title, description, deadline, priority } = req.body;

    // Ensure that the required fields are provided
    if (!title || !description || !deadline || !priority) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Update the task in the tasks collection
    const result = await tasksCollection.updateOne(
      { _id: new ObjectId(taskId) },
      {
        $set: {
          title,
          description,
          deadline,
          priority,
        },
      }
    );

    // Check if the task was successfully updated
    if (result && result.modifiedCount > 0) {
      console.log('Task updated successfully. Task ID:', taskId);
      return res.status(200).json({ success: true });
    } else {
      console.error('Failed to update task. Result:', result);
      return res.status(500).json({ error: 'Failed to update task' });
    }
  } catch (error) {
    console.error('Error updating task:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a new endpoint to delete a task
app.delete('/delete-task/:taskId', async (req, res) => {
  try {
    const taskId = req.params.taskId;

    // Delete the task from the tasks collection
    const result = await tasksCollection.deleteOne({ _id: new ObjectId(taskId) });

    // Check if the task was successfully deleted
    if (result && result.deletedCount > 0) {
      console.log('Task deleted successfully. Task ID:', taskId);
      return res.status(200).json({ success: true });
    } else {
      console.error('Failed to delete task. Result:', result);
      return res.status(500).json({ error: 'Failed to delete task' });
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
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
app.get('/', (req, res) => {
    res.send('task management server is running.')
})
app.listen(port, () => {
    console.log(`task management server is running on port ${port}`)
})