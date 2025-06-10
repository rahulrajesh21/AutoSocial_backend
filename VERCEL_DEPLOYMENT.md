# Deploying to Vercel with Cron Jobs

This guide explains how to deploy the AutoSocial backend to Vercel with scheduled cron jobs.

## Setup Steps

1. **Create a Vercel Project**
   - Connect your GitHub repository to Vercel
   - Set the root directory to `AutoSocial_backend`
   - Framework Preset: Select "Other"
   - Build Command: Leave as default (Vercel will use settings from vercel.json)
   - Output Directory: Leave as default

2. **Configure Environment Variables**
   - Add all required environment variables from your `.env` file to Vercel
   - Create a new secret called `CRON_SECRET` with a strong random string (at least 16 characters)
   - You can use a password generator like 1Password to create a secure value

3. **Deploy Your Project**
   - Click "Deploy" in the Vercel dashboard
   - Alternatively, use the Vercel CLI:
     ```
     npm install -g vercel
     cd AutoSocial_backend
     vercel
     ```
   - For production deployment with CLI: `vercel --prod`

## Cron Job Configuration

- The cron job is configured in `vercel.json` to run once daily at midnight (`0 0 * * *`)
- The endpoint `/api/cron/check-scheduled-posts` will be called automatically by Vercel
- The endpoint is secured with the `CRON_SECRET` environment variable

## Monitoring and Management

1. **View Cron Jobs**
   - Select your project from the Vercel dashboard
   - Select the Settings tab
   - Select the Cron Jobs tab from the left sidebar

2. **View Logs**
   - From the list of cron jobs, select "View Logs"
   - This will show you runtime logs with a filter for your cron job

3. **Maintenance**
   - **Update Schedule**: Change the expression in vercel.json and redeploy
   - **Delete Cron Job**: Remove the configuration from vercel.json and redeploy
   - **Disable Cron Job**: Navigate to the Cron Jobs tab and click "Disable Cron Jobs"

## Important Notes

1. **Cron Job Accuracy**
   - On Hobby plan, cron jobs have hourly accuracy (may run anytime within the specified hour)
   - On Pro/Enterprise plans, cron jobs run within the minute specified

2. **Duration Limits**
   - Cron jobs have the same duration limits as Serverless Functions
   - If you need more processing time, consider splitting your job or using a queue system

3. **Error Handling**
   - Vercel will not retry failed cron jobs
   - Check logs through the "View Log" button in the Cron Jobs tab

4. **Testing Locally**
   - You can test your cron endpoint locally by making a request to: http://localhost:3000/api/cron/check-scheduled-posts
   - Remember to set the Authorization header: `Bearer YOUR_CRON_SECRET`

5. **Rollbacks**
   - If you rollback to a previous deployment, active cron jobs will not be updated
   - They will continue to run as scheduled until manually disabled or updated

## Local Development

For local development, you can still use the original `cron/ScheduleChecker.js` file by uncommenting the import in `server.js`. 