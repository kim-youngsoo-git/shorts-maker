const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const voices = ['ko-KR-SunHi', 'ko-KR-InJoon', 'ko-KR-Hyunsu', 'ko-KR-BongJin', 'ko-KR-JiMin'];
const testDir = path.join(__dirname, 'temp/audible_check');
fs.ensureDirSync(testDir);

(async () => {
  console.log('🔍 Testing voice previews directly from localhost:3000...\n');
  for (const v of voices) {
    const previewUrl = `http://localhost:3000/api/preview-voice?voiceId=${v}&speed=1.00&bgmOption=none`;
    const res = await axios.get(previewUrl, { responseType: 'arraybuffer' });
    const filePath = path.join(testDir, `voice_${v}.mp3`);
    await fs.writeFile(filePath, Buffer.from(res.data));
    
    let info = '';
    try {
      execSync(`"${ffmpegPath}" -i "${filePath}" 2>&1`);
    } catch (e) {
      info = e.output ? e.output.join('\n') : '';
    }

    const durationMatch = info.match(/Duration:\s*(\d+:\d+:\d+\.\d+)/);
    const hzMatch = info.match(/(\d+\s*Hz)/);
    
    console.log(`🎙️ Voice [${v}]:`);
    console.log(`   - Output Size: ${res.data.length} bytes`);
    console.log(`   - Audio Duration: ${durationMatch ? durationMatch[1] : 'Unknown'}`);
    console.log(`   - Audio Sample Rate: ${hzMatch ? hzMatch[1] : 'Unknown'}`);
    console.log(`   - Saved File: ${filePath}\n`);
  }
})();
