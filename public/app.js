let currentScenes = [];
let selectedPhotoFiles = [];
let activeJobId = null;
let pollTimer = null;

const SAMPLES = {
  apt: `반포 프리미엄 랜드마크 신축 아파트 긴급 분양!
강남 10분대 쾌속 교통망과 한강 조망 프리미엄을 완벽하게 누리세요.
전 세대 남향 배치와 초호화 커뮤니티 시설까지 완비!
지금 방문 예약 시 특별 금융 혜택을 선착순으로 제공합니다.
마감 직전! 지금 바로 로열층을 선점하세요.`,
  officetel: `여의도 중심 입지! 파노라마 시티뷰 하이엔드 오피스텔 분양!
지하철 9호선 초역세권으로 압도적인 직주근접 가치를 제공합니다.
풀옵션 최고급 인테리어와 수영장, 루프탑 정원 탑재!
소액 투자로 높은 월세 수익을 보장하는 최고의 찬스.
지금 대표번호로 문의하시고 모델하우스 관람을 예약하세요.`
};

const VOICE_PROFILES = {
  male_injoon: {
    name: '인준',
    gender: 'male',
    genderText: '남성 성우',
    role: '정통 남성 대표',
    tag: '중후함 / 신뢰',
    desc: '묵직하고 전달력이 뛰어난 100% 리얼 정통 남성 보이스. 신도시 대단지 아파트 분양 및 핵심 입지·투자 가치 전달에 최적.'
  },
  male_hyunsu: {
    name: '현수',
    gender: 'male',
    genderText: '남성 성우',
    role: '도심형 스마트',
    tag: '젊음 / 트렌디',
    desc: '친근하고 세련된 100% 리얼 젊은 남성 보이스. 2030 세대, 신혼부부 주택 & 트렌디 오피스텔 쇼츠 나레이션에 최적.'
  },
  male_power: {
    name: '봉진',
    gender: 'male',
    genderText: '남성 성우',
    role: '파워 바리톤',
    tag: '파워저음 / 임팩트',
    desc: '깊은 울림과 강렬한 흡입력을 주는 파워 저음 바리톤 보이스. 마감 임박 긴급 분양 & 파격적인 특별 분양 혜택 강조에 최적.'
  },
  female_sunhi: {
    name: '선희',
    gender: 'female',
    genderText: '여성 성우',
    role: '표준 여성 대표',
    tag: '우아함 / 신뢰',
    desc: '맑고 또박또박한 발음의 고품격 표준 아나운서 음색. 랜드마크 아파트/오피스텔 메인 홍보 나레이션에 최적.'
  },
  female_jimin: {
    name: '지민',
    gender: 'female',
    genderText: '여성 성우',
    role: '트렌디 생기',
    tag: '생기 / 브라이트',
    desc: '화사하고 생기 넘치는 브라이트 톤. 핫플레이스 상권, 역세권 상가, 이벤트 & 프로모션 영상에 최적.'
  },
  female_yujin: {
    name: '유진',
    gender: 'female',
    genderText: '여성 성우',
    role: '하이엔드 럭셔리',
    tag: '럭셔리 / 감성',
    desc: '깊이 있고 편안하게 감싸안는 중저음 럭셔리 음색. 고급 펜트하우스 & 하이엔드 타운하우스 홍보에 최적.'
  }
};

function onVoiceChange() {
  const select = document.getElementById('voiceSelect');
  const voiceId = select ? select.value : 'male_injoon';
  const profile = VOICE_PROFILES[voiceId] || VOICE_PROFILES['male_injoon'];

  const genderBadge = document.getElementById('voiceGenderBadge');
  const nameEl = document.getElementById('voiceActorName');
  const roleBadge = document.getElementById('voiceRoleBadge');
  const tagEl = document.getElementById('voiceTag');
  const descEl = document.getElementById('voiceDescription');

  if (genderBadge) {
    genderBadge.className = `badge-gender ${profile.gender}`;
    genderBadge.innerHTML = profile.gender === 'male' 
      ? '<i class="fa-solid fa-mars"></i> 남성 성우' 
      : '<i class="fa-solid fa-venus"></i> 여성 성우';
  }
  if (nameEl) nameEl.textContent = profile.name;
  if (roleBadge) roleBadge.textContent = profile.role;
  if (tagEl) tagEl.innerHTML = `<i class="fa-solid fa-hashtag"></i> ${profile.tag}`;
  if (descEl) descEl.textContent = profile.desc;
}

function filterVoiceCategory(category) {
  // Update active tab buttons
  document.querySelectorAll('.voice-filter-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
  const targetTab = document.getElementById('tab' + category.charAt(0).toUpperCase() + category.slice(1));
  if (targetTab) targetTab.classList.add('active');

  const maleGroup = document.getElementById('optgroupMale');
  const femaleGroup = document.getElementById('optgroupFemale');
  const select = document.getElementById('voiceSelect');

  if (!maleGroup || !femaleGroup || !select) return;

  if (category === 'male') {
    maleGroup.style.display = '';
    femaleGroup.style.display = 'none';
    if (!select.value.startsWith('male_')) {
      select.value = 'male_injoon';
    }
  } else if (category === 'female') {
    maleGroup.style.display = 'none';
    femaleGroup.style.display = '';
    if (!select.value.startsWith('female_')) {
      select.value = 'female_sunhi';
    }
  } else {
    maleGroup.style.display = '';
    femaleGroup.style.display = '';
  }

  onVoiceChange();
}

document.addEventListener('DOMContentLoaded', () => {
  const scriptInput = document.getElementById('scriptInput');
  const charCount = document.getElementById('charCount');

  scriptInput.addEventListener('input', () => {
    const len = scriptInput.value.length;
    charCount.textContent = `${len} 자 (권장 120~250자)`;
  });

  // Initialize voice detail info card
  onVoiceChange();
});

function loadSample(key) {
  if (SAMPLES[key]) {
    const scriptInput = document.getElementById('scriptInput');
    scriptInput.value = SAMPLES[key];
    scriptInput.dispatchEvent(new Event('input'));
  }
}

function handlePhotoSelect(event) {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;

  selectedPhotoFiles = [...selectedPhotoFiles, ...files];
  renderPhotoPreview();
}

function renderPhotoPreview() {
  const grid = document.getElementById('photoPreviewGrid');
  const badge = document.getElementById('photoStatusBadge');

  if (selectedPhotoFiles.length === 0) {
    grid.style.display = 'none';
    grid.innerHTML = '';
    badge.textContent = '사진 미등록 (기본 비주얼 자동 생성)';
    badge.className = 'badge-accent';
    return;
  }

  badge.textContent = `현장 사진 ${selectedPhotoFiles.length}장 등록 완료`;
  badge.className = 'badge';

  grid.innerHTML = '';
  grid.style.display = 'grid';

  selectedPhotoFiles.forEach((file, idx) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const container = document.createElement('div');
      container.className = 'photo-thumb-container';
      container.innerHTML = `
        <img src="${e.target.result}" alt="현장 사진 ${idx + 1}">
        <button class="photo-remove-btn" onclick="removePhoto(${idx})"><i class="fa-solid fa-xmark"></i></button>
      `;
      grid.appendChild(container);
    };
    reader.readAsDataURL(file);
  });
}

function removePhoto(index) {
  selectedPhotoFiles.splice(index, 1);
  renderPhotoPreview();
}

let isBgmPlaying = false;

function toggleBgmSoloPlay() {
  const bgmSelect = document.getElementById('bgmSelect');
  const bgmOption = bgmSelect ? bgmSelect.value : 'none';
  const player = document.getElementById('bgmSoloPlayer');
  const btn = document.getElementById('bgmSoloBtn');

  if (!player || !btn) return;

  if (bgmOption === 'none') {
    alert('배경음악이 "무음"으로 선택되어 있습니다. 신나고 활기찬 분위기 또는 다른 배경음악을 선택해주세요.');
    return;
  }

  // If integrated voice preview is currently playing, pause it to prevent overlap
  const previewAudioPlayer = document.getElementById('previewAudioPlayer');
  if (previewAudioPlayer && !previewAudioPlayer.paused) {
    previewAudioPlayer.pause();
  }

  if (isBgmPlaying) {
    player.pause();
    isBgmPlaying = false;
    btn.innerHTML = '<i class="fa-solid fa-play"></i> BGM 바로듣기';
    btn.classList.remove('playing');
  } else {
    player.src = `/assets/bgm/${bgmOption}.mp3?t=${Date.now()}`;
    player.volume = 0.5;
    player.play().then(() => {
      isBgmPlaying = true;
      btn.innerHTML = '<i class="fa-solid fa-pause"></i> BGM 정지';
      btn.classList.add('playing');
    }).catch(err => {
      console.warn('BGM play error:', err);
      isBgmPlaying = false;
      btn.innerHTML = '<i class="fa-solid fa-play"></i> BGM 바로듣기';
      btn.classList.remove('playing');
    });
  }
}

function onBgmChange() {
  const bgmSelect = document.getElementById('bgmSelect');
  const bgmOption = bgmSelect ? bgmSelect.value : 'none';
  const player = document.getElementById('bgmSoloPlayer');
  const btn = document.getElementById('bgmSoloBtn');

  if (isBgmPlaying && player) {
    if (bgmOption === 'none') {
      player.pause();
      isBgmPlaying = false;
      if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-play"></i> BGM 바로듣기';
        btn.classList.remove('playing');
      }
    } else {
      player.src = `/assets/bgm/${bgmOption}.mp3?t=${Date.now()}`;
      player.play().catch(() => {});
    }
  }
}

/**
 * Instant Integrated Audio Preview (Voice Character + Speed + BGM Track Mix!)
 */
async function playVoicePreview() {
  // Pause standalone BGM player if active
  const soloPlayer = document.getElementById('bgmSoloPlayer');
  const soloBtn = document.getElementById('bgmSoloBtn');
  if (soloPlayer && isBgmPlaying) {
    soloPlayer.pause();
    isBgmPlaying = false;
    if (soloBtn) {
      soloBtn.innerHTML = '<i class="fa-solid fa-play"></i> BGM 바로듣기';
      soloBtn.classList.remove('playing');
    }
  }

  const voiceId = document.getElementById('voiceSelect').value;
  const speed = document.getElementById('speedSelect').value;
  const bgmOption = document.getElementById('bgmSelect').value;

  const btn = document.getElementById('previewBtn');
  const audioBox = document.getElementById('previewAudioBox');
  const audioPlayer = document.getElementById('previewAudioPlayer');

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 통합 음성&BGM 생성 중...';

  try {
    const previewUrl = `/api/preview-voice?voiceId=${encodeURIComponent(voiceId)}&speed=${encodeURIComponent(speed)}&bgmOption=${encodeURIComponent(bgmOption)}&t=${Date.now()}`;
    
    audioPlayer.src = previewUrl;
    audioBox.style.display = 'block';
    audioPlayer.play();
  } catch (err) {
    alert('미리듣기 불러오기 실패: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> 성우 & BGM 미리듣기';
  }
}

async function splitScript() {
  const scriptText = document.getElementById('scriptInput').value.trim();
  if (!scriptText) {
    alert('홍보 대본 텍스트를 입력해주세요.');
    return;
  }

  try {
    const response = await fetch('/api/split-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script: scriptText })
    });

    const data = await response.json();
    if (!data.success) {
      alert('대본 분석 실패: ' + data.error);
      return;
    }

    currentScenes = data.scenes;
    renderScenesList();
  } catch (err) {
    alert('서버 통신 오류: ' + err.message);
  }
}

function renderScenesList() {
  const container = document.getElementById('scenesList');
  const scenesCard = document.getElementById('scenesCard');
  const badge = document.getElementById('sceneCountBadge');

  container.innerHTML = '';
  badge.textContent = `${currentScenes.length}개 씬 생성됨`;

  currentScenes.forEach((scene, index) => {
    const item = document.createElement('div');
    item.className = 'scene-item';
    item.innerHTML = `
      <div class="scene-number">${scene.sceneIndex}</div>
      <div class="scene-content">
        <label class="text-muted">씬 ${scene.sceneIndex} 대사 & 화면 홍보 자막</label>
        <input type="text" class="scene-input" value="${escapeHtml(scene.subtitle)}" onchange="updateSceneText(${index}, this.value)">
        <div class="scene-prompt"><i class="fa-solid fa-image"></i> AI 비주얼 프롬프트: ${escapeHtml(scene.prompt)}</div>
      </div>
    `;
    container.appendChild(item);
  });

  scenesCard.style.display = 'block';
  scenesCard.scrollIntoView({ behavior: 'smooth' });
}

function updateSceneText(index, value) {
  if (currentScenes[index]) {
    currentScenes[index].text = value;
    currentScenes[index].subtitle = value;
  }
}

async function startGeneration() {
  if (!currentScenes || currentScenes.length === 0) {
    alert('먼저 대본 씬을 생성해주세요.');
    return;
  }

  const voiceId = document.getElementById('voiceSelect').value;
  const speechSpeed = document.getElementById('speedSelect').value;
  const bgmOption = document.getElementById('bgmSelect').value;

  const generateBtn = document.getElementById('generateBtn');
  generateBtn.disabled = true;

  showProgressOverlay('선택하신 성우 음성 & BGM 영상 합성 중...');

  const formData = new FormData();
  formData.append('scenes', JSON.stringify(currentScenes));
  formData.append('voiceId', voiceId);
  formData.append('speechSpeed', speechSpeed);
  formData.append('bgmOption', bgmOption);

  selectedPhotoFiles.forEach(file => {
    formData.append('photos', file);
  });

  try {
    const response = await fetch('/api/generate-shorts', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    if (!data.success) {
      alert('생성 요청 실패: ' + data.error);
      hideProgressOverlay();
      generateBtn.disabled = false;
      return;
    }

    activeJobId = data.jobId;
    startPollingProgress();
  } catch (err) {
    alert('서버 에러: ' + err.message);
    hideProgressOverlay();
    generateBtn.disabled = false;
  }
}

function startPollingProgress() {
  if (pollTimer) clearInterval(pollTimer);

  pollTimer = setInterval(async () => {
    if (!activeJobId) return;

    try {
      const res = await fetch(`/api/progress/${activeJobId}`);
      const data = await res.json();

      if (data.success && data.data) {
        const info = data.data;
        updateProgress(info.step, info.percent);

        if (info.status === 'completed') {
          clearInterval(pollTimer);
          hideProgressOverlay();
          showVideoResult(info.videoUrl);
          document.getElementById('generateBtn').disabled = false;
        } else if (info.status === 'error') {
          clearInterval(pollTimer);
          alert(info.step);
          hideProgressOverlay();
          document.getElementById('generateBtn').disabled = false;
        }
      }
    } catch (err) {
      console.warn('Progress poll error:', err);
    }
  }, 1000);
}

function showProgressOverlay(initialMessage) {
  const overlay = document.getElementById('progressOverlay');
  const placeholder = document.getElementById('playerPlaceholder');
  const videoPlayer = document.getElementById('videoPlayer');
  const downloadBox = document.getElementById('downloadBox');

  placeholder.style.display = 'none';
  videoPlayer.style.display = 'none';
  downloadBox.style.display = 'none';

  overlay.style.display = 'flex';
  updateProgress(initialMessage, 5);
}

function updateProgress(message, percent) {
  document.getElementById('progressStatus').textContent = message;
  document.getElementById('progressBar').style.width = `${percent}%`;
  document.getElementById('progressPercent').textContent = `${percent}%`;
}

function hideProgressOverlay() {
  document.getElementById('progressOverlay').style.display = 'none';
}

function showVideoResult(videoUrl) {
  const videoPlayer = document.getElementById('videoPlayer');
  const downloadBox = document.getElementById('downloadBox');
  const downloadLink = document.getElementById('downloadLink');

  videoPlayer.src = videoUrl;
  videoPlayer.style.display = 'block';
  videoPlayer.play();

  downloadLink.href = videoUrl;
  downloadLink.download = videoUrl.split('/').pop() || 'shorts_video.mp4';
  downloadBox.style.display = 'block';
  
  // 자동 다운로드 트리거 (사용자 편의)
  setTimeout(() => {
    downloadLink.click();
  }, 1000);
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
