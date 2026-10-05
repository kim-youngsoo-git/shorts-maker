import os
import torch
from TTS.api import TTS
from flask import Flask, request, send_file
import tempfile
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# GPU가 있으면 GPU 사용, 없으면 CPU 사용
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"==========================================")
print(f"XTTS v2 로컬 서버 초기화 중...")
print(f"사용 장치(Device): {device}")
print(f"==========================================")

try:
    print("AI 모델을 불러오는 중입니다... (최초 실행 시 약 2GB 다운로드 필요)")
    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
    print("✅ AI 모델 로드 완료! 서버가 시작되었습니다.")
except Exception as e:
    print(f"❌ AI 모델 로드 실패: {e}")
    exit(1)

@app.route('/api/clone', methods=['POST'])
def clone_voice():
    data = request.json
    text = data.get('text', '')
    speaker_wav = data.get('speaker_wav', 'my_voice.wav')
    language = data.get('language', 'ko')

    if not text:
        return {"error": "변환할 텍스트(text)가 없습니다."}, 400
        
    if not os.path.exists(speaker_wav):
        return {"error": f"목소리 샘플 파일('{speaker_wav}')을 찾을 수 없습니다. 프로젝트 폴더에 넣어주세요."}, 400

    print(f"\n[음성 복제 요청] 텍스트: '{text[:20]}...' / 레퍼런스: {speaker_wav}")
    
    # 임시 파일 생성
    fd, temp_path = tempfile.mkstemp(suffix=".wav")
    os.close(fd)

    try:
        # XTTS 음성 합성 실행
        tts.tts_to_file(
            text=text, 
            speaker_wav=speaker_wav, 
            language=language, 
            file_path=temp_path
        )
        print(f"✅ 오디오 생성 완료: {temp_path}")
        return send_file(temp_path, mimetype="audio/wav", as_attachment=True, download_name="cloned_voice.wav")
    except Exception as e:
        print(f"❌ 오디오 생성 오류: {e}")
        return {"error": str(e)}, 500

if __name__ == '__main__':
    print("🚀 로컬 음성 복제 API 서버가 포트 5050에서 실행 중입니다...")
    app.run(port=5050, debug=False, host='0.0.0.0')
