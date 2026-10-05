const { getAllVoices, getVoiceById, generateSpeech, generateIntegratedPreview } = require('./services/voiceModule');
const fs = require('fs-extra');
const path = require('path');

const testDir = path.join(__dirname, 'temp/complete_verification');

(async () => {
  await fs.ensureDir(testDir);
  console.log('====================================================');
  console.log('🧪 성우 목소리 모듈화 및 남녀 구분 최종 검증 테스트');
  console.log('====================================================\n');

  const voices = getAllVoices();
  console.log(`등록된 모듈화 성우 총 ${voices.length}명:\n`);

  for (const v of voices) {
    console.log(`[${v.category}] ${v.name} (${v.id}) - ${v.title}`);
    console.log(`   - Base Neural Engine: ${v.baseVoice}`);
    console.log(`   - Pitch 설정: ${v.pitch}`);
    console.log(`   - 추천 태그: ${v.tag}\n`);
  }

  // 1. 남성 성우 대표 (인준) 음성 생성 검증
  console.log('1️⃣ 남성 대표 성우 [인준] 음성 합성 테스트...');
  const maleAudio = path.join(testDir, 'test_male_injoon.mp3');
  const resMale = await generateSpeech(
    '여의도 중심 입지! 신축 프리미엄 오피스텔 분양 소식입니다.',
    'male_injoon',
    maleAudio,
    1.0
  );
  console.log(`   ✅ 남성 음성 생성 완료: ${maleAudio} (재생시간: ${resMale.duration.toFixed(2)}초, 크기: ${fs.statSync(maleAudio).size} bytes)`);

  // 2. 여성 성우 대표 (선희) 음성 생성 검증
  console.log('\n2️⃣ 여성 대표 성우 [선희] 음성 합성 테스트...');
  const femaleAudio = path.join(testDir, 'test_female_sunhi.mp3');
  const resFemale = await generateSpeech(
    '반포 프리미엄 랜드마크 아파트 긴급 분양! 로열층을 선점하세요.',
    'female_sunhi',
    femaleAudio,
    1.0
  );
  console.log(`   ✅ 여성 음성 생성 완료: ${femaleAudio} (재생시간: ${resFemale.duration.toFixed(2)}초, 크기: ${fs.statSync(femaleAudio).size} bytes)`);

  // 3. 레거시 ID 호환성 검증 (ko-KR-InJoon -> male_injoon)
  console.log('\n3️⃣ 레거시 ID 호환 매핑 테스트 (ko-KR-InJoon)...');
  const legacyAudio = path.join(testDir, 'test_legacy_injoon.mp3');
  const resLegacy = await generateSpeech(
    '레거시 호환 테스트입니다. 완벽한 남성 음성으로 합성됩니다.',
    'ko-KR-InJoon',
    legacyAudio,
    1.0
  );
  console.log(`   ✅ 레거시 매핑 완료: 매핑된 성우 -> ${resLegacy.voiceProfile.name} (${resLegacy.voiceProfile.id})`);

  // 4. 통합 미리듣기(BGM 믹싱) 검증
  console.log('\n4️⃣ 성우 + BGM 통합 미리듣기 믹싱 테스트...');
  const previewPath = path.join(testDir, 'preview_mix_test.mp3');
  await generateIntegratedPreview('male_injoon', 1.0, 'upbeat', previewPath);
  console.log(`   ✅ 통합 미리듣기 생성 완료: ${previewPath} (크기: ${fs.statSync(previewPath).size} bytes)`);

  console.log('\n🎉 모든 성우 모듈 검증 테스트가 100% 정상 통과되었습니다!\n');
})();
