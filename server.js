require('dotenv').config();
const express = require('express');
const { clerkMiddleware } = require('@clerk/express');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

const workflowRouter = require('./routes/workflow');
const exampleRouter = require('./routes/example');
const instagramRouter = require('./routes/instagram');
const { replyToComment } = require('./utils/instagramUtils');

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
app.use('/api/instagram', instagramRouter);

// ✅ Root route
app.get('/', (req, res) => {
  console.log('Root route accessed');
  res.send('Hello World!');
});

// Instagram OAuth callback route
app.get('/auth/instagram/callback', (req, res) => {
  const { code, error } = req.query;
  
  console.log('Instagram callback received:', { code, error });
  
  if (error) {
    console.error('Instagram OAuth error:', error);
    // Redirect to frontend with error
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/integrations?error=${encodeURIComponent(error)}`);
  }
  
  if (!code) {
    console.error('No authorization code received from Instagram');
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/integrations?error=no_code`);
  }
  
  // Return an HTML page that will post the code to the frontend via postMessage
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Instagram Authentication</title>
      <script>
        // Send the code to the opener window
        window.onload = function() {
          if (window.opener) {
            window.opener.postMessage({
              type: 'INSTAGRAM_AUTH_CODE',
              code: '${code}'
            }, '*');
            document.getElementById('status').innerText = 'Authentication successful! You can close this window.';
            // Close the window after a short delay
            setTimeout(() => window.close(), 2000);
          } else {
            window.location.href = '${process.env.FRONTEND_URL || 'http://localhost:5173'}/integrations?code=${code}';
          }
        };
      </script>
      <style>
        body { font-family: Arial, sans-serif; background-color: #1a1a1a; color: white; text-align: center; padding-top: 100px; }
        .container { max-width: 500px; margin: 0 auto; padding: 20px; background-color: #2a2a2a; border-radius: 8px; }
        h1 { color: #4ade80; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Instagram Authentication</h1>
        <p id="status">Processing authentication...</p>
      </div>
    </body>
    </html>
  `);
});

// For handling privacy policy page when accessed through ngrok
app.get('/privacy-policy', (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/privacy-policy`);
});

const VERIFY_TOKEN = "new23611"; 
app.get('/webhooks', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  console.log('Webhook verification request:', { mode, token, challenge });
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Verification failed');
    res.sendStatus(403);
  }
});

// Handle webhook events (POST)
app.post('/webhooks', (req, res) => {
  const { entry } = req.body;

  console.log('Webhook request body:', JSON.stringify(req.body, null, 2));

  const change = req.body.entry?.[0]?.changes?.[0];
  const username = change?.value?.from?.username;

  if (change?.field === 'comments' && username !== 'rahul_r4441') {
    const commentId = change.value.id;
    const commentText = change.value.text;

    replyToComment(commentId, commentText);
  }

  console.log('📩 Webhook event received:', JSON.stringify(entry, null, 2));
  res.sendStatus(200);
});


// ✅ Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});