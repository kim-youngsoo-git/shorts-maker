const { generateSpeech, VOICES } = require('./services/ttsService');
const path = require('path');
const fs = require('fs-extra');

const testDir = path.join(__dirname, 'temp/standalone_voice_test');
fs.ensureDirSync(testDir);

async function runStandaloneVoiceTest() {
  console.log('===================================================');
  console.log('🎙️ Standalone AI Voice Generation Module Test');
  console.log('===================================================\n');

  for (const voice of VOICES) {
    const outputPath = path.join(testDir, `voice_${voice.id}.mp3`);
    const text = `안녕하세요! ${voice.name} 목소리 모듈 단독 테스트입니다.`;

    try {
      console.log(`Generating speech for: ${voice.name} (${voice.id})...`);
      const result = await generateSpeech(text, voice.id, outputPath, 1.0);
      const stat = fs.statSync(result.outputPath);
      console.log(`✅ SUCCESS -> Duration: ${result.duration.toFixed(2)}s | File Size: ${stat.size} bytes\n`);
    } catch (err) {
      console.error(`❌ FAILED -> ${voice.name}: ${err.message}\n`);
    }
  }
}

runStandaloneVoiceTest();
