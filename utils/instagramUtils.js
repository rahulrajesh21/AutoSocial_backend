require("dotenv").config();
const axios = require('axios');
const { gemini } = require("./geminiUtils");
const { getPageId } = require("./PageUtils");
const sql = require('../config/database');
const instagramClient = axios;
const { getAuth } = require('@clerk/express');  
// Function to get tokens from the database for a user
const getTokensForUser = async (userId) => {
  try {
    // If no userId provided, use default tokens from env
    if (!userId) {
      return {
        accessToken: process.env.INSTAGRAM_TOKEN,
        pageAccessToken: process.env.INSTAGRAM_PAGE || process.env.INSTAGRAM_TOKEN
      };
    }
    console.log("userId", userId);
    // Get tokens from database
    const settings = await sql`
      SELECT access_token, page_access_token 
      FROM users 
      WHERE username = ${userId} or id = ${userId}
    `;
    
    if (settings.length === 0 || (!settings[0].access_token && !settings[0].page_access_token)) {
      // Fallback to env variables if no settings found
      return {
        accessToken: process.env.INSTAGRAM_TOKEN,
        pageAccessToken: process.env.INSTAGRAM_PAGE || process.env.INSTAGRAM_TOKEN
      };
    }
    
    return {
      accessToken: settings[0].access_token,
      pageAccessToken: settings[0].page_access_token || settings[0].access_token
    };
  } catch (error) {
    console.error('Error getting tokens from database:', error);
    // Fallback to env variables
    return {
      accessToken: process.env.INSTAGRAM_TOKEN,
      pageAccessToken: process.env.INSTAGRAM_PAGE || process.env.INSTAGRAM_TOKEN
    };
  }
};

const getInstagramUserId = async (userId) => {
  const { pageAccessToken } = await getTokensForUser(userId);
  
  if (!pageAccessToken) {
    console.error('Instagram page access token is missing');
    return null;
  }

  try {
    // First, get all Facebook pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${pageAccessToken}`
    );
    
    if (!pagesResponse.ok) {
      console.error('Failed to fetch Facebook pages');
      return null;
    }
    
    const pagesData = await pagesResponse.json();
    
    if (!pagesData.data || pagesData.data.length === 0) {
      console.error('No Facebook pages found');
      return null;
    }

    // Get Instagram Business Account ID from the first page
    const pageId = pagesData.data[0].id;
    const instagramResponse = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
    );
    
    if (!instagramResponse.ok) {
      console.error('Failed to fetch Instagram business account');
      return null;
    }
    
    const instagramData = await instagramResponse.json();
    
    if (!instagramData.instagram_business_account) {
      console.error('No Instagram business account connected to this page');
      return null;
    }
    
    const igUserId = instagramData.instagram_business_account.id;
    console.log('✅ Instagram User ID found:', igUserId);
    return igUserId;
    
  } catch (error) {
    console.error('Error getting Instagram User ID:', error.message);
    return null;
  }
};

const createInstagramPost = async (imageUrl, caption = '', userId) => {
  console.log("imageUrl",imageUrl,caption,userId);
  const { pageAccessToken } = await getTokensForUser(userId);
  const igUserId = await getInstagramUserId(userId);
  
  if (!igUserId) {
    console.error('Could not get Instagram User ID');
    return null;
  }
  
  if (!imageUrl) {
    console.error('Image URL is required for Instagram post');
    return null;
  }

  try {
    console.log('Creating Instagram post...');
    
    // Step 1: Create media container
    const createResponse = await fetch(
      `https://graph.facebook.com/v21.0/${igUserId}/media`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: caption,
          access_token: pageAccessToken
        })
      }
    );
    
    const createData = await createResponse.json();
    
    if (!createResponse.ok) {
      console.error('Create Media Error:', createData.error || createData);
      return null;
    }
    
    const creationId = createData.id;
    console.log('✅ Media container created:', creationId);
    
    // Step 2: Publish the post
    const publishResponse = await fetch(
      `https://graph.facebook.com/v21.0/${igUserId}/media_publish`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: pageAccessToken
        })
      }
    );
    
    const publishData = await publishResponse.json();
    
    if (!publishResponse.ok) {
      console.error('Publish Error:', publishData.error || publishData);
      return null;
    }
    
    console.log('🎉 Instagram post published successfully!');
    console.log('Post ID:', publishData.id);
    return publishData;
    
  } catch (error) {
    console.error('Error creating Instagram post:', error.message);
    return null;
  }
};


const createInstagramVideoPost = async (videoUrl, caption = '', userId) => {
  const { pageAccessToken } = await getTokensForUser(userId);
  const igUserId = await getInstagramUserId(userId);
  
  if (!igUserId) {
    console.error('Could not get Instagram User ID');
    return null;
  }
  
  if (!videoUrl) {
    console.error('Video URL is required for Instagram video post');
    return null;
  }

  try {
    console.log('Creating Instagram video post...');
    
    // Step 1: Create video media container
    const createResponse = await fetch(
      `https://graph.facebook.com/v21.0/${igUserId}/media`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_url: videoUrl,
          caption: caption,
          media_type: 'VIDEO',
          access_token: pageAccessToken
        })
      }
    );
    
    const createData = await createResponse.json();
    
    if (!createResponse.ok) {
      console.error('Create Video Media Error:', createData.error || createData);
      return null;
    }
    
    const creationId = createData.id;
    console.log('✅ Video media container created:', creationId);
    
    // Step 2: Check video processing status
    let isReady = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!isReady && attempts < maxAttempts) {
      console.log(`Checking video processing status... (${attempts + 1}/${maxAttempts})`);
      
      const statusResponse = await fetch(
        `https://graph.facebook.com/v21.0/${creationId}?fields=status_code&access_token=${pageAccessToken}`
      );
      
      const statusData = await statusResponse.json();
      
      if (statusData.status_code === 'FINISHED') {
        isReady = true;
        console.log('✅ Video processing completed');
      } else if (statusData.status_code === 'ERROR') {
        console.error('❌ Video processing failed');
        return null;
      } else {
        console.log('Video still processing...');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        attempts++;
      }
    }
    
    if (!isReady) {
      console.error('Video processing timeout');
      return null;
    }
    
    // Step 3: Publish the video post
    const publishResponse = await fetch(
      `https://graph.facebook.com/v21.0/${igUserId}/media_publish`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: pageAccessToken
        })
      }
    );
    
    const publishData = await publishResponse.json();
    
    if (!publishResponse.ok) {
      console.error('Publish Video Error:', publishData.error || publishData);
      return null;
    }
    
    console.log('🎉 Instagram video post published successfully!');
    console.log('Post ID:', publishData.id);
    return publishData;
    
  } catch (error) {
    console.error('Error creating Instagram video post:', error.message);
    return null;
  }
};


const createInstagramCarousel = async (mediaItems, caption = '', userId) => {
  const { pageAccessToken } = await getTokensForUser(userId);
  const igUserId = await getInstagramUserId(userId);
  
  if (!igUserId) {
    console.error('Could not get Instagram User ID');
    return null;
  }
  
  if (!mediaItems || mediaItems.length === 0) {
    console.error('Media items are required for carousel post');
    return null;
  }

  try {
    console.log('Creating Instagram carousel post...');
    
    // Step 1: Create media containers for each item
    const mediaIds = [];
    
    for (let i = 0; i < mediaItems.length; i++) {
      const item = mediaItems[i];
      const isVideo = item.type === 'VIDEO';
      
      const createResponse = await fetch(
        `https://graph.facebook.com/v21.0/${igUserId}/media`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            [isVideo ? 'video_url' : 'image_url']: item.url,
            is_carousel_item: true,
            access_token: pageAccessToken
          })
        }
      );
      
      const createData = await createResponse.json();
      
      if (!createResponse.ok) {
        console.error(`Create Carousel Item ${i + 1} Error:`, createData.error || createData);
        return null;
      }
      
      mediaIds.push(createData.id);
      console.log(`✅ Carousel item ${i + 1} created:`, createData.id);
    }
    
    // Step 2: Create carousel container
    const carouselResponse = await fetch(
      `https://graph.facebook.com/v21.0/${igUserId}/media`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          media_type: 'CAROUSEL',
          children: mediaIds.join(','),
          caption: caption,
          access_token: pageAccessToken
        })
      }
    );
    
    const carouselData = await carouselResponse.json();
    
    if (!carouselResponse.ok) {
      console.error('Create Carousel Error:', carouselData.error || carouselData);
      return null;
    }
    
    const creationId = carouselData.id;
    console.log('✅ Carousel container created:', creationId);
    
    // Step 3: Publish the carousel
    const publishResponse = await fetch(
      `https://graph.facebook.com/v21.0/${igUserId}/media_publish`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: pageAccessToken
        })
      }
    );
    
    const publishData = await publishResponse.json();
    
    if (!publishResponse.ok) {
      console.error('Publish Carousel Error:', publishData.error || publishData);
      return null;
    }
    
    console.log('🎉 Instagram carousel published successfully!');
    console.log('Post ID:', publishData.id);
    return publishData;
    
  } catch (error) {
    console.error('Error creating Instagram carousel:', error.message);
    return null;
  }
};



const sendMessage = async (recipientId, messageText, userId) => {
  const { accessToken } = await getTokensForUser(userId);
  
  // Validate inputs
  if (!accessToken) {
    console.error('Instagram page access token is missing');
    return null;
  }
  
  if (!recipientId || !messageText) {
    console.error('Recipient ID and message text are required');
    return null;
  }

  // Prevent sending messages to your own page ID
  // This prevents errors when processing echo messages
  

  try {
    console.log('Sending message to recipient:', recipientId);
    const response = await fetch(
      `https://graph.instagram.com/v21.0/me/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: {
            id: recipientId
          },
          message: {
            text: messageText
          },
          access_token: accessToken
        })
      }
    );

    console.log('Response status:', response.status, response.statusText);
    const data = await response.json();

    // Handle API errors
    if (!response.ok) {
      console.error('Send Message Error:', {
        status: response.status,
        error: data.error || data,
        headers: {
          'www-authenticate': response.headers.get('www-authenticate'),
          'x-fb-request-id': response.headers.get('x-fb-request-id')
        }
      });
      return null;
    }

    console.log('✅ Message sent successfully:', data);
    return data;

  } catch (error) {
    console.error('Network error while sending message:', error.message);
    return null;
  }
};

const sendMedia = async (recipientId, mediaUrl, userId) => {
  const { pageAccessToken } = await getTokensForUser(userId);
  
  // Validate inputs
  if (!pageAccessToken) {
    console.error('Instagram page access token is missing');
    return null;
  }
  
  if (!recipientId || !mediaUrl) {
    console.error('Recipient ID and media URL are required');
    return null;
  }

  // Prevent sending messages to your own page ID
  // This prevents errors when processing echo messages
  if (recipientId === '17841474898287093') {
    console.log('Skipping media message to self (page ID)');
    return { skipped: true, reason: 'Cannot send message to self' };
  }

  try {
    console.log('Sending media to recipient:', recipientId);
    const response = await fetch(
      `https://graph.instagram.com/v21.0/me/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: {
            id: recipientId
          },
          message: {
            attachment: {
              type: 'image',
              payload: {
                url: mediaUrl
              }
            }
          },
          access_token: pageAccessToken
        })
      }
    );

    console.log('Response status:', response.status, response.statusText);
    const data = await response.json();

    // Handle API errors
    if (!response.ok) {
      console.error('Send Media Error:', {
        status: response.status,
        error: data.error || data,
        headers: {
          'www-authenticate': response.headers.get('www-authenticate'),
          'x-fb-request-id': response.headers.get('x-fb-request-id')
        }
      });
      return null;
    }

    console.log('✅ Media sent successfully:', data);
    return data;

  } catch (error) {
    console.error('Network error while sending media:', error.message);
    return null;
  }
};

const getAllInstagramPosts = async (req, res) => {
    const getUser = await getAuth(req);
    const userId = getUser.userId;
    const { accessToken } = await getTokensForUser(userId);
    console.log("accessToken", accessToken,userId);
    
    try {
        const response = await instagramClient.get(
            `https://graph.instagram.com/me/media?fields=id,caption,media_type,username,permalink&access_token=${accessToken}`
        );
        res.json(response.data); // Return as a route response
    } catch (error) {
        console.error('Error fetching Instagram posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
};

const getPostComments = async (mediaId, userId) => {
  if (!mediaId) {
    mediaId = '18068189869971923'; // Default for testing
  }
  
  const { pageAccessToken } = await getTokensForUser(userId);
  
  // Validate token exists
  if (!pageAccessToken) {
    console.error('Instagram access token is missing');
    return null;
  }
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${mediaId}/comments?fields=id,text,username,timestamp,replies&access_token=${pageAccessToken}`
    );
    
    console.log('Response status:', response.status, response.statusText);
    
    const data = await response.json();
    
    // Handle API errors
    if (!response.ok) {
      console.error('API Error:', {
        status: response.status,
        error: data.error || data,
        headers: {
          'www-authenticate': response.headers.get('www-authenticate'),
          'x-fb-request-id': response.headers.get('x-fb-request-id')
        }
      });
      return null;
    }
    
    console.log('Comments:', data.data);
    if (data.data && data.data.length > 0) {
      replyToComment(data.data[0].id, data.data[0].text, userId);
    }
    return data.data || [];
    
  } catch (error) {
    console.error('Network/Parse Error:', error.message);
    return null;
  }
};

const replyToComment = async (commentId, userComment, userId) => {
  const { pageAccessToken } = await getTokensForUser(userId);

  const replyText = await gemini(`You are a social media assistant for a trendy Instagram brand.

ROLE: Social media community manager
BRAND VOICE: Cool, casual, trendy, and authentic

TASK: Respond to the following Instagram comment in an engaging way.

GUIDELINES:
- Use casual, trendy language and appropriate slang
- Include relevant emojis (1-3 per response)
- Keep responses under 20 words
- Be friendly and conversational
- Match the energy of the comment
- Avoid sounding robotic or overly formal
- Sound like a real person, not a bot

COMMENT TO RESPOND TO:
"${userComment}"

RESPONSE:`
  )
  console.log('Replying to comment:', replyText);
  
  if (!pageAccessToken) {
    console.error('Instagram page access token is missing');
    return null;
  }
  
  if (!commentId || !replyText) {
    console.error('Comment ID and reply text are required');
    return null;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${commentId}/replies`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: replyText,
          access_token: pageAccessToken
        })
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Reply Error:', {
        status: response.status,
        error: data.error || data
      });
      return null;
    }
    
    console.log('✅ Reply sent successfully:', data);
    return data;
    
  } catch (error) {
    console.error('Network error while replying:', error.message);
    return null;
  }
};

const generateCaption = async (imageDescription, brandVoice = 'trendy and casual') => {
  try {
    const caption = await gemini(`You are a social media content creator for Instagram.

TASK: Create an engaging Instagram caption based on the image description.

IMAGE DESCRIPTION: "${imageDescription}"

BRAND VOICE: ${brandVoice}

GUIDELINES:
- Write a captivating caption that matches the brand voice
- Include relevant emojis (3-5 emojis)
- Add 3-5 relevant hashtags at the end
- Keep it under 150 characters for better engagement
- Make it engaging and shareable
- Include a call-to-action if appropriate

CAPTION:`);
    
    return caption.trim();
  } catch (error) {
    console.error('Error generating caption:', error.message);
    return '';
  }
};




module.exports = {
    getAllInstagramPosts,
    getPostComments,
    replyToComment,
    sendMessage,
    sendMedia,
    getInstagramUserId,
    createInstagramPost,
    createInstagramVideoPost,
    createInstagramCarousel,
    generateCaption
};