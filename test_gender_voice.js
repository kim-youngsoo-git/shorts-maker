const { execSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const testDir = path.join(__dirname, 'temp/gender_test');
fs.ensureDirSync(testDir);

const VOICE_PROFILES = [
  { id: 'ko-KR-SunHi', name: '선희 (밝고 세련된 여성)', filter: 'equalizer=f=2500:g=3' },
  { id: 'ko-KR-InJoon', name: '인준 (명확하고 중후한 남성)', filter: 'asetrate=44100*0.64,aresample=44100,atempo=1.56,equalizer=f=120:width_type=h:width=80:g=8' },
  { id: 'ko-KR-Hyunsu', name: '현수 (젊고 친근한 미성 남성)', filter: 'asetrate=44100*0.75,aresample=44100,atempo=1.33,equalizer=f=200:width_type=h:width=100:g=5' },
  { id: 'ko-KR-BongJin', name: '봉진 (강렬하고 묵직한 파워 저음 남성)', filter: 'asetrate=44100*0.56,aresample=44100,atempo=1.78,equalizer=f=90:width_type=h:width=60:g=10' },
  { id: 'ko-KR-JiMin', name: '지민 (트렌디하고 감성적인 여성)', filter: 'asetrate=44100*1.12,aresample=44100,atempo=0.89,equalizer=f=3000:g=5' }
];

async function generateTestVoice(profile, speed = 1.0) {
  const rawPath = path.join(testDir, `raw.mp3`);
  const outPath = path.join(testDir, `voice_${profile.id}.mp3`);

  if (!fs.existsSync(rawPath)) {
    const cleanText = encodeURIComponent('안녕하세요! 분양 홍보 쇼츠 영상 성우 목소리 변경 테스트입니다.');
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${cleanText}&tl=ko&client=tw-ob`;
    const res = await axios({ url: ttsUrl, method: 'GET', responseType: 'arraybuffer' });
    await fs.writeFile(rawPath, Buffer.from(res.data));
  }

  // Combine gender shift filter with user reading speed
  const afFilter = `${profile.filter},atempo=${speed}`;
  const cmd = `"${ffmpegPath}" -y -i "${rawPath}" -af "${afFilter}" -c:a mp3 "${outPath}"`;

  execSync(cmd, { stdio: 'ignore' });
  const stat = fs.statSync(outPath);
  console.log(`✅ ${profile.name} [${profile.id}] -> Generated Size: ${stat.size} bytes`);
}

(async () => {
  console.log('Testing Distinct Male & Female Voices Generation...');
  for (const p of VOICE_PROFILES) {
    await generateTestVoice(p, 1.0);
  }
})();
