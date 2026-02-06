# 🎓 StarMap Seoul - 학습 가이드

이 문서는 기존 Flask + 순수 HTML/JS 프로젝트를 **React + FastAPI** 구조로 변환하면서 왜 그런 선택을 했는지, 어떤 개념을 배울 수 있는지 설명합니다.

---

## 📚 목차
1. [아키텍처 비교](#1-아키텍처-비교)
2. [백엔드: Flask → FastAPI](#2-백엔드-flask--fastapi)
3. [프론트엔드: 순수 HTML/JS → React](#3-프론트엔드-순수-htmljs--react)
4. [실행 방법](#4-실행-방법)
5. [핵심 개념 정리](#5-핵심-개념-정리)
6. [다음 학습 단계](#6-다음-학습-단계)

---

## 1. 아키텍처 비교

### 기존 구조 (Flask + Vanilla JS)
```
[브라우저] ←--HTML/JS/CSS 한 파일--→ [Flask 서버] ←→ [SQLite DB]
                                        ↓
                            index.html (1000줄 짜리 파일)
```

**특징:**
- 모든 코드가 한 파일(`index.html`)에 섞여있음
- HTML, CSS, JavaScript가 뒤죽박죽
- 소규모 프로젝트에는 빠르고 간편

### 새로운 구조 (React + FastAPI)
```
[React 앱] ←--JSON API--→ [FastAPI 서버] ←→ [SQLite DB]
(포트 5173)              (포트 8000)

React 앱 구조:
├── App.jsx (메인)
├── Sidebar.jsx (사이드바 컴포넌트)
├── MapView.jsx (지도 컴포넌트)
└── App.css (스타일)
```

**특징:**
- 프론트엔드와 백엔드 완전 분리
- 컴포넌트별로 파일 분리 (관심사 분리)
- JSON API로 데이터만 주고받음 (프론트가 화면 담당)

---

## 2. 백엔드: Flask → FastAPI

### 왜 FastAPI인가?

| 항목 | Flask | FastAPI |
|------|-------|---------|
| **속도** | 동기 처리 | 비동기 처리 (더 빠름) |
| **타입 검증** | 수동 (if문) | 자동 (Pydantic) |
| **API 문서** | 별도 작성 | 자동 생성 (/docs) |
| **학습 곡선** | 쉬움 | 약간 더 어려움 |
| **현업 사용** | 레거시/소규모 | 신규 프로젝트 표준 |

### 코드 비교

**Flask:**
```python
@app.route('/api/stores', methods=['GET'])
def get_stores():
    data = get_from_db()
    return jsonify(data)  # jsonify 필요
```

**FastAPI:**
```python
@app.get('/api/stores', response_model=List[Store])
async def get_stores():
    data = get_from_db()
    return data  # 그냥 반환하면 자동 JSON 변환
```

### 핵심 파일: `backend/main.py`
- 200줄의 코드에 모든 개념 주석으로 설명
- Pydantic 모델, CORS, 비동기 처리 등 현업 필수 개념 포함

---

## 3. 프론트엔드: 순수 HTML/JS → React

### 왜 React인가?

| 항목 | 순수 HTML/JS | React |
|------|-------------|-------|
| **코드 구조** | 한 파일에 모든 것 | 컴포넌트로 분리 |
| **화면 업데이트** | DOM 직접 조작 | 상태 변경 → 자동 렌더링 |
| **재사용성** | 복사-붙여넣기 | import로 가져오기 |
| **팀 협업** | 어려움 | 컴포넌트별 분업 가능 |

### 핵심 개념 비교

#### 상태 관리
```javascript
// 순수 JS
let visitedStores = [];
visitedStores.push('매장A');
document.getElementById('count').textContent = visitedStores.length;
// 직접 DOM을 업데이트해야 함

// React
const [visitedStores, setVisitedStores] = useState([]);
setVisitedStores([...visitedStores, '매장A']);
// 상태만 바꾸면 화면은 자동으로 업데이트됨
```

#### 컴포넌트 분리
```javascript
// 순수 HTML: 한 파일에 모든 것
<div id="sidebar">...</div>
<div id="map">...</div>
<script>
  // 수백 줄의 코드...
</script>

// React: 파일로 분리
// App.jsx
<Sidebar stores={stores} />
<MapView stores={stores} />

// Sidebar.jsx - 사이드바만 담당
// MapView.jsx - 지도만 담당
```

### 핵심 파일 설명

| 파일 | 역할 | 배울 수 있는 것 |
|------|------|----------------|
| `App.jsx` | 메인 컴포넌트 | useState, useEffect, props 전달 |
| `Sidebar.jsx` | 사이드바 | 컴포넌트 분리, useMemo, 조건부 렌더링 |
| `MapView.jsx` | 지도 | useRef, 외부 라이브러리 통합 |
| `App.css` | 스타일 | CSS 변수, Flexbox 레이아웃 |

---

## 4. 실행 방법

### 사전 준비
- Node.js 18+ 설치
- Python 3.10+ 설치

### 백엔드 실행
```bash
# 1. 백엔드 폴더로 이동
cd starmap-modern/backend

# 2. 가상환경 생성 및 활성화
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

# 3. 의존성 설치
pip install -r requirements.txt

# 4. 서버 실행
uvicorn main:app --reload

# 5. API 문서 확인
# 브라우저에서 http://localhost:8000/docs 접속
```

### 프론트엔드 실행
```bash
# 1. 프론트엔드 폴더로 이동
cd starmap-modern/frontend

# 2. 의존성 설치
npm install

# 3. 개발 서버 실행
npm run dev

# 4. 브라우저에서 확인
# http://localhost:5173
```

---

## 5. 핵심 개념 정리

### React 3대장 Hook

| Hook | 용도 | 예시 |
|------|------|------|
| `useState` | 상태 관리 | `const [count, setCount] = useState(0)` |
| `useEffect` | 부수 효과 처리 | API 호출, 타이머, localStorage |
| `useRef` | DOM 참조 | 외부 라이브러리 연동 시 |

### FastAPI 핵심 개념

| 개념 | 설명 |
|------|------|
| **Pydantic** | 데이터 형식 정의 및 자동 검증 |
| **CORS** | 다른 도메인에서 API 호출 허용 |
| **async/await** | 비동기 처리 (동시 요청 처리) |
| **Path Parameter** | URL에 변수 넣기 `/api/stores/{gu_name}` |

---

## 6. 다음 학습 단계

### 레벨 1: 이 프로젝트 이해하기
- [ ] 모든 파일의 주석을 꼼꼼히 읽기
- [ ] 코드를 조금씩 수정해보고 결과 확인하기
- [ ] FastAPI의 /docs 페이지에서 API 테스트해보기

### 레벨 2: 기능 추가해보기
- [ ] 매장 검색 기능 추가 (프론트 + 백엔드)
- [ ] 로그인 기능 추가 (JWT 인증)
- [ ] 데이터 시각화 (Chart.js 연동)

### 레벨 3: 심화 학습
- [ ] TypeScript 적용 (타입 안정성)
- [ ] Zustand나 Redux로 전역 상태 관리
- [ ] React Query로 서버 상태 관리
- [ ] Docker로 컨테이너화
- [ ] AWS/GCP에 배포

### 추천 학습 자료
1. **React 공식 문서**: https://react.dev
2. **FastAPI 공식 튜토리얼**: https://fastapi.tiangolo.com/tutorial/
3. **생활코딩 React**: https://opentutorials.org/course/4900

---

## 💡 마무리

> "에이전트가 코드를 짜줬는데 내가 뭘 한지 모르겠다"

이제 이 프로젝트의 모든 코드에 **"왜?"**에 대한 답이 주석으로 달려 있습니다.
코드를 읽으면서 "아, 이래서 이렇게 했구나"를 하나씩 이해해 나가시면 됩니다.

**중요한 건 "외우는 것"이 아니라 "왜 그런지 이해하는 것"입니다.**

화이팅! 🚀
