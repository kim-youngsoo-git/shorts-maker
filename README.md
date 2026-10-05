# 🎬 AI 분양 홍보 쇼츠 영상 자동 생성기 (Shorts Maker Pro)

부동산 분양 현장, 아파트, 오피스텔 홍보 대본과 현장 사진을 기반으로 고화질 9:16 세로형 쇼츠 영상을 원클릭으로 자동 제작하는 올인원 웹 애플리케이션입니다.

---

## ✨ 주요 기능

1. **AI 대본 자동 분석 & 씬 분할**
   - 홍보 대본을 45초~60초 분량의 씬(Scene) 단위로 지능형 자동 분할
   - 각 씬별 하이라이트 자막(ASS) 자동 생성

2. **프로페셔널 성우 나레이션 (TTS)**
   - 남성 성우 3인 (인준, 현수, 봉진) & 여성 성우 3인 (선희, 지민, 유진) 지원
   - 0.8x ~ 1.15x 정밀 낭독 속도 조절
   - 성우 음성 및 BGM 즉시 미리듣기 기능

3. **고음질 로열티 프리 배경음악(BGM) 믹싱**
   - 신나고 활기찬 분위기 (Carefree)
   - 고급스럽고 세련된 라운지 분위기 (Lobby Time)
   - 차분하고 신뢰감 있는 분위기 (Deliberate Thought)
   - 성우 음성과 BGM의 황금 볼륨 밸런스(1.0 : 0.25) 자동 믹싱

4. **다이내믹 비디오 모션 연출**
   - 9:16 FHD (1080x1920) 세로형 최적화
   - 켄 번스(Ken Burns) 줌인/줌아웃 및 슬라이드 모션 효과 자동 적용
   - 유튜브 쇼츠, 인스타그램 릴스, 틱톡 완벽 규격

---

## 🚀 빠른 시작 가이드

### 1. 패키지 설치
```bash
npm install
```

### 2. 서버 실행
```bash
# Windows 바로 실행
start.bat

# 또는 커맨드라인 실행
node server.js
```

### 3. 브라우저 접속
웹 브라우저를 열고 `http://localhost:3000`에 접속합니다.

---

## 🛠️ 기술 스택
- **Backend**: Node.js, Express, Multer
- **Media Processing**: FFmpeg (fluent-ffmpeg, ffmpeg-static)
- **Voice Engine**: MsEdgeTTS Neural Voice Engine
- **Frontend**: Vanilla JavaScript, Modern CSS (Glassmorphism, Dark UI)
