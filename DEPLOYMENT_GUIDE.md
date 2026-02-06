# StarMap Seoul - 서버 배포 가이드 🚀

이 문서는 StarMap Seoul 애플리케이션을 인터넷에 공개하기 위해 **PythonAnywhere**에 배포하는 방법을 단계별로 안내합니다. Flask와 SQLite(DB) 구조에 가장 쉽고 적합한 방법입니다.

---

## 1. 준비물 챙기기 🎒
내 컴퓨터의 프로젝트 폴더에서 다음 파일들이 준비되어야 합니다. (이미 다 준비해 드렸습니다!)

1.  **`app.py`**: 메인 실행 파일
2.  **`requirements.txt`**: 필요한 라이브러리 목록
3.  **`starbucks.db`**: 데이터가 들어있는 DB 파일
4.  **`templates/`, `static/`**: HTML 및 지도 파일 등 폴더 전체

---

## 2. PythonAnywhere 계정 생성 및 파일 업로드

1.  [PythonAnywhere](https://www.pythonanywhere.com/) 접속 및 회원가입 (Beginner 무료 계정도 가능)
2.  로그인 후 상단 메뉴의 **[Files]** 탭 클릭
3.  왼쪽 디렉토리 목록에서 `StarMap` 같은 새 폴더를 하나 만듭니다. (예: `/home/아이디/StarMap`)
4.  **파일 업로드**:
    *   화면 우측의 **Upload a file** 버튼을 이용해 준비한 파일들을 업로드합니다.
    *   **꿀팁**: 파일이 많으므로, 내 컴퓨터에서 프로젝트 전체를 `zip`으로 압축해서 올린 뒤, PythonAnywhere [Consoles] -> [Bash] 메뉴를 열고 `unzip 파일명.zip` 명령어로 푸는 게 훨씬 빠릅니다.

**※ 중요: `starbucks.db` 파일도 잊지 말고 꼭 같이 올려주세요!**

---

## 3. 가상환경 설정 (라이브러리 설치)

1.  상단 메뉴 **[Consoles]** -> **[Bash]** 클릭 (검은 터미널 창이 열림)
2.  다음 명령어를 차례로 입력합니다. (한 줄씩 엔터)

```bash
# 1. 가상환경 생성 (이름: myenv)
mkvirtualenv --python=/usr/bin/python3.10 myenv

# 2. 프로젝트 폴더로 이동 (폴더명은 본인이 만든 이름으로!)
cd StarMap 

# 3. 라이브러리 설치
pip install -r requirements.txt
```

---

## 4. 웹 설정 (가장 중요 ⭐)

1.  상단 메뉴 **[Web]** 클릭 -> **Add a new web app** 클릭
2.  **Next** -> **Flask** 선택 -> **Python 3.10** (가상환경과 버전 맞춤) -> **Next** (경로는 기본값 유지)
3.  웹 앱이 생성되면 설정 화면이 나옵니다. 아래 내용을 수정하세요.

### A. Source code
*   **Source code**: `/home/아이디/StarMap` (프로젝트 폴더 경로 입력)
*   **Working directory**: (위와 동일)

### B. Virtualenv
*   **Virtualenv**: `/home/아이디/.virtualenvs/myenv` (아까 만든 가상환경 이름)
    *   (잘 모르겠으면 경로 입력칸을 클릭하면 자동으로 추천 경로가 뜹니다)

### C. WSGI configuration file (코드 연결)
*   경로 옆의 파일 링크(클릭 가능)를 누르면 에디터가 열립니다.
*   기존 내용을 다 지우고 아래 내용으로 채워넣으세요.

```python
import sys
import os

# 프로젝트 폴더 경로
path = '/home/아이디/StarMap'  # <--- 본인 아이디로 수정 필수!
if path not in sys.path:
    sys.path.append(path)

# app.py에서 app 객체를 가져옴
from app import app as application
```
*   **Save** 누르고 닫기.

---

## 5. 실행 및 확인 🎉
1.  **[Web]** 탭 상단에 초록색 **[Reload ...]** 버튼을 꾹 누릅니다.
2.  상단에 있는 주소 (`아이디.pythonanywhere.com`)를 클릭해 보세요.
3.  짜잔! 내 앱이 인터넷에 떴습니다. 

### 💡 DB 확인
*   `starbucks.db` 파일을 같이 올렸다면, 기존 데이터가 그대로 보일 것입니다.
*   GTM/GA4도 `index.html`에 심어져 있으니, 배포된 사이트에서 막 눌러보고 GA4 실시간 보고서를 확인해 보세요!
