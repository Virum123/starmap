# ============================================================================
# 🎓 LEARNING PROJECT: FastAPI Backend for StarMap Seoul
# ============================================================================
# 
# 📌 왜 FastAPI를 선택했나? (Why FastAPI?)
# ----------------------------------------------------------------------------
# 1. 속도: Flask보다 빠름 (비동기 처리 지원)
# 2. 자동 문서화: /docs 접속하면 API 문서가 자동 생성됨 (Swagger UI)
# 3. 타입 힌트: 파이썬 타입 힌트를 강제해서 버그를 미리 잡아줌
# 4. 현업 표준: 요즘 파이썬 백엔드 신규 프로젝트는 대부분 FastAPI 사용
#
# 📌 Flask와의 차이점
# ----------------------------------------------------------------------------
# Flask:   @app.route('/api/stores')
# FastAPI: @app.get('/api/stores')  <- HTTP 메서드가 더 명확함
#
# Flask:   return jsonify(data)
# FastAPI: return data  <- 자동으로 JSON 변환됨
# ============================================================================

# [1] 필요한 라이브러리 불러오기 (Imports)
# ----------------------------------------------------------------------------
# fastapi: 웹 서버 프레임워크
# uvicorn: FastAPI를 실행시켜주는 ASGI 서버 (Flask의 개발서버 역할)
# sqlite3: 데이터베이스 연결용 (기존과 동일)
# pydantic: 데이터 검증용 (FastAPI의 핵심 파트너)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware  # React와 통신할 때 필요!
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel  # 데이터 형식 정의용
from typing import List, Optional
import sqlite3

# [2] FastAPI 앱 생성
# ----------------------------------------------------------------------------
# 📌 왜 이렇게?
# - FastAPI()를 호출하면 웹 서버 인스턴스가 만들어짐
# - title, description은 자동 생성되는 API 문서에 표시됨

app = FastAPI(
    title="StarMap Seoul API",
    description="스타벅스 매장 방문 기록 관리 API",
    version="2.0.0"
)

# [3] CORS 설정 (Cross-Origin Resource Sharing)
# ----------------------------------------------------------------------------
# 📌 왜 필요한가?
# - 브라우저 보안 정책: 다른 도메인에서 API 호출하면 기본적으로 차단됨
# - React 개발 서버(localhost:5173)에서 FastAPI(localhost:8000)를 호출하려면
#   "이 도메인에서 오는 요청은 허용해!" 라고 명시해야 함
#
# 📌 Flask에서는?
# - flask-cors 라이브러리를 별도로 설치해야 했음
# - FastAPI는 미들웨어로 간단하게 추가 가능

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # React 개발 서버 주소
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메서드 허용 (GET, POST, PUT, DELETE 등)
    allow_headers=["*"],  # 모든 헤더 허용
)


# [4] Pydantic 모델 정의 (데이터 형식 명세서)
# ----------------------------------------------------------------------------
# 📌 왜 Pydantic?
# - API로 주고받는 데이터의 "형태"를 미리 정의함
# - 잘못된 데이터가 들어오면 자동으로 오류 발생 (버그 예방)
# - API 문서에 예시 데이터가 자동 표시됨
#
# 📌 Flask에서는?
# - 이런 기능이 기본 제공 안 됨. 직접 if문으로 검증해야 했음

class Store(BaseModel):
    """매장 정보를 담는 데이터 형식"""
    store_name: str        # 문자열 (필수)
    store_code: int        # 정수 (필수)
    gu: str                # 구 이름
    dong: str              # 동 이름
    lat: float             # 위도 (소수점)
    lng: float             # 경도 (소수점)
    address: str           # 주소
    visited: Optional[int] = 0  # 방문 여부 (선택, 기본값 0)

class VisitUpdate(BaseModel):
    """방문 상태 업데이트 요청 형식"""
    store_code: int
    visited: bool


# [5] 데이터베이스 연결 함수
# ----------------------------------------------------------------------------
# 📌 왜 함수로 분리?
# - 같은 코드를 여러 번 쓰지 않기 위해 (DRY 원칙: Don't Repeat Yourself)
# - 나중에 DB를 바꿀 때 (SQLite → PostgreSQL) 이 함수만 수정하면 됨

def get_db_connection():
    """SQLite 데이터베이스에 연결하고 커넥션을 반환"""
    # 📌 경로 설명: 
    # - backend/ 폴더에서 실행하므로 ../../starbucks.db 로 올라가야 함
    # - starmap-modern/backend/ → starmap-modern/ → starmap/starbucks.db
    import os
    db_path = os.path.join(os.path.dirname(__file__), '..', '..', 'starbucks.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row  # 결과를 딕셔너리처럼 사용 가능하게
    return conn


# [6] API 엔드포인트 정의
# ============================================================================
# 📌 엔드포인트란?
# - URL 주소. 클라이언트가 서버에 요청을 보내는 "문"
# - 예: /api/stores → 매장 목록을 달라는 요청
#
# 📌 HTTP 메서드 종류
# - GET: 데이터를 "읽을" 때 (조회)
# - POST: 데이터를 "만들" 때 (생성)
# - PUT/PATCH: 데이터를 "바꿀" 때 (수정)
# - DELETE: 데이터를 "지울" 때 (삭제)
# ============================================================================

@app.get("/")
async def root():
    """
    루트 경로 - API 소개 메시지
    
    📌 async def란?
    - "비동기 함수"라는 뜻. 여러 요청을 동시에 처리할 수 있게 해줌
    - Flask는 기본이 동기(sync), FastAPI는 기본이 비동기(async)
    - 성능 차이의 핵심!
    """
    return {"message": "StarMap Seoul API v2.0 - FastAPI Edition"}


@app.get("/api/stores", response_model=List[Store])
async def get_all_stores():
    """
    모든 매장 목록 조회
    
    📌 response_model=List[Store] 의미:
    - "이 API는 Store 형식의 리스트를 반환합니다"라고 명시
    - 문서에 자동 반영되고, 반환값 검증도 해줌
    """
    conn = get_db_connection()
    stores = conn.execute("SELECT * FROM stores").fetchall()
    conn.close()
    
    # sqlite3.Row 객체를 딕셔너리로 변환
    return [dict(store) for store in stores]


@app.get("/api/dong-stats")
async def get_dong_stats():
    """
    동별 매장 통계 조회 (기존 Flask API와 동일한 기능)
    
    📌 기존 Flask 코드와 비교:
    # Flask:
    # @app.route('/api/dong-stats')
    # def get_dong_stats():
    #     ...
    #     return jsonify(result)  <- jsonify 필요
    
    # FastAPI:
    # @app.get('/api/dong-stats')
    # async def get_dong_stats():
    #     ...
    #     return result  <- 그냥 반환하면 자동 JSON 변환
    """
    conn = get_db_connection()
    stores = conn.execute("SELECT * FROM stores").fetchall()
    conn.close()
    return [dict(s) for s in stores]


@app.get("/api/stores/{gu_name}")
async def get_stores_by_gu(gu_name: str):
    """
    특정 구의 매장만 조회
    
    📌 경로 파라미터 (Path Parameter):
    - URL에 {gu_name}처럼 변수를 넣을 수 있음
    - /api/stores/강남구 → gu_name = "강남구"
    """
    conn = get_db_connection()
    stores = conn.execute(
        "SELECT * FROM stores WHERE gu = ?", 
        (gu_name,)
    ).fetchall()
    conn.close()
    
    if not stores:
        # 📌 HTTPException: FastAPI의 에러 처리 방법
        # status_code: HTTP 상태 코드 (404 = 찾을 수 없음)
        raise HTTPException(status_code=404, detail=f"'{gu_name}' 구를 찾을 수 없습니다")
    
    return [dict(s) for s in stores]


@app.post("/api/update-visit")
async def update_visit(data: VisitUpdate):
    """
    매장 방문 상태 업데이트
    
    📌 POST 요청 + Pydantic 모델:
    - 클라이언트가 보내는 JSON 데이터가 VisitUpdate 형식과 맞는지 자동 검증
    - 형식이 안 맞으면 422 에러가 자동 발생 (직접 if문 안 써도 됨!)
    
    📌 Flask에서는?
    # data = request.json
    # if 'store_code' not in data:
    #     return jsonify({"error": "store_code is required"}), 400
    # 이런 식으로 일일이 검증해야 했음
    """
    conn = get_db_connection()
    conn.execute(
        "UPDATE stores SET visited = ? WHERE store_code = ?",
        (1 if data.visited else 0, data.store_code)
    )
    conn.commit()
    conn.close()
    return {"status": "success", "store_code": data.store_code}


# [7] 서버 실행 (개발용)
# ============================================================================
# 📌 uvicorn이란?
# - FastAPI를 실행시켜주는 ASGI 서버
# - Flask의 app.run(debug=True)와 비슷한 역할
#
# 📌 실행 방법:
# 터미널에서: uvicorn main:app --reload
# - main: 이 파일 이름 (main.py)
# - app: FastAPI 인스턴스 변수 이름
# - --reload: 코드 수정하면 자동 재시작 (개발용)
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
