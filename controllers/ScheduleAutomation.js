const path = require('path');
const fs = require('fs');
const sql = require('../config/database');
const { createInstagramPost } = require('../utils/instagramUtils');

const CreateScheduleAutomation = async (req, res) => {
  try {
    console.log('CreateScheduleAutomation called', req.body);
    const { user_id, caption, scheduled_date, scheduled_time } = req.body;
    const file = req.file;
    
    console.log('Scheduled Date:', scheduled_date);
    console.log('Scheduled Time:', scheduled_time);
    console.log('File Info:', file);
    
    if (!file) {
      return res.status(400).json({ error: 'Media file is required.' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4', 'video/mov'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ 
        error: 'Invalid file type. Only JPEG, PNG images and MP4, MOV videos are allowed.' 
      });
    }

    // Create safe filename (remove spaces and special characters)
    const fileExtension = path.extname(file.originalname);
    const safeOriginalName = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    const filename = `${Date.now()}_${safeOriginalName}`;
    const uploadPath = path.join(__dirname, '..', 'uploads', filename);
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Save media file locally
    fs.writeFileSync(uploadPath, file.buffer);
    
    const media_url = `/uploads/${filename}`;
    const media_type = file.mimetype;

    // Parse and reformat scheduled date
    const parsedDate = new Date(scheduled_date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid scheduled_date format.' });
    }
    
    const yyyyMMdd = parsedDate.toISOString().split('T')[0];
    const scheduled_datetime = new Date(`${yyyyMMdd}T${scheduled_time}`);
    
    if (isNaN(scheduled_datetime.getTime())) {
      return res.status(400).json({ error: 'Invalid combined datetime.' });
    }

    // Check if scheduled time is in the future
    if (scheduled_datetime <= new Date()) {
      return res.status(400).json({ error: 'Scheduled time must be in the future.' });
    }

    // For immediate testing, try to create Instagram post
    // NOTE: This will likely fail with ngrok - see solutions below
    const fullMediaUrl = `https://better-utterly-meerkat.ngrok-free.app${media_url}`;
    
    console.log('Attempting Instagram post with URL:', fullMediaUrl);
    
    // Add error handling for Instagram API call
    let instagramResult = null;
    try {
      instagramResult = await createInstagramPost(fullMediaUrl, caption || "hello");
      console.log("Instagram API result:", instagramResult);
    } catch (instagramError) {
      console.error('Instagram API Error:', instagramError);
      // Don't return error here - still save to database for scheduling
      console.log('Instagram post failed, but continuing to save scheduled post...');
    }

    // Insert into DB regardless of Instagram API success/failure
    const result = await sql`
      INSERT INTO scheduled_posts (
        user_id, caption, media_url, media_type, scheduled_date
      )
      VALUES (
        ${user_id}, ${caption}, ${media_url}, ${media_type}, ${scheduled_datetime}
      )
      RETURNING *
    `;

    console.log("Database insert successful");

    return res.status(200).json({
      message: 'Scheduled post created successfully.',
      data: result[0],
      instagram_result: instagramResult,
      note: instagramResult ? 'Instagram post created immediately' : 'Instagram post will be attempted at scheduled time'
    });

  } catch (err) {
    console.error('Error in CreateScheduleAutomation:', err);
    
    // Clean up uploaded file if it exists
    if (req.file) {
      try {
        const filename = `${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`;
        const uploadPath = path.join(__dirname, '..', 'uploads', filename);
        if (fs.existsSync(uploadPath)) {
          fs.unlinkSync(uploadPath);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  CreateScheduleAutomation
};