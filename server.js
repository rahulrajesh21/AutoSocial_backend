require('dotenv').config();
const express = require('express');
const { clerkMiddleware } = require('@clerk/express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

const workflowRouter = require('./routes/workflow');
const exampleRouter = require('./routes/example');

app.use(clerkMiddleware());


app.use(
  cors({
    origin: function (origin, callback) {
      callback(null, origin || '*');  
    },
    credentials: true,
  })
);

// ✅ Parse JSON bodies
app.use(express.json());

// ✅ Routes (clerkAuth is now applied only in workflowRouter)
app.use('/api', workflowRouter);
app.use('/api/data', exampleRouter);

// ✅ Root route
app.get('/', (req, res) => {
  console.log('Root route accessed');
  res.send('Hello World!');
});



// ✅ Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});