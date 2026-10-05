const { execSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const testDir = path.join(__dirname, 'temp/nasal_fix_test');
fs.ensureDirSync(testDir);

async function testNasalFix() {
  const rawPath = path.join(testDir, `raw.mp3`);
  const oldPath = path.join(testDir, `old_nasal_female.mp3`);
  const newCleanPath = path.join(testDir, `new_clean_female.mp3`);

  // Fetch clean base audio
  const cleanText = encodeURIComponent('안녕하세요! 분양 홍보 쇼츠 영상 성우 목소리 코맹맹이 소리 제거 테스트입니다.');
  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${cleanText}&tl=ko&client=tw-ob`;
  const res = await axios({ url: ttsUrl, method: 'GET', responseType: 'arraybuffer' });
  await fs.writeFile(rawPath, Buffer.from(res.data));

  // 1. Old Filter (Caused Nasal sound: equalizer f=2500 boost)
  const oldFilter = `equalizer=f=2500:g=4,atempo=1.00`;
  execSync(`"${ffmpegPath}" -y -i "${rawPath}" -af "${oldFilter}" -c:a mp3 "${oldPath}"`, { stdio: 'ignore' });

  // 2. New Pure Filter (Zero nasal boost, 100% crisp & clear voice)
  const newFilter = `highpass=f=80,atempo=1.00`;
  execSync(`"${ffmpegPath}" -y -i "${rawPath}" -af "${newFilter}" -c:a mp3 "${newCleanPath}"`, { stdio: 'ignore' });

  console.log('✅ Old Nasal Audio Created:', oldPath);
  console.log('✅ New Clean Crystal Voice Created:', newCleanPath);
}

testNasalFix();
