require('dotenv').config();
const express = require('express');
const { clerkMiddleware } = require('@clerk/express');
const cors = require('cors');
const path = require('path');
const multer = require('multer'); // Add this for handling multipart/form-data
const app = express();
const port = process.env.PORT || 3000;
// Cron jobs are now handled by Vercel Cron

const workflowRouter = require('./routes/workflow');
const exampleRouter = require('./routes/example');
const instagramRouter = require('./routes/instagram');
const helpDeskRouter = require('./routes/helpdesk');
const { getWebhook } = require('./controllers/InstagramController');
const { runMigrations } = require('./scripts/run_migrations');

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
app.use(express.json({ limit: '10mb'}));

// ✅ Add multer middleware for handling multipart/form-data
const upload = multer({ 
  limits: { 
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Apply multer middleware to routes that need file upload
app.use('/api/CreateScheduleAutomation', upload.single('media'));

// ✅ Routes (clerkAuth is now applied only in workflowRouter)
app.use('/api', workflowRouter);
app.use('/api/data', exampleRouter);
app.use('/api/instagram', instagramRouter);
app.use('/api/helpdesk', helpDeskRouter);
app.use('/uploads', express.static('uploads'));

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

app.post('/webhooks', async (req, res) => {
  console.log('Webhook request body:', JSON.stringify(req.body, null, 2));
  
  try {
    await getWebhook(req, res);
  } catch (error) {
    console.error('Error in webhook route:', error);
    res.status(500).json({ 
      message: 'Internal Server Error',
      error: error.message 
    });
  }
});

// Run database migrations on startup
(async () => {
  try {
    await runMigrations();
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
  }
})();

// ✅ Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});