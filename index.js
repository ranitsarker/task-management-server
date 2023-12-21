const express = require('express');
const cors = require('cors');
const app = require();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
    res.send('task management server is running.')
})
app.listen(port, () => {
    console.log(`task management server is running on port ${port}`)
})