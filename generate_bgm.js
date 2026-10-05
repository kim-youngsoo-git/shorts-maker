const { execSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs-extra');
const path = require('path');

const bgmDir = path.join(__dirname, 'assets/bgm');
fs.ensureDirSync(bgmDir);

console.log('Generating BGM audio files using sine filter...');

try {
  // 1. Upbeat BGM (440Hz pulse)
  const upbeatPath = path.join(bgmDir, 'upbeat.mp3');
  execSync(`"${ffmpegPath}" -y -f lavfi -i sine=frequency=523.25:duration=45 -c:a mp3 "${upbeatPath}"`, { stdio: 'ignore' });

  // 2. Luxury BGM (329.63Hz warm pulse)
  const luxuryPath = path.join(bgmDir, 'luxury.mp3');
  execSync(`"${ffmpegPath}" -y -f lavfi -i sine=frequency=329.63:duration=45 -c:a mp3 "${luxuryPath}"`, { stdio: 'ignore' });

  // 3. Calm BGM (261.63Hz soft ambient pulse)
  const calmPath = path.join(bgmDir, 'calm.mp3');
  execSync(`"${ffmpegPath}" -y -f lavfi -i sine=frequency=261.63:duration=45 -c:a mp3 "${calmPath}"`, { stdio: 'ignore' });

  console.log('✅ BGM Tracks Generated Successfully in:', bgmDir);
} catch (err) {
  console.error('Failed to generate BGM:', err.message);
}
