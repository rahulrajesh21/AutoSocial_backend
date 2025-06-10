# Deploying to Vercel with Cron Jobs

This guide explains how to deploy the AutoSocial backend to Vercel with scheduled cron jobs.

## Setup Steps

1. **Create a Vercel Project**
   - Connect your GitHub repository to Vercel
   - Set the root directory to `AutoSocial_backend`
   - Set the build command to `npm install`
   - Set the output directory to `.`

2. **Configure Environment Variables**
   - Add all required environment variables from your `.env` file to Vercel
   - Create a new secret called `CRON_SECRET` with a strong random value for securing cron job endpoints

3. **Verify Cron Job Configuration**
   - The `vercel.json` file includes the cron job configuration
   - The cron job is set to run every minute (`* * * * *`)
   - You can adjust this schedule as needed

## How It Works

Instead of using `node-cron` which requires a long-running server, this project uses Vercel Cron Jobs:

1. Vercel will call the API endpoint `/api/cron/check-scheduled-posts` according to the schedule
2. The endpoint checks for due scheduled posts and processes them
3. Each request is authenticated using the `CRON_SECRET` environment variable

## Monitoring

You can monitor your cron jobs in the Vercel dashboard:

1. Go to your project in the Vercel dashboard
2. Navigate to the "Cron Jobs" tab
3. View the execution history and logs

## Troubleshooting

- If cron jobs aren't running, verify that the `CRON_SECRET` environment variable is set correctly
- Check the function logs in the Vercel dashboard for any errors
- Note that Vercel's free tier has limitations on cron job frequency and execution time

## Local Development

For local development, you can still use the original `cron/ScheduleChecker.js` file by uncommenting the import in `server.js`. 