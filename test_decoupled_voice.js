const { execSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const testDir = path.join(__dirname, 'temp/decoupled_test');
fs.ensureDirSync(testDir);

// Pitch Shift semitones relative to base voice (0 = original female, -5 = deep male, -3 = young male, -7 = power male, +2 = high female)
const VOICES_CONFIG = {
  'ko-KR-SunHi': { name: '선희 (여성)', pitchSemitones: 0, bassGain: 0 },
  'ko-KR-InJoon': { name: '인준 (중후 남성)', pitchSemitones: -5.5, bassGain: 8 },
  'ko-KR-Hyunsu': { name: '현수 (미성 남성)', pitchSemitones: -3.5, bassGain: 4 },
  'ko-KR-BongJin': { name: '봉진 (파워 저음 남성)', pitchSemitones: -7.5, bassGain: 12 },
  'ko-KR-JiMin': { name: '지민 (고음 여성)', pitchSemitones: 2.0, bassGain: -2 }
};

async function testDecoupledVoice(voiceId, speed = 1.0) {
  const rawPath = path.join(testDir, `raw.mp3`);
  const outPath = path.join(testDir, `out_${voiceId}_s${speed}.mp3`);

  if (!fs.existsSync(rawPath)) {
    const cleanText = encodeURIComponent('안녕하세요! 분양 홍보 쇼츠 영상 성우 목소리와 속도 독립 테스트입니다.');
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${cleanText}&tl=ko&client=tw-ob`;
    const res = await axios({ url: ttsUrl, method: 'GET', responseType: 'arraybuffer' });
    await fs.writeFile(rawPath, Buffer.from(res.data));
  }

  const cfg = VOICES_CONFIG[voiceId];
  
  // Calculate pitch frequency multiplier without changing duration!
  // pitch_factor = 2^(semitones / 12)
  const pitchFactor = Math.pow(2, cfg.pitchSemitones / 12).toFixed(4);

  // FFmpeg Rubberband or Pitch filter for 100% duration-preserving pitch shift!
  let afFilter = '';
  if (cfg.pitchSemitones !== 0) {
    afFilter = `rubberband=pitch=${pitchFactor}:pitchmode=quality,equalizer=f=100:g=${cfg.bassGain}`;
  } else {
    afFilter = `equalizer=f=2500:g=3`;
  }

  // Speed filter applied separately!
  if (speed !== 1.0) {
    afFilter += `,atempo=${speed}`;
  }

  const cmd = `"${ffmpegPath}" -y -i "${rawPath}" -af "${afFilter}" -c:a mp3 "${outPath}"`;

  try {
    execSync(cmd, { stdio: 'ignore' });
  } catch (e) {
    // Fallback if rubberband not compiled: use pitch shift filter
    const pitchRatio = cfg.pitchSemitones;
    const fallbackAf = `pitch=pitch_shift=${pitchRatio},equalizer=f=100:g=${cfg.bassGain},atempo=${speed}`;
    execSync(`"${ffmpegPath}" -y -i "${rawPath}" -af "${fallbackAf}" -c:a mp3 "${outPath}"`, { stdio: 'ignore' });
  }

  const duration = getAudioDuration(outPath);
  console.log(`Voice [${cfg.name}] | Speed [${speed}x] -> Audio Duration: ${duration.toFixed(2)}s`);
}

function getAudioDuration(filePath) {
  try {
    const cmd = `"${ffmpegPath}" -i "${filePath}" 2>&1`;
    const output = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const durationMatch = output.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
    if (durationMatch) {
      return parseFloat(durationMatch[1]) * 3600 + parseFloat(durationMatch[2]) * 60 + parseFloat(durationMatch[3]);
    }
  } catch (e) {}
  return 0;
}

(async () => {
  console.log('Testing Decoupled Voice Tone & Speed (Duration should stay identical across different voices at speed 1.0x)...');
  await testDecoupledVoice('ko-KR-SunHi', 1.0);
  await testDecoupledVoice('ko-KR-InJoon', 1.0);
  await testDecoupledVoice('ko-KR-Hyunsu', 1.0);
  await testDecoupledVoice('ko-KR-BongJin', 1.0);
  await testDecoupledVoice('ko-KR-JiMin', 1.0);

  console.log('\nTesting Speed Control for Same Voice (Duration should change when speed changes)...');
  await testDecoupledVoice('ko-KR-InJoon', 0.80);
  await testDecoupledVoice('ko-KR-InJoon', 1.00);
  await testDecoupledVoice('ko-KR-InJoon', 1.15);
})();
