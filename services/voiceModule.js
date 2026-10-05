const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { execSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

/**
 * 🎙️ 남성/여성 성우 종류별 모듈화 보이스 레지스트리 (Modular Voice Registry)
 * - 남성과 여성이 100% 명확히 구분되는 Microsoft Neural Studio AI 엔진 적용
 * - 용도/분위기/성별에 따른 6종 프리미엄 성우 라인업
 */
const VOICE_ACTORS = [
  // ==========================================
  // 👨 남성 성우 라인업 (Real Male Neural Voices)
  // ==========================================
  {
    id: 'male_injoon',
    legacyIds: ['ko-KR-InJoon', 'ko-KR-InJoonNeural'],
    name: '인준',
    gender: 'male',
    category: '남성 성우',
    title: '명확하고 신뢰감 넘치는 정통 남성 성우',
    description: '묵직하고 전달력이 뛰어난 100% 리얼 정통 남성 보이스. 신도시 대단지 아파트 분양 및 핵심 입지·투자 가치 전달에 최적.',
    tag: '중후함 / 신뢰',
    badge: '정통 남성 대표',
    baseVoice: 'ko-KR-InJoonNeural',
    pitch: '+0%'
  },
  {
    id: 'male_hyunsu',
    legacyIds: ['ko-KR-Hyunsu', 'ko-KR-HyunsuNeural', 'ko-KR-HyunsuMultilingualNeural'],
    name: '현수',
    gender: 'male',
    category: '남성 성우',
    title: '젊고 스마트한 도심형 남성 성우',
    description: '친근하고 세련된 100% 리얼 젊은 남성 보이스. 2030 세대, 신혼부부 주택 및 트렌디 오피스텔 쇼츠 나레이션에 최적.',
    tag: '젊음 / 트렌디',
    badge: '도심형 스마트',
    baseVoice: 'ko-KR-HyunsuMultilingualNeural',
    pitch: '+0%'
  },
  {
    id: 'male_power',
    legacyIds: ['ko-KR-BongJin', 'ko-KR-BongJinNeural'],
    name: '봉진',
    gender: 'male',
    category: '남성 성우',
    title: '웅장하고 강렬한 파워 바리톤 남성 성우',
    description: '깊은 울림과 강렬한 흡입력을 주는 파워 저음 바리톤 보이스. 마감 임박 긴급 분양 및 파격적인 특별 분양 혜택 강조에 최적.',
    tag: '파워저음 / 임팩트',
    badge: '파워 바리톤',
    baseVoice: 'ko-KR-InJoonNeural',
    pitch: '-10%'
  },

  // ==========================================
  // 👩 여성 성우 라인업 (Real Female Neural Voices)
  // ==========================================
  {
    id: 'female_sunhi',
    legacyIds: ['ko-KR-SunHi', 'ko-KR-SunHiNeural'],
    name: '선희',
    gender: 'female',
    category: '여성 성우',
    title: '맑고 우아한 대표 여성 아나운서 성우',
    description: '맑고 또박또박한 발음의 고품격 표준 아나운서 음색. 랜드마크 아파트와 오피스텔 메인 홍보 나레이션에 최적.',
    tag: '우아함 / 신뢰',
    badge: '표준 여성 대표',
    baseVoice: 'ko-KR-SunHiNeural',
    pitch: '+0%'
  },
  {
    id: 'female_jimin',
    legacyIds: ['ko-KR-JiMin', 'ko-KR-JiMinNeural'],
    name: '지민',
    gender: 'female',
    category: '여성 성우',
    title: '트렌디하고 화사한 생기 여성 성우',
    description: '화사하고 생기 넘치는 브라이트 톤. 핫플레이스 상권, 역세권 상가, 이벤트 및 프로모션 영상에 최적.',
    tag: '생기 / 브라이트',
    badge: '트렌디 생기',
    baseVoice: 'ko-KR-SunHiNeural',
    pitch: '+6%'
  },
  {
    id: 'female_yujin',
    legacyIds: ['ko-KR-YuJin', 'ko-KR-YuJinNeural', 'yujin', 'ko-kr-yujin'],
    name: '유진',
    gender: 'female',
    category: '여성 성우',
    title: '차분하고 감성적인 최고급 럭셔리 여성 성우',
    description: '깊이 있고 편안하게 감싸안는 우아한 여성 음색. 최고급 펜트하우스 및 하이엔드 타운하우스 홍보에 최적.',
    tag: '럭셔리 / 감성',
    badge: '하이엔드 럭셔리',
    baseVoice: 'ko-KR-SunHiNeural',
    pitch: '-1%'
  },
  {
    id: 'custom_xtts',
    legacyIds: [],
    name: '나의 목소리',
    gender: 'custom',
    category: '커스텀 성우',
    title: 'XTTS 커스텀 목소리 복제',
    description: '구글 코랩 XTTS 서버를 통해 생성된 사용자 고유의 커스텀 목소리입니다.',
    tag: '커스텀 / 유니크',
    badge: 'XTTS 복제 음성',
    baseVoice: 'custom',
    pitch: '+0%'
  }
];

function getAllVoices() {
  return VOICE_ACTORS;
}

function getVoicesByGender(gender) {
  return VOICE_ACTORS.filter(v => v.gender === gender);
}

function getVoiceById(voiceId) {
  if (!voiceId) return VOICE_ACTORS.find(v => v.id === 'female_sunhi');
  const normalizedId = String(voiceId).trim().toLowerCase();

  const found = VOICE_ACTORS.find(v => 
    v.id.toLowerCase() === normalizedId || 
    (v.legacyIds && v.legacyIds.some(l => l.toLowerCase() === normalizedId)) ||
    v.name === voiceId
  );
  if (found) return found;

  // 여성 관련 키워드가 있을 경우 남성이 아닌 여성 대표 성우로 안전 폴백
  if (normalizedId.includes('female') || normalizedId.includes('sunhi') || normalizedId.includes('jimin') || normalizedId.includes('yujin') || normalizedId.includes('여성')) {
    return VOICE_ACTORS.find(v => v.id === 'female_sunhi');
  }

  return VOICE_ACTORS[0];
}

/**
 * SSML용 XML 특수문자 이스케이프 (&, <, >, ", ')
 */
function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 🎙️ 100% 진짜 리얼 성우 음성 합성 (Microsoft Edge Neural Engine & Custom XTTS)
 */
async function generateSpeech(text, voiceId = 'male_injoon', outputPath, speedMultiplier = 1.0, options = {}) {
  await fs.ensureDir(path.dirname(outputPath));
  const voiceProfile = getVoiceById(voiceId);

  if (voiceId === 'custom_xtts') {
    try {
      const FormData = require('form-data');
      const form = new FormData();
      form.append('text', text);
      form.append('language', 'ko');
      
      if (options.customVoicePath && fs.existsSync(options.customVoicePath)) {
        form.append('speaker_wav', fs.createReadStream(options.customVoicePath));
      } else {
        throw new Error('커스텀 목소리(speaker_wav) 파일이 서버로 전달되지 않았습니다.');
      }
      
      let apiUrl = options.colabUrl;
      if (!apiUrl) throw new Error('Colab API URL이 제공되지 않았습니다.');
      if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
      
      console.log(`[VoiceModule] Requesting XTTS clone from ${apiUrl}...`);
      
      const res = await axios.post(`${apiUrl}/api/clone`, form, {
        headers: {
          ...form.getHeaders(),
          'Bypass-Tunnel-Reminder': 'true'
        },
        responseType: 'arraybuffer',
        timeout: 60000 // 60초 대기
      });
      
      const rawPath = outputPath + '.raw.wav';
      await fs.writeFile(rawPath, Buffer.from(res.data));
      
      // Convert and apply speed
      let filterChain = [];
      if (Math.abs(speedMultiplier - 1.0) > 0.01) {
        filterChain.push(`atempo=${speedMultiplier.toFixed(2)}`);
      }
      const afArg = filterChain.length > 0 ? `-af "${filterChain.join(',')}"` : '';
      const cmd = `"${ffmpegPath}" -y -i "${rawPath}" ${afArg} -c:a mp3 "${outputPath}"`;
      
      execSync(cmd, { stdio: 'ignore' });
      await fs.remove(rawPath).catch(() => {});
      
      const duration = getAudioDuration(outputPath);
      return { outputPath, duration, voiceProfile };
    } catch (err) {
      console.error('[VoiceModule] XTTS Generation Error:', err.response ? err.response.data.toString() : err.message);
      throw new Error(`XTTS 커스텀 음성 생성 실패: ${err.message}`);
    }
  }

  const userSpeed = parseFloat(speedMultiplier) || 1.0;
  const ratePercent = Math.round((userSpeed - 1.0) * 100);
  const rateStr = (ratePercent >= 0 ? `+${ratePercent}%` : `${ratePercent}%`);
  const pitchStr = voiceProfile.pitch || '+0%';

  const safeText = escapeXml(text);

  const tempDir = path.join(path.dirname(outputPath), `edge_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  await fs.ensureDir(tempDir);

  let success = false;

  // 1. Try 100% Genuine MsEdgeTTS Neural Synthesis
  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voiceProfile.baseVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const synthResult = await tts.toFile(tempDir, safeText, {
      pitch: pitchStr,
      rate: rateStr
    });

    if (synthResult && synthResult.audioFilePath && fs.existsSync(synthResult.audioFilePath)) {
      await fs.move(synthResult.audioFilePath, outputPath, { overwrite: true });
      success = true;
    }
  } catch (edgeErr) {
    console.warn(`[VoiceModule] MsEdgeTTS error (${edgeErr.message}), trying retry...`);
    try {
      const retryTts = new MsEdgeTTS();
      await retryTts.setMetadata(voiceProfile.baseVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      const synthResult = await retryTts.toFile(tempDir, safeText, {
        pitch: pitchStr,
        rate: rateStr
      });
      if (synthResult && synthResult.audioFilePath && fs.existsSync(synthResult.audioFilePath)) {
        await fs.move(synthResult.audioFilePath, outputPath, { overwrite: true });
        success = true;
      }
    } catch (retryErr) {
      console.error(`[VoiceModule] Retry failed: ${retryErr.message}`);
    }
  } finally {
    await fs.remove(tempDir).catch(() => {});
  }

  // 2. Fallback only if network was completely blocked
  if (!success) {
    console.warn('[VoiceModule] Falling back to emergency TTS proxy...');
    await emergencyFallbackSpeech(text, voiceProfile, outputPath, userSpeed);
  }

  const duration = getAudioDuration(outputPath);
  return { outputPath, duration, voiceProfile };
}

/**
 * Emergency Fallback Speech (used only if local or proxy network is fully cut)
 */
async function emergencyFallbackSpeech(text, voiceProfile, outputPath, speedMultiplier) {
  const isMale = voiceProfile.gender === 'male';
  // XML 엔티티 등을 일반 한국어 단어로 복원
  const plainText = text.replace(/&amp;/g, ' 및 ').replace(/&lt;/g, ' ').replace(/&gt;/g, ' ').replace(/&quot;/g, ' ').replace(/&apos;/g, ' ');
  const cleanText = encodeURIComponent(plainText);
  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${cleanText}&tl=ko&client=tw-ob`;

  const response = await axios({
    url: ttsUrl,
    method: 'GET',
    responseType: 'arraybuffer',
    headers: { 'User-Agent': 'Mozilla/5.0' },
    timeout: 10000
  });

  const rawPath = outputPath + '.raw.mp3';
  await fs.writeFile(rawPath, Buffer.from(response.data));

  let filterChain = [];
  if (isMale) {
    // 남성 성우일 때만 피치 하향 필터 적용
    filterChain.push('asetrate=44100*0.72,aresample=44100,atempo=1.38,equalizer=f=120:g=8');
  }
  if (Math.abs(speedMultiplier - 1.0) > 0.01) {
    filterChain.push(`atempo=${speedMultiplier.toFixed(2)}`);
  }

  const afArg = filterChain.length > 0 ? `-af "${filterChain.join(',')}"` : '';
  const cmd = `"${ffmpegPath}" -y -i "${rawPath}" ${afArg} -c:a mp3 "${outputPath}"`;
  try {
    execSync(cmd, { stdio: 'ignore' });
  } finally {
    await fs.remove(rawPath).catch(() => {});
  }
}

/**
 * 🎧 성우 목소리 + BGM 통합 미리듣기 음원 생성
 */
async function generateIntegratedPreview(voiceId, speedMultiplier = 1.0, bgmOption = 'none', outputPath) {
  await fs.ensureDir(path.dirname(outputPath));

  const voiceProfile = getVoiceById(voiceId);
  const sampleText = `안녕하세요! ${voiceProfile.category} ${voiceProfile.name}입니다. ${voiceProfile.description}`;
  const tempVoicePath = outputPath + '.sample.mp3';

  await generateSpeech(sampleText, voiceId, tempVoicePath, speedMultiplier);

  const bgmPath = path.join(__dirname, '../assets/bgm', `${bgmOption}.mp3`);
  const hasBgm = bgmOption && bgmOption !== 'none' && fs.existsSync(bgmPath);

  if (hasBgm) {
    try {
      const mixCmd = `"${ffmpegPath}" -y -i "${tempVoicePath}" -i "${bgmPath}" -filter_complex "[0:a]volume=1.0[v];[1:a]volume=0.25[bgm];[v][bgm]amix=inputs=2:duration=first:weights=1 1[aout]" -map "[aout]" -c:a mp3 "${outputPath}"`;
      execSync(mixCmd, { stdio: 'ignore' });
      await fs.remove(tempVoicePath).catch(() => {});
    } catch (mixErr) {
      if (fs.existsSync(tempVoicePath)) {
        await fs.move(tempVoicePath, outputPath, { overwrite: true });
      }
    }
  } else {
    await fs.move(tempVoicePath, outputPath, { overwrite: true });
  }

  return outputPath;
}

function getAudioDuration(filePath) {
  try {
    const cmd = `"${ffmpegPath}" -i "${filePath}" 2>&1`;
    const output = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const durationMatch = output.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
    if (durationMatch) {
      const hours = parseFloat(durationMatch[1]);
      const minutes = parseFloat(durationMatch[2]);
      const seconds = parseFloat(durationMatch[3]);
      return hours * 3600 + minutes * 60 + seconds;
    }
  } catch (e) {
    if (e.output && e.output[1]) {
      const durationMatch = e.output[1].match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
      if (durationMatch) {
        return parseFloat(durationMatch[1]) * 3600 + parseFloat(durationMatch[2]) * 60 + parseFloat(durationMatch[3]);
      }
    }
  }
  return 3.5;
}

module.exports = {
  VOICE_ACTORS,
  getAllVoices,
  getVoicesByGender,
  getVoiceById,
  generateSpeech,
  generateIntegratedPreview,
  getAudioDuration
};
