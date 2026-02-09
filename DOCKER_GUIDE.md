# StarMap Seoul - Docker 환경 구성 가이드

이 가이드는 StarMap Seoul 프로젝트를 Docker로 컨테이너화하고 실행하는 전체 과정을 설명합니다.

## 📋 목차

1. [사전 준비](#사전-준비)
2. [Docker 설치](#docker-설치)
3. [프로젝트 파일 구성](#프로젝트-파일-구성)
4. [Docker 이미지 빌드](#docker-이미지-빌드)
5. [컨테이너 실행](#컨테이너-실행)
6. [접속 및 확인](#접속-및-확인)
7. [컨테이너 관리](#컨테이너-관리)
8. [문제 해결](#문제-해결)

---

## 사전 준비

### 필요한 것들
- Windows 10/11 (WSL 2 사용) 또는 macOS, Linux
- 최소 8GB RAM
- 최소 10GB 여유 디스크 공간
- 인터넷 연결 (이미지 다운로드용)

---

## Docker 설치

### Windows (WSL 2)

1. **WSL 2 설치** (PowerShell 관리자 권한으로 실행)
   ```powershell
   wsl --install
   ```

2. **Docker Desktop 다운로드 및 설치**
   - https://www.docker.com/products/docker-desktop 방문
   - "Download for Windows" 클릭
   - 다운로드한 설치 파일 실행
   - 설치 중 "Use WSL 2 instead of Hyper-V" 옵션 선택

3. **Docker Desktop 시작**
   - 시작 메뉴에서 "Docker Desktop" 실행
   - 시작 시 Docker가 실행될 때까지 대기 (1-2분 소요)

4. **설치 확인**
   ```powershell
   docker --version
   docker-compose --version
   ```

### macOS

1. **Docker Desktop 다운로드**
   - https://www.docker.com/products/docker-desktop 방문
   - "Download for Mac" 클릭 (Intel 또는 Apple Silicon 선택)

2. **설치 및 실행**
   - `.dmg` 파일을 열고 Docker를 Applications 폴더로 드래그
   - Applications에서 Docker 실행
   - 상단 메뉴바에 Docker 아이콘이 나타날 때까지 대기

3. **설치 확인**
   ```bash
   docker --version
   docker-compose --version
   ```

### Linux (Ubuntu/Debian 예시)

```bash
# 이전 버전 제거
sudo apt-get remove docker docker-engine docker.io containerd runc

# 필수 패키지 설치
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg lsb-release

# Docker GPG 키 추가
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Docker 저장소 설정
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker 설치
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 현재 사용자를 docker 그룹에 추가 (sudo 없이 사용)
sudo usermod -aG docker $USER
newgrp docker

# 설치 확인
docker --version
docker compose version
```

---

## 프로젝트 파일 구성

프로젝트 루트에 다음 파일들을 생성해야 합니다:

### 1. Backend Dockerfile

`starmap-modern/backend/Dockerfile` 파일 생성:

```dockerfile
# Python 3.11 베이스 이미지 사용
FROM python:3.11-slim

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 패키지 업데이트 및 필수 도구 설치
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 파일 복사
COPY requirements.txt .

# 의존성 설치
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY . .

# 데이터베이스 파일 복사 (상위 디렉토리에서)
COPY ../../starbucks.db /app/starbucks.db

# 포트 노출
EXPOSE 8000

# FastAPI 서버 실행
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2. Backend requirements.txt 업데이트

`starmap-modern/backend/requirements.txt` 파일 생성:

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3
```

### 3. Frontend Dockerfile

`starmap-modern/frontend/Dockerfile` 파일 생성:

```dockerfile
# 멀티 스테이지 빌드

# Stage 1: Build
FROM node:18-alpine as builder

WORKDIR /app

# 의존성 파일 복사
COPY package.json package-lock.json* ./

# 의존성 설치
RUN npm ci

# 소스 코드 복사
COPY . .

# 프로덕션 빌드
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# 빌드된 파일을 Nginx로 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx 설정 (SPA 라우팅 지원)
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /api { \
        proxy_pass http://backend:8000; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 4. Docker Compose 설정

프로젝트 루트에 `docker-compose.yml` 파일 생성:

```yaml
version: '3.8'

services:
  # Backend Service (FastAPI)
  backend:
    build:
      context: ./starmap-modern/backend
      dockerfile: Dockerfile
    container_name: starmap-backend
    ports:
      - "8000:8000"
    volumes:
      # 데이터베이스를 호스트와 공유 (데이터 영속성)
      - ./starbucks.db:/app/starbucks.db
      # 정적 파일 공유
      - ./static:/app/static
    environment:
      - PYTHONUNBUFFERED=1
    restart: unless-stopped
    networks:
      - starmap-network

  # Frontend Service (React + Nginx)
  frontend:
    build:
      context: ./starmap-modern/frontend
      dockerfile: Dockerfile
    container_name: starmap-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - starmap-network

networks:
  starmap-network:
    driver: bridge
```

### 5. .dockerignore 파일

프로젝트 루트에 `.dockerignore` 파일 생성:

```
# Backend
starmap-modern/backend/.venv
starmap-modern/backend/__pycache__
starmap-modern/backend/*.pyc

# Frontend
starmap-modern/frontend/node_modules
starmap-modern/frontend/dist
starmap-modern/frontend/.vite

# Git
.git
.gitignore

# IDE
.vscode
.idea

# 기타
*.log
.DS_Store
```

---

## Docker 이미지 빌드

### 1. 프로젝트 디렉토리로 이동

```bash
cd c:\Users\Administrator\Desktop\star\starmap
```

### 2. Docker Compose로 이미지 빌드

```bash
docker-compose build
```

이 명령은:
- Backend 이미지 빌드 (Python 환경 + FastAPI)
- Frontend 이미지 빌드 (Node.js로 빌드 후 Nginx로 서빙)
- 첫 빌드는 5-10분 정도 소요될 수 있음

### 3. 빌드 확인

```bash
docker images
```

다음과 유사한 출력이 표시되어야 합니다:
```
REPOSITORY              TAG       IMAGE ID       CREATED         SIZE
starmap-frontend        latest    abc123def456   2 minutes ago   25MB
starmap-backend         latest    def456ghi789   3 minutes ago   180MB
```

---

## 컨테이너 실행

### 1. 컨테이너 시작

```bash
docker-compose up -d
```

옵션 설명:
- `-d`: 백그라운드(detached) 모드로 실행
- 로그를 보고 싶다면 `-d` 제거

### 2. 실행 중인 컨테이너 확인

```bash
docker-compose ps
```

출력 예시:
```
NAME                 COMMAND                  SERVICE    STATUS    PORTS
starmap-backend      "uvicorn main:app --…"   backend    Up        0.0.0.0:8000->8000/tcp
starmap-frontend     "/docker-entrypoint.…"   frontend   Up        0.0.0.0:80->80/tcp
```

### 3. 로그 확인

전체 로그:
```bash
docker-compose logs
```

특정 서비스 로그:
```bash
docker-compose logs backend
docker-compose logs frontend
```

실시간 로그 스트리밍:
```bash
docker-compose logs -f
```

---

## 접속 및 확인

### 1. 웹 애플리케이션 접속

브라우저에서 다음 URL로 접속:

- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs

### 2. 헬스체크

Backend 상태 확인:
```bash
curl http://localhost:8000
```

또는 브라우저에서 http://localhost:8000 접속

---

## 컨테이너 관리

### 컨테이너 중지

```bash
docker-compose stop
```

### 컨테이너 재시작

```bash
docker-compose restart
```

### 컨테이너 중지 및 제거

```bash
docker-compose down
```

### 컨테이너 + 볼륨 모두 제거

> ⚠️ **경고**: 데이터베이스 데이터도 삭제됩니다!

```bash
docker-compose down -v
```

### 이미지 재빌드 (코드 수정 후)

```bash
docker-compose build --no-cache
docker-compose up -d
```

### 특정 서비스만 재시작

```bash
docker-compose restart backend
```

### 컨테이너 내부 접속 (디버깅)

Backend 컨테이너:
```bash
docker exec -it starmap-backend /bin/bash
```

Frontend 컨테이너:
```bash
docker exec -it starmap-frontend /bin/sh
```

---

## 개발 환경 vs 프로덕션 환경

### 개발 환경 (Hot Reload 지원)

개발 중에는 코드 변경 시 자동 재시작이 필요합니다.

`docker-compose.dev.yml` 파일 생성:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./starmap-modern/backend
    volumes:
      - ./starmap-modern/backend:/app
      - ./starbucks.db:/app/starbucks.db
      - ./static:/app/static
    ports:
      - "8000:8000"
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    networks:
      - starmap-network

  frontend:
    build:
      context: ./starmap-modern/frontend
      target: builder  # 빌드 스테이지만 사용
    volumes:
      - ./starmap-modern/frontend:/app
      - /app/node_modules
    ports:
      - "5173:5173"
    command: npm run dev -- --host
    networks:
      - starmap-network

networks:
  starmap-network:
    driver: bridge
```

개발 모드 실행:
```bash
docker-compose -f docker-compose.dev.yml up
```

---

## 문제 해결

### 1. 포트가 이미 사용 중

**증상**: `Bind for 0.0.0.0:80 failed: port is already allocated`

**해결**:
```bash
# Windows에서 포트 사용 중인 프로세스 확인
netstat -ano | findstr :80

# 해당 프로세스 종료 (PID는 위 명령에서 확인)
taskkill /PID <PID> /F

# 또는 docker-compose.yml에서 포트 변경
ports:
  - "8080:80"  # 80 대신 8080 사용
```

### 2. 이미지 빌드 실패

**해결**:
```bash
# Docker 캐시 삭제 후 재빌드
docker-compose build --no-cache

# 미사용 이미지 정리
docker image prune -a
```

### 3. 데이터베이스 파일 접근 오류

**증상**: `unable to open database file`

**해결**:
```bash
# 데이터베이스 파일 권한 확인
chmod 666 starbucks.db

# Docker 컨테이너 재시작
docker-compose restart backend
```

### 4. 컨테이너가 즉시 종료됨

**진단**:
```bash
docker-compose logs backend
docker-compose logs frontend
```

**일반적인 원인**:
- 의존성 설치 실패 → requirements.txt 또는 package.json 확인
- 포트 충돌 → 포트 변경
- 설정 오류 → 로그 확인

### 5. 네트워크 연결 문제

**해결**:
```bash
# Docker 네트워크 재생성
docker-compose down
docker network prune
docker-compose up -d
```

### 6. Windows에서 줄바꿈 문제

**증상**: shell script 실행 오류

**해결**:
```bash
# Git 설정 변경
git config --global core.autocrlf false

# 파일 다시 체크아웃
git rm --cached -r .
git reset --hard
```

---

## 유용한 Docker 명령어

```bash
# 모든 컨테이너 확인
docker ps -a

# 컨테이너 리소스 사용량 확인
docker stats

# 디스크 사용량 확인
docker system df

# 미사용 리소스 정리
docker system prune -a

# 특정 컨테이너의 로그만 보기
docker logs starmap-backend -f

# 컨테이너 환경변수 확인
docker exec starmap-backend env

# Docker Compose 설정 검증
docker-compose config
```

---

## 프로덕션 배포 팁

### 1. 환경 변수 사용

`.env` 파일 생성:
```env
BACKEND_PORT=8000
FRONTEND_PORT=80
DATABASE_PATH=./starbucks.db
```

`docker-compose.yml`에서 사용:
```yaml
services:
  backend:
    ports:
      - "${BACKEND_PORT}:8000"
```

### 2. 헬스체크 추가

```yaml
services:
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 3. 로그 관리

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 4. 리소스 제한

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

---

## 요약 체크리스트

- [ ] Docker Desktop 설치 및 실행 확인
- [ ] 프로젝트에 Dockerfile들 생성
- [ ] docker-compose.yml 생성
- [ ] `.dockerignore` 생성
- [ ] `docker-compose build` 실행
- [ ] `docker-compose up -d` 실행
- [ ] http://localhost 접속 확인
- [ ] http://localhost:8000/docs API 문서 확인

---

## 추가 리소스

- [Docker 공식 문서](https://docs.docker.com/)
- [Docker Compose 문서](https://docs.docker.com/compose/)
- [FastAPI Docker 배포](https://fastapi.tiangolo.com/deployment/docker/)
- [Vite 프로덕션 빌드](https://vitejs.dev/guide/build.html)

---

**작성일**: 2026-02-08  
**버전**: 1.0
