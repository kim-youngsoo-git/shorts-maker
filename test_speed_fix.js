const { execSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const testDir = path.join(__dirname, 'temp/speed_test');
fs.ensureDirSync(testDir);

async function testSpeed(speedVal) {
  const rawPath = path.join(testDir, `raw.mp3`);
  const outPath = path.join(testDir, `out_speed_${speedVal}.mp3`);

  if (!fs.existsSync(rawPath)) {
    const cleanText = encodeURIComponent('안녕하세요! 분양 홍보 쇼츠 영상 성우 목소리와 속도 조절 테스트입니다.');
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${cleanText}&tl=ko&client=tw-ob`;
    const res = await axios({ url: ttsUrl, method: 'GET', responseType: 'arraybuffer' });
    await fs.writeFile(rawPath, Buffer.from(res.data));
  }

  // Pure atempo filter (no sample rate corruption!)
  const afFilter = `atempo=${speedVal}`;
  const cmd = `"${ffmpegPath}" -y -i "${rawPath}" -af "${afFilter}" -c:a mp3 "${outPath}"`;
  execSync(cmd, { stdio: 'ignore' });

  const stat = fs.statSync(outPath);
  console.log(`Speed Option [${speedVal}x] -> Output File Size: ${stat.size} bytes`);
}

(async () => {
  console.log('Testing Audio Speed Multipliers...');
  await testSpeed(0.80);
  await testSpeed(0.90);
  await testSpeed(1.00);
  await testSpeed(1.15);
})();
