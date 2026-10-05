const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

/**
 * Generate and download 9:16 vertical image for a scene
 */
async function generateSceneImage(prompt, outputPath, width = 1080, height = 1920) {
  await fs.ensureDir(path.dirname(outputPath));

  // Sanitize prompt for URL
  const cleanPrompt = encodeURIComponent(prompt + ', vertical orientation, 9:16 aspect ratio, high quality, photorealistic, no text');
  
  // Try Pollinations AI Service first for AI-generated 9:16 visual
  const seed = Math.floor(Math.random() * 1000000);
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;

  try {
    const response = await axios({
      url: pollinationsUrl,
      method: 'GET',
      responseType: 'arraybuffer',
      timeout: 20000
    });

    if (response.data && response.data.length > 5000) {
      await fs.writeFile(outputPath, Buffer.from(response.data));
      return outputPath;
    }
  } catch (err) {
    console.warn('Pollinations AI image fetch warning, falling back to Unsplash stock:', err.message);
  }

  // Fallback to Unsplash High Quality Architectural Stock Photos
  const stockTopics = ['apartment', 'interior', 'luxury-living', 'building', 'city-skyline', 'architecture'];
  const topic = stockTopics[Math.floor(Math.random() * stockTopics.length)];
  const fallbackUrl = `https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=${width}&h=${height}&q=85`;

  try {
    const response = await axios({
      url: fallbackUrl,
      method: 'GET',
      responseType: 'arraybuffer',
      timeout: 10000
    });
    await fs.writeFile(outputPath, Buffer.from(response.data));
    return outputPath;
  } catch (fallbackErr) {
    throw new Error('Failed to download scene image: ' + fallbackErr.message);
  }
}

module.exports = {
  generateSceneImage
};
