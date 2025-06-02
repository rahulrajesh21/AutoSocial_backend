const InstagramUtile = require('../utils/instagramUtils');

const getAllInstagramPosts = async () => {
  try{

    const getresponse = InstagramUtile();  
    return getresponse;

  }catch (error) {
    console.error('Error fetching Instagram posts:', error);
    throw error;
  }
};