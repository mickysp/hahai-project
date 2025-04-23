import axios from 'axios';
import ipAddress from './ip';

export const compareImages = async (image1Uri, image2Uri) => {
  console.log('Starting image comparison...');
  console.log('Image 1 URI:', image1Uri);
  console.log('Image 2 URI:', image2Uri);

  try {
    const response = await axios.post(`${`https://localhost:5001`}/compare-images`, {
      image1: image1Uri,
      image2: image2Uri,
    });
    console.log('Comparison response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error comparing images:', error);
    throw error;
  }
};

// ฟังก์ชันดึงโพสต์ที่เกี่ยวข้อง
export const fetchMatchingPosts = async (labels) => {
  console.log('Fetching matching posts with labels:', labels);

  try {
    const response = await axios.get(`${BASE_URL}/blogs`, {
      params: { labels: labels.map(label => label.description).join(',') },
    });
    if (response.data && response.data.posts) {
      console.log('Fetched posts:', response.data.posts);
      return response.data.posts;
    } else {
      console.log("Invalid response format:", response.data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching related posts:', error);
    return [];
  }
};