/**
 * Scene Splitter & Prompt Generator for Promotional Shorts
 */

function splitScriptIntoScenes(scriptText) {
  // Clean text and split by major punctuation or newlines
  const rawSentences = scriptText
    .split(/(?<=[.!?\n])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  let sentences = [];

  // Group sentences into ideal scene lengths (approx 15~35 chars per scene)
  let currentChunk = '';
  for (const sentence of rawSentences) {
    if (currentChunk.length + sentence.length <= 40) {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    } else {
      if (currentChunk) sentences.push(currentChunk);
      currentChunk = sentence;
    }
  }
  if (currentChunk) sentences.push(currentChunk);

  // If too few scenes, break by comma or phrase
  if (sentences.length < 4 && scriptText.length > 50) {
    const subParts = scriptText.split(/[,.!\n]+/).map(s => s.trim()).filter(s => s.length > 5);
    if (subParts.length >= 4) {
      sentences = subParts;
    }
  }

  // Ensure scenes are between 4 and 8
  const scenes = sentences.slice(0, 8).map((text, idx) => {
    return {
      sceneIndex: idx + 1,
      text: text, // Text for Voice TTS
      subtitle: text, // Subtitle on Video
      prompt: extractVisualPrompt(text, idx + 1, sentences.length)
    };
  });

  return scenes;
}

/**
 * Generates high quality visual prompt keywords based on promotional script text
 */
function extractVisualPrompt(text, sceneIndex, totalScenes) {
  // Real estate / promotion keywords matching dictionary
  const keywordsMap = [
    { key: ['오피스텔', '아파트', '분양', '건물', '단지'], prompt: 'luxurious modern high rise apartment architecture building exterior, ultra high resolution, 8k, photorealistic' },
    { key: ['인테리어', '거실', '방', '공간', '구조'], prompt: 'modern luxurious apartment interior design, spacious living room, stylish furniture, warm cozy lighting, 8k, photorealistic' },
    { key: ['뷰', '전망', '조망', '한강', '시티'], prompt: 'breathtaking city skyline view from high floor balcony, sunny day, golden hour lighting, cinematic aerial perspective, 8k' },
    { key: ['교통', '역세권', '입지', '중심'], prompt: 'modern city street view near subway station, bustling clean urban landscape, 8k photo' },
    { key: ['프리미엄', '투자', '가치', '혜택', '분양가'], prompt: 'sleek modern luxury lounge, real estate investment concept, high-end presentation, golden ratio lighting, 8k' },
    { key: ['문의', '상담', '전화', '마감', '시작'], prompt: 'welcome desk luxury reception area, modern office, elegant design, inviting atmosphere, 8k' }
  ];

  for (const item of keywordsMap) {
    if (item.key.some(k => text.includes(k))) {
      return item.prompt;
    }
  }

  // Generic fallback prompts based on scene progress
  const fallbacks = [
    'luxurious modern architectural apartment exterior building, sunny sky, 8k photorealistic',
    'elegant spacious modern apartment living room interior, stylish design, 8k',
    'modern kitchen and dining space with premium finishes, warm lighting, 8k photo',
    'panoramic view of vibrant modern city skyline, bright clear day, cinematic, 8k',
    'luxury building lobby lounge with elegant marble floor, high-end aesthetic, 8k',
    'scenic view of urban park and modern residential towers, beautiful day, 8k'
  ];

  return fallbacks[(sceneIndex - 1) % fallbacks.length];
}

module.exports = {
  splitScriptIntoScenes
};
