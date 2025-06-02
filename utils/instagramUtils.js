require("dotenv").config();
const axios = require('axios');
const { gemini } = require("./geminiUtils");
const instagramClient = axios;

const getAllInstagramPosts = async (req, res) => {
    const instagramToken = process.env.INSTAGRAM_TOKEN;
    try {
        const response = await instagramClient.get(
            `https://graph.instagram.com/me/media?fields=id,caption,media_type,permalink&access_token=${instagramToken}`
        );
        res.json(response.data); // Return as a route response
    } catch (error) {
        console.error('Error fetching Instagram posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
};

const getPostComments = async () => {
  const mediaId = '18068189869971923';
  const pageAccessToken = process.env.INSTAGRAM_PAGE;
  
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
    replyToComment(data.data[0].id,data.data[0].text); 
    return data.data || [];
    
  } catch (error) {
    console.error('Network/Parse Error:', error.message);
    return null;
  }
};

const replyToComment = async (commentId,userComment) => {
  const pageAccessToken = process.env.INSTAGRAM_PAGE;


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



module.exports = {
    getAllInstagramPosts,
    getPostComments
};