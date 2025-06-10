const sql = require('../../config/database');

export default async function handler(req, res) {
  // Verify the request is from Vercel Cron
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = new Date().toISOString();
    console.log(`[${now}] Cron job started: Checking for due scheduled posts`);
    
    // Get all posts that are scheduled and due
    const duePosts = await sql`
      SELECT * FROM scheduled_posts
      WHERE status = 'scheduled' AND scheduled_date <= ${now}
    `;

    for (const post of duePosts) {
      console.log(`Posting now: ID ${post.id} scheduled for ${post.scheduled_date}`);
      
      // Mark the post as "posted"
      await sql`
        UPDATE scheduled_posts
        SET status = 'posted', updated_at = NOW()
        WHERE id = ${post.id}
      `; 
    }

    console.log(`Cron job completed. Processed ${duePosts.length} post(s).`);
    return res.status(200).json({ success: true, processed: duePosts.length });
  } catch (err) {
    console.error('Error during scheduled post check:', err);
    return res.status(500).json({ error: err.message });
  }
} 