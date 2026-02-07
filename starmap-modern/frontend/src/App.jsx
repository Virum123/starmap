// ============================================================================
// App.jsx - 메인 애플리케이션 컴포넌트
// ============================================================================
//
// 📚 역할:
// - 전체 앱의 상태(state) 관리
// - 자식 컴포넌트들을 조합하여 UI 구성
// - 데이터 fetching 및 localStorage 연동
// - 축하 효과 트리거
//
// 📌 React 핵심 개념:
// - useState: 컴포넌트의 상태(데이터)를 관리
// - useEffect: 컴포넌트 마운트/업데이트 시 부수효과 실행
// - 컴포넌트 합성: 작은 컴포넌트를 조합하여 복잡한 UI 구성
// ============================================================================

import { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import ProfileModal from './components/ProfileModal';
import { celebrateDongComplete, celebrateGuComplete } from './utils/celebration';
import { trackStoreVisit, trackAchievement, trackReset, trackUserProfile, trackViewGu } from './utils/analytics';

// API 서버 주소 (FastAPI 백엔드)
const API_URL = 'http://localhost:8000';

function App() {
    // =========================================================================
    // 📦 상태(State) 정의
    // =========================================================================

    // 매장 데이터 (API에서 가져옴)
    const [stores, setStores] = useState([]);

    // 방문한 매장 이름을 저장하는 Set (빠른 검색을 위해 Set 사용)
    const [visitedStores, setVisitedStores] = useState(new Set());

    // 네비게이션 상태
    const [currentLevel, setCurrentLevel] = useState('GU');  // 'GU' | 'DONG'
    const [currentGu, setCurrentGu] = useState(null);        // 선택한 구 이름

    // UI 상태
    const [loading, setLoading] = useState(true);
    const [showProfile, setShowProfile] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);

    // 사용자 프로필 (성별, 나이대)
    const [userProfile, setUserProfile] = useState(null);

    // =========================================================================
    // 🔄 초기화 (컴포넌트 마운트 시 1회 실행)
    // =========================================================================
    useEffect(() => {
        fetchStores();      // API에서 매장 데이터 가져오기
        loadSavedData();    // localStorage에서 저장된 데이터 복원
    }, []);  // 빈 배열 = 마운트 시 1회만 실행

    // =========================================================================
    // 🌐 API 호출: 매장 데이터 가져오기
    // =========================================================================
    async function fetchStores() {
        try {
            const response = await fetch(`${API_URL}/api/stores`);
            const data = await response.json();
            setStores(data);
            setLoading(false);
        } catch (error) {
            console.error('API 호출 실패:', error);
            setLoading(false);
        }
    }

    // =========================================================================
    // 💾 localStorage에서 저장된 데이터 복원
    // =========================================================================
    function loadSavedData() {
        // 방문 기록 복원
        const savedVisits = localStorage.getItem('visited_stores');
        if (savedVisits) {
            setVisitedStores(new Set(JSON.parse(savedVisits)));
        }

        // 프로필 복원 (없으면 환영 모달 표시)
        const savedProfile = localStorage.getItem('user_profile');
        if (savedProfile) {
            setUserProfile(JSON.parse(savedProfile));
        } else {
            setShowWelcome(true);  // 첫 방문자에게 프로필 입력 요청
        }
    }

    // =========================================================================
    // ✅ 매장 방문 토글 + 축하 효과
    // =========================================================================
    function toggleVisit(storeName) {
        const store = stores.find(s => s.store_name === storeName);
        const wasVisited = visitedStores.has(storeName);

        setVisitedStores(prev => {
            const newSet = new Set(prev);

            // 토글: 있으면 제거, 없으면 추가
            if (newSet.has(storeName)) {
                newSet.delete(storeName);
                if (store) trackStoreVisit(storeName, store.gu, 'remove'); // 🔴 GA4: 방문 취소
            } else {
                newSet.add(storeName);
                if (store) trackStoreVisit(storeName, store.gu, 'add'); // 🟢 GA4: 방문 체크
            }

            // localStorage에 저장 (새로고침해도 유지)
            localStorage.setItem('visited_stores', JSON.stringify([...newSet]));

            // 체크 시에만 축하 효과 확인
            if (!wasVisited && store) {
                checkCelebration(store, newSet);
            }

            return newSet;
        });
    }

    // =========================================================================
    // 🎉 축하 효과 체크 (동/구 완료 시)
    // =========================================================================
    function checkCelebration(store, newVisitedSet) {
        setTimeout(() => {
            // 동 완료 체크: 해당 동의 모든 매장 방문 여부
            const dongStores = stores.filter(s => s.gu === store.gu && s.dong === store.dong);
            const dongVisited = dongStores.filter(s => newVisitedSet.has(s.store_name)).length;

            if (dongStores.length > 0 && dongVisited === dongStores.length) {
                celebrateDongComplete();  // 꽃가루 효과
                trackAchievement('dong_completion', store.gu, store.dong); // 🏆 GA4: 동 정복
            }

            // 구 완료 체크: 해당 구의 모든 매장 방문 여부
            const guStores = stores.filter(s => s.gu === store.gu);
            const guVisited = guStores.filter(s => newVisitedSet.has(s.store_name)).length;

            if (guStores.length > 0 && guVisited === guStores.length) {
                celebrateGuComplete();  // 꽃가루 + 폭죽 효과
                trackAchievement('gu_completion', store.gu); // 🏆 GA4: 구 정복
            }
        }, 100);
    }

    // =========================================================================
    // 🧭 네비게이션 함수들
    // =========================================================================

    // 구 선택 → 동 레벨로 이동
    const handleSelectGu = (guName) => {
        setCurrentGu(guName);
        setCurrentLevel('DONG');
        trackViewGu(guName); // 🗺️ GA4: 구 상세보기
    };

    // 뒤로가기 → 서울 전체(구 레벨)로 이동
    const handleBack = () => {
        setCurrentGu(null);
        setCurrentLevel('GU');
    };

    // 초기화: 체크 내역만 삭제 (프로필은 유지)
    const handleReset = () => {
        if (window.confirm('체크 내역을 초기화하시겠습니까?\n(프로필 정보는 유지됩니다)')) {
            setVisitedStores(new Set());
            localStorage.removeItem('visited_stores');
            trackReset(); // 🔄 GA4: 초기화
        }
    };

    // 프로필 저장
    const handleSaveProfile = (profile) => {
        setUserProfile(profile);
        localStorage.setItem('user_profile', JSON.stringify(profile));

        // GA4: 프로필 저장 (신규/수정 구분)
        trackUserProfile(profile.gender, profile.ageGroup, showWelcome);

        setShowWelcome(false);
        setShowProfile(false);
    };

    // =========================================================================
    // 🎨 렌더링
    // =========================================================================

    // 로딩 중일 때
    if (loading) {
        return <div className="loading">데이터 로딩 중...</div>;
    }

    return (
        <div className="app-container">
            {/* 사이드바: 매장 목록 + 통계 */}
            <Sidebar
                stores={stores}
                visitedStores={visitedStores}
                currentLevel={currentLevel}
                currentGu={currentGu}
                onToggleVisit={toggleVisit}
                onSelectGu={handleSelectGu}
                onBack={handleBack}
                onReset={handleReset}
            />

            {/* 지도: Leaflet 기반 */}
            <MapView
                stores={stores}
                visitedStores={visitedStores}
                currentGu={currentGu}
                onSelectGu={handleSelectGu}
                onShowProfile={() => setShowProfile(true)}
                onBack={handleBack}
            />

            {/* 첫 방문 환영 모달: 프로필 입력 */}
            {showWelcome && (
                <ProfileModal
                    onSave={handleSaveProfile}
                    initialData={null}
                    isWelcome={true}
                />
            )}

            {/* 프로필 수정 모달: 별(★) 버튼 클릭 시 */}
            {showProfile && (
                <ProfileModal
                    onSave={handleSaveProfile}
                    onClose={() => setShowProfile(false)}
                    initialData={userProfile}
                    isWelcome={false}
                />
            )}
        </div>
    );
}

export default App;
