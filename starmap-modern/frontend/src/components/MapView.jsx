// ============================================================================
// MapView.jsx - 지도 컴포넌트 (Leaflet 기반)
// ============================================================================
//
// 📚 역할:
// - 서울시 구/동 경계를 GeoJSON으로 표시
// - 방문율에 따른 색상 그라데이션 적용
// - 구 클릭 시 동 레벨로 드릴다운
// - 플로팅 버튼 (프로필)
//
// 📌 Leaflet 핵심 개념:
// - L.map(): 지도 인스턴스 생성
// - L.geoJSON(): GeoJSON 데이터를 지도 레이어로 변환
// - setStyle(): 레이어 스타일 동적 변경
// - fitBounds(): 지도 뷰를 특정 영역에 맞춤
//
// 📌 React + Leaflet 통합:
// - useRef: Leaflet 인스턴스를 React 외부에서 관리
// - useEffect: 컴포넌트 생명주기에 맞춰 지도 초기화/정리
// ============================================================================

import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ============================================================================
// 🎨 색상 유틸리티 함수
// ============================================================================
// 방문율(0~1)에 따라 흰색(0%)에서 초록색(100%)으로 그라데이션
function getColor(ratio, isNoStore = false) {
    // 매장이 없는 동은 100% 완료 색상 (스타벅스 초록)
    if (isNoStore) return '#00704a';

    // RGB 그라데이션 계산
    const startR = 255, startG = 255, startB = 255;  // 흰색
    const endR = 0, endG = 112, endB = 74;           // 스타벅스 초록

    const r = Math.round(startR + (endR - startR) * ratio);
    const g = Math.round(startG + (endG - startG) * ratio);
    const b = Math.round(startB + (endB - startB) * ratio);

    return `rgb(${r}, ${g}, ${b})`;
}

function MapView({ stores, visitedStores, currentGu, onSelectGu, onShowProfile, onBack }) {
    // =========================================================================
    // 📌 Ref 선언 (Leaflet 인스턴스를 React 외부에서 관리)
    // =========================================================================
    const mapContainerRef = useRef(null);   // DOM 요소 참조
    const mapRef = useRef(null);            // Leaflet 지도 인스턴스
    const guLayerRef = useRef(null);        // 구 경계 레이어
    const dongLayerRef = useRef(null);      // 동 경계 레이어
    const seoulBoundsRef = useRef(null);    // 서울 전체 범위

    // =========================================================================
    // 📊 구별 통계 계산 (useMemo로 최적화)
    // =========================================================================
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
    // 🎨 스타일 정의
    // =========================================================================

    // 구 레이어 스타일 (방문율 기반)
    const getGuStyle = (feature) => {
        const name = feature.properties.name || feature.properties.SIG_KOR_NM;
        const stat = guStats[name] || { total: 0, visited: 0 };
        const ratio = stat.total > 0 ? stat.visited / stat.total : 0;
        return {
            fillColor: getColor(ratio),
            weight: 2,
            opacity: 1,
            color: '#1e3932',
            fillOpacity: 1
        };
    };

    // 숨김 스타일 (레이어를 완전히 숨김)
    const hiddenStyle = {
        opacity: 0,
        fillOpacity: 0,
        weight: 0,
        interactive: false
    };

    // =========================================================================
    // 🗺️ 지도 초기화 (컴포넌트 마운트 시 1회)
    // =========================================================================
    useEffect(() => {
        // 이미 초기화된 경우 중복 방지
        if (mapRef.current) return;

        // Leaflet 지도 인스턴스 생성
        mapRef.current = L.map(mapContainerRef.current, {
            center: [37.5665, 126.9780],  // 서울 중심 좌표
            zoom: 11,
            zoomControl: false,           // 줌 컨트롤 숨김
            attributionControl: false     // 저작권 표시 숨김
        });

        // 우클릭 시 서울 전체보기로 복귀
        mapContainerRef.current.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (onBack) onBack();
        });

        // 구 경계 GeoJSON 로드
        fetch('/static/seoul_gu_map.geojson')
            .then(r => r.json())
            .then(data => {
                guLayerRef.current = L.geoJSON(data, {
                    style: getGuStyle,
                    onEachFeature: (feature, layer) => {
                        const name = feature.properties.name || feature.properties.SIG_KOR_NM;

                        // 툴팁 (마우스 오버 시 구 이름 표시)
                        layer.bindTooltip(`<b>${name}</b>`, { sticky: true });

                        // 이벤트 핸들러
                        layer.on('click', () => onSelectGu && onSelectGu(name));
                        layer.on('mouseover', () => layer.setStyle({ weight: 3 }));
                        layer.on('mouseout', () => layer.setStyle({ weight: 2 }));
                    }
                }).addTo(mapRef.current);

                // 서울 전체 범위 저장 및 지도 맞춤
                seoulBoundsRef.current = guLayerRef.current.getBounds();
                mapRef.current.fitBounds(seoulBoundsRef.current, {
                    padding: [50, 50],
                    maxZoom: 11
                });
                mapRef.current.setMaxBounds(seoulBoundsRef.current.pad(0.2));
            });

        // 동 경계 GeoJSON 로드 (초기엔 숨김)
        fetch('/static/seoul_map.geojson')
            .then(r => r.json())
            .then(data => {
                dongLayerRef.current = L.geoJSON(data, {
                    style: hiddenStyle,  // 초기 상태: 숨김
                    onEachFeature: (feature, layer) => {
                        const dongName = feature.properties.adm_nm.split(' ').pop();
                        layer.bindTooltip(`<b>${dongName}</b>`, { sticky: true });
                    }
                }).addTo(mapRef.current);
            });

        // 컴포넌트 언마운트 시 지도 정리
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // =========================================================================
    // 🔄 구 선택 시 레이어 업데이트
    // =========================================================================
    useEffect(() => {
        if (!mapRef.current || !guLayerRef.current || !dongLayerRef.current) return;

        if (currentGu) {
            // ===== 동 레벨 보기 =====

            // 1. 구 레이어 숨김
            guLayerRef.current.eachLayer(layer => {
                layer.setStyle(hiddenStyle);
                layer.closeTooltip();
                layer.unbindTooltip();
            });

            // 2. 동별 통계 계산
            const dongStats = {};
            stores.filter(s => s.gu === currentGu).forEach(s => {
                if (!dongStats[s.dong]) dongStats[s.dong] = { total: 0, visited: 0 };
                dongStats[s.dong].total++;
                if (visitedStores.has(s.store_name)) dongStats[s.dong].visited++;
            });

            // 3. 선택한 구의 동만 표시
            let guBounds = null;
            dongLayerRef.current.eachLayer(layer => {
                const guName = layer.feature.properties.sggnm;

                if (guName === currentGu) {
                    const dongName = layer.feature.properties.adm_nm.split(' ').pop();
                    const stat = dongStats[dongName] || { total: 0, visited: 0 };
                    const ratio = stat.total > 0 ? stat.visited / stat.total : 0;
                    const isNoStore = stat.total === 0;

                    // 동 스타일 적용
                    layer.setStyle({
                        fillColor: getColor(ratio, isNoStore),
                        weight: 1,
                        color: '#1e3932',
                        opacity: 1,
                        fillOpacity: 1,
                        interactive: true
                    });
                    layer.bindTooltip(`<b>${dongName}</b>`, { sticky: true });

                    // 범위 계산
                    if (!guBounds) guBounds = layer.getBounds();
                    else guBounds.extend(layer.getBounds());
                } else {
                    // 다른 구의 동은 숨김
                    layer.setStyle(hiddenStyle);
                    layer.closeTooltip();
                }
            });

            // 4. 지도를 해당 구에 맞춤
            if (guBounds) {
                mapRef.current.setMaxBounds(null);
                mapRef.current.fitBounds(guBounds, { padding: [60, 60] });
                setTimeout(() => mapRef.current.setMaxBounds(guBounds.pad(0.3)), 300);
            }
        } else {
            // ===== 서울 전체 보기 =====
            mapRef.current.setMaxBounds(null);

            // 구 레이어 표시
            guLayerRef.current.eachLayer(layer => {
                const name = layer.feature.properties.name || layer.feature.properties.SIG_KOR_NM;
                layer.setStyle(getGuStyle(layer.feature));
                layer.bindTooltip(`<b>${name}</b>`, { sticky: true });
            });

            // 동 레이어 숨김
            dongLayerRef.current.eachLayer(layer => {
                layer.setStyle(hiddenStyle);
                layer.closeTooltip();
            });

            // 서울 전체로 지도 맞춤
            if (seoulBoundsRef.current) {
                mapRef.current.fitBounds(seoulBoundsRef.current, {
                    padding: [50, 50],
                    maxZoom: 11
                });
                setTimeout(() => {
                    mapRef.current.setMaxBounds(seoulBoundsRef.current.pad(0.2));
                }, 300);
            }
        }
    }, [currentGu, stores, visitedStores, guStats]);

    // =========================================================================
    // 🔄 방문 상태 변경 시 구 레이어 색상 업데이트
    // =========================================================================
    useEffect(() => {
        if (!currentGu && guLayerRef.current) {
            guLayerRef.current.eachLayer(layer => {
                layer.setStyle(getGuStyle(layer.feature));
            });
        }
    }, [visitedStores, guStats]);

    // =========================================================================
    // 🎨 렌더링
    // =========================================================================
    return (
        <div className="map-container">
            {/* 플로팅 버튼 */}
            <div className="map-floating-buttons">
                <button
                    className="floating-btn profile-btn"
                    onClick={onShowProfile}
                    title="프로필"
                >
                    ★
                </button>
            </div>

            {/* Leaflet 지도 컨테이너 */}
            <div ref={mapContainerRef} className="map-view" />
        </div>
    );
}

export default MapView;
