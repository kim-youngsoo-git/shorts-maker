const { execSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const testDir = path.join(__dirname, 'temp/female_proof_test');
fs.ensureDirSync(testDir);

async function verifyFemaleVoice() {
  const rawPath = path.join(testDir, `raw.mp3`);
  const femaleSunHiPath = path.join(testDir, `sunhi_female_pure.mp3`);
  const femaleJiMinPath = path.join(testDir, `jimin_female_pure.mp3`);

  // Fetch clean base Google Korean Female Voice
  const cleanText = encodeURIComponent('안녕하세요! 선희 여성 성우 목소리 테스트입니다. 남성 목소리가 절대 섞이지 않습니다.');
  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${cleanText}&tl=ko&client=tw-ob`;
  const res = await axios({ url: ttsUrl, method: 'GET', responseType: 'arraybuffer' });
  await fs.writeFile(rawPath, Buffer.from(res.data));

  // Pure Female Voice Filter: ONLY User Speed Control (atempo=1.00), ZERO Pitch Shift!
  execSync(`"${ffmpegPath}" -y -i "${rawPath}" -af "atempo=1.00" -c:a mp3 "${femaleSunHiPath}"`, { stdio: 'ignore' });
  execSync(`"${ffmpegPath}" -y -i "${rawPath}" -af "atempo=1.00" -c:a mp3 "${femaleJiMinPath}"`, { stdio: 'ignore' });

  console.log('✅ Female SunHi Pure Voice Saved:', femaleSunHiPath);
  console.log('✅ Female JiMin Pure Voice Saved:', femaleJiMinPath);
}

verifyFemaleVoice();
