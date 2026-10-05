const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');

const { VOICES, generateSpeech, generateIntegratedPreview } = require('./services/ttsService');
const { splitScriptIntoScenes } = require('./services/sceneSplitter');
const { generateSceneImage } = require('./services/visualService');
const { renderShortsVideo } = require('./services/videoRenderer');

const app = express();
const PORT = process.env.PORT || 3000;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'photo_' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/output', express.static(path.join(__dirname, 'output')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/temp', express.static(path.join(__dirname, 'temp')));

fs.ensureDirSync(path.join(__dirname, 'output'));
fs.ensureDirSync(path.join(__dirname, 'uploads'));
fs.ensureDirSync(path.join(__dirname, 'temp'));
fs.ensureDirSync(path.join(__dirname, 'assets/bgm'));

const generationProgress = {};

app.get('/api/voices', (req, res) => {
  res.json({
    success: true,
    voices: VOICES,
    maleVoices: VOICES.filter(v => v.gender === 'male'),
    femaleVoices: VOICES.filter(v => v.gender === 'female')
  });
});

/**
 * GET /api/preview-voice - Integrated Audio Preview (Selected Voice + Speed + BGM Track Mix!)
 */
app.get('/api/preview-voice', async (req, res) => {
  try {
    const { voiceId = 'male_injoon', speed = 1.0, bgmOption = 'upbeat' } = req.query;
    const speedNum = parseFloat(speed) || 1.0;
    const safeVoiceId = String(voiceId).replace(/[^a-zA-Z0-9_-]/g, '_');

    const previewFilename = `preview_${safeVoiceId}_${speedNum}_${bgmOption}.mp3`;
    const previewPath = path.join(__dirname, 'temp', previewFilename);

    await generateIntegratedPreview(voiceId, speedNum, bgmOption, previewPath);
    res.sendFile(previewPath);
  } catch (err) {
    console.error('Preview error:', err);
    res.status(500).json({ success: false, error: '통합 미리듣기 음성 생성 실패: ' + err.message });
  }
});

app.post('/api/split-script', (req, res) => {
  try {
    const { script } = req.body;
    if (!script || script.trim().length === 0) {
      return res.status(400).json({ success: false, error: '홍보 대본 텍스트를 입력해주세요.' });
    }

    const scenes = splitScriptIntoScenes(script);
    res.json({ success: true, scenes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/generate-shorts - Full Pipeline
 */
app.post('/api/generate-shorts', upload.array('photos', 20), async (req, res) => {
  const jobId = `job_${Date.now()}`;

  let scenes = [];
  let voiceId = 'ko-KR-SunHi';
  let speechSpeed = 0.95;
  let bgmOption = 'none';

  try {
    if (req.body.scenes) {
      scenes = typeof req.body.scenes === 'string' ? JSON.parse(req.body.scenes) : req.body.scenes;
    }
    if (req.body.voiceId) voiceId = req.body.voiceId;
    if (req.body.speechSpeed) speechSpeed = parseFloat(req.body.speechSpeed) || 0.95;
    if (req.body.bgmOption) bgmOption = req.body.bgmOption;
  } catch (parseErr) {
    return res.status(400).json({ success: false, error: '요청 데이터 파싱 오류: ' + parseErr.message });
  }

  if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
    return res.status(400).json({ success: false, error: '유효한 씬 목록이 없습니다.' });
  }

  const uploadedFiles = req.files || [];
  const customPhotoPaths = uploadedFiles.map(file => file.path);

  generationProgress[jobId] = { status: 'processing', step: '자연스러운 성우 음성 및 영상 조율 중...', percent: 10 };

  res.json({ success: true, jobId, message: '쇼츠 영상 생성을 시작합니다.' });

  (async () => {
    const jobDir = path.join(__dirname, 'temp', jobId);
    await fs.ensureDir(jobDir);

    try {
      const processedScenes = [];

      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        generationProgress[jobId] = {
          status: 'processing',
          step: `[${i + 1}/${scenes.length}] 씬 처리 중 (선택된 성우 음성 & 현장 사진 매칭)...`,
          percent: Math.round(15 + (i / scenes.length) * 55)
        };

        // 1. Generate Voice Audio with Specific Character Pitch & Speed Multiplier
        const audioPath = path.join(jobDir, `voice_${i}.mp3`);
        const { duration } = await generateSpeech(scene.text, voiceId, audioPath, speechSpeed);

        // 2. Visual Image Selection
        const imagePath = path.join(jobDir, `image_${i}.jpg`);

        if (customPhotoPaths.length > 0) {
          const sourcePhoto = customPhotoPaths[i % customPhotoPaths.length];
          await fs.copy(sourcePhoto, imagePath);
        } else {
          await generateSceneImage(scene.prompt || scene.text, imagePath);
        }

        processedScenes.push({
          sceneIndex: i + 1,
          text: scene.text,
          subtitle: scene.subtitle || scene.text,
          duration: Math.max(2.8, duration + 0.35),
          audioPath,
          imagePath
        });
      }

      // 3. Render Final Video
      generationProgress[jobId] = {
        status: 'processing',
        step: '생동감 넘치는 9:16 비디오 모션 합성 & 하이라이트 자막 및 BGM 인코딩 중...',
        percent: 75
      };

      const finalMp3Filename = `shorts_${Date.now()}.mp4`;
      const outputPath = path.join(__dirname, 'output', finalMp3Filename);

      let bgmPath = null;
      if (bgmOption && bgmOption !== 'none') {
        const potentialBgm = path.join(__dirname, 'assets/bgm', `${bgmOption}.mp3`);
        if (await fs.pathExists(potentialBgm)) {
          bgmPath = potentialBgm;
        }
      }

      await renderShortsVideo({
        scenes: processedScenes,
        bgmPath,
        outputPath,
        onProgress: (percent) => {
          generationProgress[jobId] = {
            status: 'processing',
            step: `비디오 렌더링 중... (${percent}%)`,
            percent: Math.min(98, 75 + Math.round(percent * 0.23))
          };
        }
      });

      generationProgress[jobId] = {
        status: 'completed',
        step: '생성 완료!',
        percent: 100,
        videoUrl: `/output/${finalMp3Filename}`
      };

      await fs.remove(jobDir).catch(() => {});
    } catch (err) {
      console.error(`Job ${jobId} failed:`, err);
      generationProgress[jobId] = {
        status: 'error',
        step: '영상 생성 중 오류가 발생했습니다: ' + err.message,
        percent: 0
      };
      await fs.remove(jobDir).catch(() => {});
    }
  })();
});

app.get('/api/progress/:jobId', (req, res) => {
  const { jobId } = req.params;
  const status = generationProgress[jobId] || { status: 'not_found', percent: 0 };
  res.json({ success: true, data: status });
});

app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 Shorts Video Generator Server Running on http://localhost:${PORT}`);
  console.log(`===================================================`);
});
