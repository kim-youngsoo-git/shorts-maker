const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs-extra');

ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Creates Eye-Catching ASS Subtitles for Promotional Shorts Video
 */
async function createAssSubtitleFile(scenes, assPath) {
  let assContent = `[Script Info]
Title: Eye-Catching Promotional Shorts Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: None
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,맑은 고딕,72,&H0000FFFF,&H000000FF,&H00000000,&HA0000000,-1,0,0,0,100,100,0,0,1,6,4,2,50,50,320,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  let currentTime = 0;
  for (const scene of scenes) {
    const startTimeStr = formatAssTime(currentTime);
    const endTimeStr = formatAssTime(currentTime + scene.duration);
    const cleanSubtitle = scene.subtitle.replace(/'/g, '').replace(/"/g, '');

    assContent += `Dialogue: 0,${startTimeStr},${endTimeStr},Default,,0,0,0,,{\\b1\\an2\\outline6\\shadow4}${cleanSubtitle}\n`;
    currentTime += scene.duration;
  }

  await fs.ensureDir(path.dirname(assPath));
  await fs.writeFile(assPath, assContent, 'utf8');
  return assPath;
}

function formatAssTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);

  const hh = String(h).padStart(1, '0');
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  const cs = String(ms).padStart(2, '0');

  return `${hh}:${mm}:${ss}.${cs}`;
}

async function renderShortsVideo({ scenes, bgmPath, outputPath, onProgress }) {
  await fs.ensureDir(path.dirname(outputPath));

  const tempDir = path.join(__dirname, '../temp', `build_${Date.now()}`);
  await fs.ensureDir(tempDir);

  try {
    const sceneClipPaths = [];
    
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const clipPath = path.join(tempDir, `scene_${i}.mp4`);

      await renderIndividualSceneClip({
        imagePath: scene.imagePath,
        audioPath: scene.audioPath,
        duration: scene.duration,
        sceneIndex: i,
        outputPath: clipPath
      });

      sceneClipPaths.push(clipPath);
    }

    const concatListPath = path.join(tempDir, 'concat_list.txt');
    const concatContent = sceneClipPaths
      .map(p => `file '${p.replace(/\\/g, '/')}'`)
      .join('\n');
    await fs.writeFile(concatListPath, concatContent, 'utf8');

    const mergedVideoPath = path.join(tempDir, 'merged_raw.mp4');
    await concatVideoClips(concatListPath, mergedVideoPath);

    const assPath = path.join(tempDir, 'subtitles.ass');
    await createAssSubtitleFile(scenes, assPath);

    await renderFinalWithAudioAndSubtitles({
      inputVideoPath: mergedVideoPath,
      assPath: assPath,
      bgmPath: bgmPath,
      outputPath: outputPath,
      onProgress
    });

    await fs.remove(tempDir).catch(() => {});
    return outputPath;
  } catch (err) {
    await fs.remove(tempDir).catch(() => {});
    throw err;
  }
}

function renderIndividualSceneClip({ imagePath, audioPath, duration, sceneIndex, outputPath }) {
  return new Promise((resolve, reject) => {
    const safeImg = imagePath.replace(/\\/g, '/');
    const totalFrames = Math.ceil(duration * 30);

    let zoomFilter = '';
    const motionType = sceneIndex % 3;

    if (motionType === 0) {
      zoomFilter = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.002,1.25)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920`;
    } else if (motionType === 1) {
      zoomFilter = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='max(1.25-0.002*on,1.0)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920`;
    } else {
      zoomFilter = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='1.12':x='if(eq(on,1),0,x+1)':y='ih/2-(ih/zoom/2)':d=${totalFrames}:s=1080x1920`;
    }

    ffmpeg()
      .input(safeImg)
      .loop(duration)
      .input(audioPath)
      .outputOptions([
        '-c:v libx264',
        '-tune stillimage',
        '-c:a aac',
        '-b:a 192k',
        '-pix_fmt yuv420p',
        `-vf ${zoomFilter}`,
        `-t ${duration}`,
        '-r 30'
      ])
      .save(outputPath)
      .on('end', resolve)
      .on('error', (err) => reject(new Error(`Scene clip render failed: ${err.message}`)));
  });
}

function concatVideoClips(concatListPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(concatListPath)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions(['-c copy'])
      .save(outputPath)
      .on('end', resolve)
      .on('error', (err) => reject(new Error(`Video concat failed: ${err.message}`)));
  });
}

function renderFinalWithAudioAndSubtitles({ inputVideoPath, assPath, bgmPath, outputPath, onProgress }) {
  return new Promise((resolve, reject) => {
    const safeAssPath = assPath.replace(/\\/g, '/').replace(':', '\\:');
    
    let command = ffmpeg().input(inputVideoPath);
    const hasBgm = bgmPath && fs.existsSync(bgmPath);

    if (hasBgm) {
      command = command.input(bgmPath).inputOptions(['-stream_loop -1']);
    }

    const outputOptions = [
      '-c:v libx264',
      '-preset fast',
      '-crf 20',
      '-c:a aac',
      '-b:a 192k',
      '-pix_fmt yuv420p',
      '-shortest'
    ];

    if (hasBgm) {
      // Audio mixing: Main TTS (0:a) + Authentic Studio BGM (1:a volume 0.25) + ASS subtitles
      command.complexFilter([
        '[0:a]volume=1.0[v]',
        '[1:a]volume=0.25[bgm]',
        '[v][bgm]amix=inputs=2:duration=first:dropout_transition=0[aout]',
        `[0:v]ass='${safeAssPath}'[vout]`
      ], ['vout', 'aout']);
    } else {
      command.videoFilters(`ass='${safeAssPath}'`);
    }

    command
      .outputOptions(outputOptions)
      .on('progress', (progress) => {
        if (onProgress && progress.percent) {
          onProgress(Math.min(100, Math.round(progress.percent)));
        }
      })
      .save(outputPath)
      .on('end', resolve)
      .on('error', (err) => reject(new Error(`Final render failed: ${err.message}`)));
  });
}

module.exports = {
  renderShortsVideo
};
