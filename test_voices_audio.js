const { execSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const testDir = path.join(__dirname, 'temp/voice_test');
fs.ensureDirSync(testDir);

const VOICES_CONFIG = {
  'ko-KR-SunHi': { name: '선희', pitchFactor: 1.0 },
  'ko-KR-InJoon': { name: '인준', pitchFactor: 0.75 },
  'ko-KR-Hyunsu': { name: '현수', pitchFactor: 0.84 },
  'ko-KR-BongJin': { name: '봉진', pitchFactor: 0.68 },
  'ko-KR-JiMin': { name: '지민', pitchFactor: 1.12 }
};

async function testVoiceGeneration(voiceId, speed = 0.95) {
  const rawPath = path.join(testDir, `raw_${voiceId}.mp3`);
  const finalPath = path.join(testDir, `final_${voiceId}.mp3`);

  // 1. Fetch Raw TTS
  const cleanText = encodeURIComponent('안녕하세요! 분양 홍보 쇼츠 영상 성우 목소리입니다.');
  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${cleanText}&tl=ko&client=tw-ob`;

  const res = await axios({ url: ttsUrl, method: 'GET', responseType: 'arraybuffer' });
  await fs.writeFile(rawPath, Buffer.from(res.data));

  // 2. Pitch & Speed Shift Filter Formula
  const cfg = VOICES_CONFIG[voiceId] || VOICES_CONFIG['ko-KR-SunHi'];
  const pitchFactor = cfg.pitchFactor;
  const newRate = Math.round(44100 * pitchFactor);
  const tempoCompensate = (1 / pitchFactor * speed).toFixed(3);

  const afFilter = `asetrate=${newRate},aresample=44100,atempo=${tempoCompensate}`;
  const cmd = `"${ffmpegPath}" -y -i "${rawPath}" -af "${afFilter}" -c:a mp3 "${finalPath}"`;

  execSync(cmd, { stdio: 'ignore' });
  console.log(`✅ Generated Voice for ${cfg.name} (${voiceId}) -> ${finalPath}`);
}

(async () => {
  for (const vId of Object.keys(VOICES_CONFIG)) {
    await testVoiceGeneration(vId);
  }
})();
