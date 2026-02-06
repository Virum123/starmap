# 🎓 StarMap Seoul - 실전 웹개발 학습 가이드

이 문서는 StarMap Seoul 프로젝트의 코드를 따라가며 웹 개발의 핵심 개념을 학습하기 위한 가이드입니다.

---

## 📚 목차

1. [프로젝트 구조 이해](#1-프로젝트-구조-이해)
2. [작업 흐름 따라가기](#2-작업-흐름-따라가기)
3. [백엔드 (FastAPI)](#3-백엔드-fastapi)
4. [프론트엔드 (React)](#4-프론트엔드-react)
5. [데이터 흐름](#5-데이터-흐름)
6. [핵심 개념 정리](#6-핵심-개념-정리)

---

## 1. 프로젝트 구조 이해

```
starmap/
├── starbucks.db              # SQLite 데이터베이스 (매장 정보)
├── data/                     # 원본 CSV 데이터
│   └── star_bucks_store_utf.csv
│
└── starmap-modern/           # React + FastAPI 프로젝트
    ├── backend/              # FastAPI 백엔드
    │   ├── main.py           # API 서버 코드
    │   ├── venv/             # Python 가상환경
    │   └── requirements.txt  # Python 패키지 목록
    │
    └── frontend/             # React 프론트엔드
        ├── public/           # 정적 파일
        │   └── static/       # GeoJSON 지도 데이터
        ├── src/              # 소스 코드
        │   ├── App.jsx       # 메인 컴포넌트
        │   ├── App.css       # 스타일
        │   ├── components/   # 컴포넌트 모음
        │   │   ├── Sidebar.jsx
        │   │   ├── MapView.jsx
        │   │   └── ProfileModal.jsx
        │   └── utils/        # 유틸리티 함수
        │       └── celebration.js
        └── package.json      # npm 패키지 목록
```

---

## 2. 작업 흐름 따라가기

### 📌 이 앱은 어떻게 동작하나?

1. **사용자가 브라우저에서 접속** (`http://localhost:5173`)
2. **React 앱 로딩** → `App.jsx` 실행
3. **API 호출** → FastAPI 서버에서 매장 데이터 가져옴
4. **지도 렌더링** → Leaflet으로 서울 지도 표시
5. **사용자 상호작용** → 구 클릭, 매장 체크 등
6. **상태 업데이트** → localStorage에 저장

### 📌 코드를 읽는 순서 (추천)

```
1. backend/main.py        → API가 어떤 데이터를 주는지 이해
2. App.jsx                → 전체 앱의 구조와 상태 관리
3. Sidebar.jsx            → 리스트 렌더링과 이벤트 처리
4. MapView.jsx            → Leaflet 지도 통합
5. App.css                → 스타일링
```

---

## 3. 백엔드 (FastAPI)

### 📁 `backend/main.py` 핵심 개념

#### 3.1 FastAPI 앱 생성

```python
from fastapi import FastAPI

app = FastAPI(
    title="StarMap Seoul API",
    description="스타벅스 매장 방문 기록 관리 API"
)
```

**📌 왜 FastAPI?**
- Flask보다 빠름 (비동기 처리)
- 자동 API 문서 생성 (`/docs`)
- 타입 검증 자동화

#### 3.2 CORS 설정

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React 주소
    allow_methods=["*"],
)
```

**📌 왜 필요한가?**
- 브라우저 보안 정책: 다른 도메인에서 API 호출 차단
- React(5173) → FastAPI(8000) 통신을 허용해야 함

#### 3.3 Pydantic 모델

```python
from pydantic import BaseModel

class Store(BaseModel):
    store_name: str
    store_code: int
    gu: str
    dong: str
    lat: float
    lng: float
```

**📌 왜 Pydantic?**
- 데이터 형식을 미리 정의 → 잘못된 데이터 자동 거부
- API 문서에 예시 표시

#### 3.4 API 엔드포인트

```python
@app.get("/api/stores")
async def get_all_stores():
    conn = get_db_connection()
    stores = conn.execute("SELECT * FROM stores").fetchall()
    conn.close()
    return [dict(store) for store in stores]
```

**📌 핵심 포인트**
- `@app.get`: GET 요청 처리
- `async def`: 비동기 함수 (여러 요청 동시 처리)
- `return`: 자동으로 JSON 변환됨 (Flask의 `jsonify` 불필요)

---

## 4. 프론트엔드 (React)

### 📁 `App.jsx` 핵심 개념

#### 4.1 상태(State) 관리

```jsx
const [stores, setStores] = useState([]);
const [visitedStores, setVisitedStores] = useState(new Set());
```

**📌 useState란?**
- React에서 "기억하고 싶은 값"을 관리
- 상태가 바뀌면 화면이 자동으로 다시 그려짐 (리렌더링)

#### 4.2 API 호출

```jsx
useEffect(() => {
    async function fetchStores() {
        const response = await fetch('http://localhost:8000/api/stores');
        const data = await response.json();
        setStores(data);
    }
    fetchStores();
}, []);  // 빈 배열 = 컴포넌트 마운트 시 1회만 실행
```

**📌 useEffect란?**
- 컴포넌트가 화면에 나타난 후 실행되는 코드
- API 호출, 이벤트 리스너 등록 등에 사용

#### 4.3 컴포넌트 조합

```jsx
return (
    <div className="app-container">
        <Sidebar stores={stores} ... />
        <MapView stores={stores} ... />
    </div>
);
```

**📌 Props란?**
- 부모 → 자식 컴포넌트로 데이터 전달
- `stores={stores}`: stores 데이터를 Sidebar에 전달

---

### 📁 `Sidebar.jsx` 핵심 개념

#### 4.4 useMemo (계산 최적화)

```jsx
const guStats = useMemo(() => {
    const stats = {};
    stores.forEach(store => {
        if (!stats[store.gu]) stats[store.gu] = { total: 0, visited: 0 };
        stats[store.gu].total++;
        if (visitedStores.has(store.store_name)) stats[store.gu].visited++;
    });
    return stats;
}, [stores, visitedStores]);
```

**📌 useMemo란?**
- 계산 비용이 큰 값을 캐싱
- `[stores, visitedStores]`가 바뀔 때만 재계산

#### 4.5 조건부 렌더링

```jsx
{currentLevel === 'GU' ? (
    // 구 목록 렌더링
    Object.entries(guStats).map(...)
) : (
    // 동별 매장 렌더링
    Object.entries(storesByDong).map(...)
)}
```

**📌 삼항 연산자로 조건부 렌더링**
- `조건 ? 참일때 : 거짓일때`

---

### 📁 `MapView.jsx` 핵심 개념

#### 4.6 useRef (DOM 접근)

```jsx
const mapRef = useRef(null);
const mapContainerRef = useRef(null);

// Leaflet 지도 인스턴스 생성
mapRef.current = L.map(mapContainerRef.current, { ... });
```

**📌 useRef란?**
- React 외부의 값을 저장 (리렌더링해도 유지)
- DOM 요소에 직접 접근할 때 사용

#### 4.7 Leaflet 통합

```jsx
// GeoJSON 레이어 추가
guLayerRef.current = L.geoJSON(data, {
    style: getGuStyle,              // 스타일 함수
    onEachFeature: (feature, layer) => {
        layer.bindTooltip(...)      // 툴팁
        layer.on('click', ...)      // 클릭 이벤트
    }
}).addTo(mapRef.current);
```

**📌 Leaflet 핵심 메서드**
- `L.map()`: 지도 생성
- `L.geoJSON()`: GeoJSON 데이터 → 지도 레이어
- `setStyle()`: 레이어 스타일 변경
- `fitBounds()`: 지도 뷰 조정

---

## 5. 데이터 흐름

```
┌─────────────────────────────────────────────────────────────┐
│                        브라우저                               │
│                                                             │
│  ┌───────────────┐     props      ┌───────────────┐         │
│  │    App.jsx    │ ───────────▶   │  Sidebar.jsx  │         │
│  │   (상태관리)    │               │   (리스트)      │         │
│  │               │     props      │               │         │
│  │   stores      │ ───────────▶   │  MapView.jsx  │         │
│  │   visited     │               │    (지도)       │         │
│  └───────┬───────┘               └───────────────┘         │
│          │                                                  │
│          │ fetch                                            │
│          ▼                                                  │
│  ┌───────────────┐                                          │
│  │  FastAPI      │                                          │
│  │  localhost:   │                                          │
│  │  8000         │                                          │
│  └───────┬───────┘                                          │
│          │                                                  │
│          │ SQL                                              │
│          ▼                                                  │
│  ┌───────────────┐                                          │
│  │  SQLite DB    │                                          │
│  │  starbucks.db │                                          │
│  └───────────────┘                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. 핵심 개념 정리

### React 핵심

| 개념 | 설명 | 사용 예 |
|------|------|---------|
| `useState` | 컴포넌트 상태 관리 | 매장 목록, 방문 기록 |
| `useEffect` | 부수효과 실행 | API 호출, 지도 초기화 |
| `useMemo` | 계산 결과 캐싱 | 구별 통계 계산 |
| `useRef` | 외부 값/DOM 참조 | Leaflet 인스턴스 |
| Props | 부모→자식 데이터 전달 | stores, onSelectGu |

### FastAPI 핵심

| 개념 | 설명 |
|------|------|
| `@app.get/post` | HTTP 엔드포인트 정의 |
| `async def` | 비동기 함수 (동시 처리) |
| Pydantic | 데이터 검증 |
| CORS | 크로스 도메인 허용 |

### Leaflet 핵심

| 메서드 | 설명 |
|--------|------|
| `L.map()` | 지도 인스턴스 생성 |
| `L.geoJSON()` | GeoJSON → 레이어 |
| `setStyle()` | 스타일 변경 |
| `fitBounds()` | 지도 뷰 조정 |
| `bindTooltip()` | 툴팁 추가 |

---

## 🚀 다음 단계

1. **코드 수정해보기**: 색상 변경, 텍스트 수정 등
2. **기능 추가해보기**: 검색 기능, 즐겨찾기 등
3. **더 공부하기**:
   - React 공식 문서: https://react.dev
   - FastAPI 공식 문서: https://fastapi.tiangolo.com
   - Leaflet 문서: https://leafletjs.com

---

**제작**: 김대훈 (kk30100@naver.com), 신동희 (formation442@icloud.com)
