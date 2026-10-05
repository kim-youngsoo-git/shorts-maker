const { execSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const testDir = path.join(__dirname, 'temp/perfect_formula_test');
fs.ensureDirSync(testDir);

const VOICES_CONFIG = {
  'ko-KR-SunHi': { name: '선희 (밝은 여성)', pitchFactor: 1.0, bassGain: 0 },
  'ko-KR-InJoon': { name: '인준 (중후 남성)', pitchFactor: 0.76, bassGain: 8 },
  'ko-KR-Hyunsu': { name: '현수 (미성 남성)', pitchFactor: 0.86, bassGain: 4 },
  'ko-KR-BongJin': { name: '봉진 (파워 저음 남성)', pitchFactor: 0.68, bassGain: 12 },
  'ko-KR-JiMin': { name: '지민 (고음 여성)', pitchFactor: 1.12, bassGain: -2 }
};

async function testPerfectFormula(voiceId, speedMultiplier = 1.0) {
  const rawPath = path.join(testDir, `raw.mp3`);
  const outPath = path.join(testDir, `out_${voiceId}_s${speedMultiplier}.mp3`);

  if (!fs.existsSync(rawPath)) {
    const cleanText = encodeURIComponent('안녕하세요! 분양 홍보 쇼츠 영상 성우 목소리와 속도 독립 테스트입니다.');
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${cleanText}&tl=ko&client=tw-ob`;
    const res = await axios({ url: ttsUrl, method: 'GET', responseType: 'arraybuffer' });
    await fs.writeFile(rawPath, Buffer.from(res.data));
  }

  const cfg = VOICES_CONFIG[voiceId];
  const pitchFactor = cfg.pitchFactor;
  const newRate = Math.round(44100 * pitchFactor);

  const finalAtempo = ((1.0 / pitchFactor) * speedMultiplier).toFixed(4);

  const afFilter = `asetrate=${newRate},aresample=44100,atempo=${finalAtempo},equalizer=f=120:g=${cfg.bassGain}`;
  const cmd = `"${ffmpegPath}" -y -i "${rawPath}" -af "${afFilter}" -c:a mp3 "${outPath}"`;

  execSync(cmd, { stdio: 'ignore' });

  const stat = fs.statSync(outPath);
  console.log(`Voice [${cfg.name}] | Speed [${speedMultiplier}x] -> Output File Size: ${stat.size} bytes`);
}

(async () => {
  console.log('=== TEST 1: ALL VOICES AT SPEED 1.0x (File size should be IDENTICAL for all 5 voices!) ===');
  await testPerfectFormula('ko-KR-SunHi', 1.0);
  await testPerfectFormula('ko-KR-InJoon', 1.0);
  await testPerfectFormula('ko-KR-Hyunsu', 1.0);
  await testPerfectFormula('ko-KR-BongJin', 1.0);
  await testPerfectFormula('ko-KR-JiMin', 1.0);

  console.log('\n=== TEST 2: SPEED CONTROL FOR SAME VOICE (File size changes when speed changes!) ===');
  await testPerfectFormula('ko-KR-InJoon', 0.80);
  await testPerfectFormula('ko-KR-InJoon', 0.90);
  await testPerfectFormula('ko-KR-InJoon', 1.00);
  await testPerfectFormula('ko-KR-InJoon', 1.15);
})();
