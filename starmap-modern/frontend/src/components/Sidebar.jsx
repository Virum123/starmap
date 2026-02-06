// ============================================================================
// Sidebar.jsx - 사이드바 컴포넌트
// ============================================================================
// 
// 📚 역할:
// - 구/동 목록 표시 및 네비게이션
// - 매장 방문 체크 기능
// - 통계 (Total, Visited, Progress) 표시
// - INFO 모달 (사용법) / 문의 모달 (이메일) 관리
//
// 📌 주요 개념:
// - useMemo: 계산 비용이 큰 값을 캐싱하여 불필요한 재계산 방지
// - props drilling: 부모(App)에서 자식(Sidebar)으로 데이터/함수 전달
// ============================================================================

import { useMemo, useState } from 'react';

function Sidebar({
    stores,              // 전체 매장 배열
    visitedStores,       // 방문한 매장 Set
    currentLevel,        // 현재 뷰 레벨 ('GU' | 'DONG')
    currentGu,           // 현재 선택된 구 이름
    onToggleVisit,       // 매장 방문 토글 함수
    onSelectGu,          // 구 선택 함수
    onBack,              // 뒤로가기 함수
    onReset              // 초기화 함수
}) {
    // 📌 모달 상태 관리 (각각 독립적)
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);

    // =========================================================================
    // 📊 구별 통계 계산 (useMemo로 최적화)
    // =========================================================================
    // stores나 visitedStores가 변경될 때만 재계산됨
    const guStats = useMemo(() => {
        const stats = {};
        stores.forEach(store => {
            if (!stats[store.gu]) stats[store.gu] = { total: 0, visited: 0 };
            stats[store.gu].total++;
            if (visitedStores.has(store.store_name)) stats[store.gu].visited++;
        });
        return stats;
    }, [stores, visitedStores]);

    // =========================================================================
    // 📊 동별 매장 그룹화 (현재 구 선택 시)
    // =========================================================================
    const storesByDong = useMemo(() => {
        if (!currentGu) return {};

        const grouped = {};
        stores.filter(s => s.gu === currentGu).forEach(store => {
            if (!grouped[store.dong]) grouped[store.dong] = [];
            grouped[store.dong].push(store);
        });

        // 동 이름 가나다순 정렬
        return Object.fromEntries(
            Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0], 'ko'))
        );
    }, [stores, currentGu]);

    // =========================================================================
    // 📊 통계 값 계산
    // =========================================================================
    const totalVisited = visitedStores.size;
    const totalStores = stores.length;
    const currentGuStats = currentGu ? (guStats[currentGu] || { total: 0, visited: 0 }) : null;

    // 진행율 계산 (0으로 나누기 방지)
    const progress = currentLevel === 'DONG'
        ? (currentGuStats?.total > 0 ? Math.round(currentGuStats.visited / currentGuStats.total * 100) : 0)
        : (totalStores > 0 ? Math.round(totalVisited / totalStores * 100) : 0);

    // =========================================================================
    // 🎨 렌더링
    // =========================================================================
    return (
        <aside className="sidebar">
            {/* ============================================================
                헤더 영역: 타이틀/버튼 + 통계
            ============================================================ */}
            <header className="sidebar-header">
                <div className="header-top">
                    {currentLevel === 'DONG' ? (
                        // 동 레벨: 초기화 + 뒤로가기 버튼
                        <>
                            <button className="reset-btn" onClick={onReset}>+ 초기화</button>
                            <button className="back-btn" onClick={onBack}>← 뒤로가기</button>
                        </>
                    ) : (
                        // 구 레벨: 타이틀 + INFO/문의/초기화 링크
                        <>
                            <h1 className="app-title">StarMap</h1>
                            <div className="header-actions">
                                <span onClick={() => setShowInfoModal(true)}>INFO</span>
                                <span onClick={() => setShowContactModal(true)}>문의</span>
                                <span onClick={onReset}>초기화</span>
                            </div>
                        </>
                    )}
                </div>

                {/* 통계 박스 */}
                <div className="stats-container">
                    <div className="stat-item">
                        <span className="stat-label">Total</span>
                        <span className="stat-value">
                            {currentLevel === 'DONG' ? currentGuStats?.total : totalStores}
                        </span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Visited</span>
                        <span className="stat-value highlight">
                            {currentLevel === 'DONG' ? currentGuStats?.visited : totalVisited}
                        </span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Progress</span>
                        <span className="stat-value highlight">{progress}%</span>
                    </div>
                </div>
            </header>

            {/* ============================================================
                리스트 영역: 구 목록 또는 동/매장 목록
            ============================================================ */}
            <div className="list-container">
                <ul className="item-list">
                    {currentLevel === 'GU' ? (
                        // 구 목록 렌더링
                        Object.entries(guStats)
                            .sort((a, b) => a[0].localeCompare(b[0], 'ko'))
                            .map(([guName, stats]) => (
                                <li key={guName} className="gu-item" onClick={() => onSelectGu(guName)}>
                                    <span className="gu-name">{guName}</span>
                                    <span className="gu-count">{stats.visited}/{stats.total}</span>
                                </li>
                            ))
                    ) : (
                        // 동별 매장 목록 렌더링
                        Object.entries(storesByDong).map(([dongName, dongStores]) => (
                            <div key={dongName}>
                                <div className="dong-group-header">{dongName}</div>
                                {dongStores.map(store => (
                                    <li
                                        key={store.store_code}
                                        className={`store-item ${visitedStores.has(store.store_name) ? 'visited' : ''}`}
                                        onClick={() => onToggleVisit(store.store_name)}
                                    >
                                        <div className="checkbox-wrapper">
                                            <div className="custom-checkbox">
                                                {visitedStores.has(store.store_name) && '✔'}
                                            </div>
                                        </div>
                                        <div className="store-info">
                                            <div className="store-name">{store.store_name}</div>
                                        </div>
                                    </li>
                                ))}
                            </div>
                        ))
                    )}
                </ul>
            </div>

            {/* ============================================================
                푸터: 제작자 정보
            ============================================================ */}
            <footer className="sidebar-footer">
                <p>김대훈: <a href="mailto:kk30100@naver.com">kk30100@naver.com</a></p>
                <p>신동희: <a href="mailto:formation442@icloud.com">formation442@icloud.com</a></p>
            </footer>

            {/* ============================================================
                INFO 모달: 사용 방법 안내
            ============================================================ */}
            {showInfoModal && (
                <div className="modal-overlay" onClick={() => setShowInfoModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>📋 사용 방법</h2>
                        <ul>
                            <li>🗺️ <strong>지도에서 구를 클릭</strong>하면 해당 구의 동 단위 지도와 매장 목록이 표시됩니다.</li>
                            <li>✅ <strong>매장을 클릭</strong>하면 방문 여부를 체크/해제할 수 있습니다.</li>
                            <li>🔄 <strong>초기화</strong> 버튼을 누르면 체크 내역이 삭제됩니다.</li>
                            <li>🖱️ <strong>지도에서 우클릭</strong>하면 서울 전체 화면으로 돌아갑니다.</li>
                        </ul>
                        <h3>🎯 목표</h3>
                        <p>서울시 내 모든 스타벅스 매장을 방문하고 100% 달성하세요!</p>
                        <h3>🎉 축하 효과</h3>
                        <p>동을 완료하면 꽃가루가, 구를 완료하면 폭죽이 터집니다!</p>
                        <button className="modal-close-btn" onClick={() => setShowInfoModal(false)}>
                            닫기
                        </button>
                    </div>
                </div>
            )}

            {/* ============================================================
                문의 모달: 이메일만 표시
            ============================================================ */}
            {showContactModal && (
                <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
                    <div className="modal-content contact-modal" onClick={e => e.stopPropagation()}>
                        <h2>📧 문의</h2>
                        <p className="contact-email">kk30100@naver.com</p>
                        <button className="modal-close-btn" onClick={() => setShowContactModal(false)}>
                            닫기
                        </button>
                    </div>
                </div>
            )}
        </aside>
    );
}

export default Sidebar;
