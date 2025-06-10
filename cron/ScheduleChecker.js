const cron = require('node-cron');
const sql = require('../config/database');
// This job runs every minute
cron.schedule('* * * * *', async () => {
  console.log(`[${new Date().toISOString()}] Cron job started: Checking for due scheduled posts`);
 
  try {
    const now = new Date().toISOString();
    console.log(now)
    // Get all posts that are scheduled and due
    const duePosts = await sql`
      SELECT * FROM scheduled_posts
      WHERE status = 'scheduled' AND scheduled_date <= ${now}
    `;

    for (const post of duePosts) {
      // TODO: Add logic to post to social media or simulate publishing
      console.log(`Posting now: ID ${post.id} scheduled for ${post.scheduled_date}`);
      

      // Mark the post as "posted"
      await sql`
        UPDATE scheduled_posts
        SET status = 'posted', updated_at = NOW()
        WHERE id = ${post.id}
      `; 

      // Optionally: store response_data if you send it to a third-party API
    }

    console.log(`Cron job completed. Processed ${duePosts.length} post(s).`);
  } catch (err) {
    console.error('Error during scheduled post check:', err);
  }
});