// ============================================================================
// MapView.jsx - 리팩토링 v4 (부드러운 애니메이션 적용)
// ============================================================================
// 
// 📌 애니메이션 로직:
// [구 -> 동] 
// 1. map.flyToBounds()로 해당 구 영역으로 부드럽게 줌인 (1.2초)
// 2. 줌이 끝나는 시점(setTimeout)에 동 레이어로 교체
//
// [동 -> 구]
// 1. 구 레이어로 즉시 교체 (서울 전체 지도 표시)
// 2. map.flyToBounds()로 서울 전체 영역으로 줌아웃 (1.2초)
// ============================================================================

import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { trackViewGu } from '../utils/analytics';

// ============================================================================
// 🎨 색상 유틸리티
// ============================================================================
function getColor(ratio, isNoStore = false) {
    if (isNoStore) return '#00704a';
    const start = { r: 255, g: 255, b: 255 };
    const end = { r: 0, g: 112, b: 74 };
    const r = Math.round(start.r + (end.r - start.r) * ratio);
    const g = Math.round(start.g + (end.g - start.g) * ratio);
    const b = Math.round(start.b + (end.b - start.b) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
}

function MapView({ stores, visitedStores, currentGu, onSelectGu, onShowProfile, onBack }) {
    // 📌 Refs
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);

    // 레이어 Refs
    const guLayerRef = useRef(null);
    const activeDongLayerRef = useRef(null);

    // 데이터 및 상태 Refs
    const guGeoJsonRef = useRef(null);
    const dongGeoJsonRef = useRef(null);
    const seoulBoundsRef = useRef(null);

    // =========================================================================
    // 📊 통계 계산
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
    // 🎨 스타일 함수
    // =========================================================================
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

    const getDongStyle = (feature) => {
        const dongName = feature.properties.adm_nm.split(' ').pop();
        const dongStores = stores.filter(s => s.gu === currentGu && s.dong === dongName);
        const total = dongStores.length;
        const visited = dongStores.filter(s => visitedStores.has(s.store_name)).length;
        const ratio = total > 0 ? visited / total : 0;
        const isNoStore = total === 0;

        return {
            fillColor: getColor(ratio, isNoStore),
            weight: 1,
            opacity: 1,
            color: '#8c8c8c',
            fillOpacity: 1
        };
    };

    // =========================================================================
    // 🗺️ 지도 초기화
    // =========================================================================
    useEffect(() => {
        if (mapRef.current) return;

        mapRef.current = L.map(mapContainerRef.current, {
            center: [37.5665, 126.9780],
            zoom: 11,
            zoomControl: false,
            attributionControl: false
        });

        // 우클릭 뒤로가기
        mapContainerRef.current.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (onBack) onBack();
        });

        // 데이터 로드
        Promise.all([
            fetch('/static/seoul_gu_map.geojson').then(r => r.json()),
            fetch('/static/seoul_map.geojson').then(r => r.json())
        ]).then(([guData, dongData]) => {
            guGeoJsonRef.current = guData;
            dongGeoJsonRef.current = dongData;

            // 초기 구 레이어 표시
            renderGuLayer();

            // 서울 전체 경계 저장
            if (guLayerRef.current) {
                seoulBoundsRef.current = guLayerRef.current.getBounds();
                mapRef.current.fitBounds(seoulBoundsRef.current, { padding: [50, 50] });
            }
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // =========================================================================
    // 🔄 레이어 렌더링 함수 (직접 호출)
    // =========================================================================
    const renderGuLayer = () => {
        if (!mapRef.current || !guGeoJsonRef.current) return;

        // 기존 레이어 정리
        if (guLayerRef.current) guLayerRef.current.remove();
        if (activeDongLayerRef.current) activeDongLayerRef.current.remove();

        guLayerRef.current = L.geoJSON(guGeoJsonRef.current, {
            style: getGuStyle,
            onEachFeature: (feature, layer) => {
                const name = feature.properties.name || feature.properties.SIG_KOR_NM;
                layer.bindTooltip(`<b>${name}</b>`, { sticky: true });
                layer.on('click', () => onSelectGu && onSelectGu(name));
                layer.on('mouseover', () => layer.setStyle({ weight: 4, color: '#00704a' }));
                layer.on('mouseout', () => layer.setStyle({ weight: 2, color: '#1e3932' }));
            }
        }).addTo(mapRef.current);
    };

    const renderDongLayer = () => {
        if (!mapRef.current || !dongGeoJsonRef.current || !currentGu) return;

        // 구 레이어 제거 (겹침 방지)
        if (guLayerRef.current) guLayerRef.current.remove();
        if (activeDongLayerRef.current) activeDongLayerRef.current.remove();

        const filteredFeatures = dongGeoJsonRef.current.features.filter(
            f => f.properties.sggnm === currentGu
        );

        const filteredGeoJson = { type: "FeatureCollection", features: filteredFeatures };

        activeDongLayerRef.current = L.geoJSON(filteredGeoJson, {
            style: getDongStyle,
            onEachFeature: (feature, layer) => {
                const dongName = feature.properties.adm_nm.split(' ').pop();
                layer.bindTooltip(`<b>${dongName}</b>`, { sticky: true });
                layer.on('mouseover', () => layer.setStyle({ weight: 3, color: '#000' }));
                layer.on('mouseout', () => layer.setStyle({ weight: 1, color: '#8c8c8c' }));
            }
        }).addTo(mapRef.current);
    };

    // =========================================================================
    // ⚡ 애니메이션 및 화면 전환 로직
    // =========================================================================
    useEffect(() => {
        if (!mapRef.current) return;

        if (currentGu) {
            // [구 -> 동] 줌인 애니메이션

            // 1. 해당 구의 경계 찾기 (GeoJSON 데이터에서)
            const targetFeature = guGeoJsonRef.current?.features.find(
                f => (f.properties.name || f.properties.SIG_KOR_NM) === currentGu
            );

            if (targetFeature) {
                const targetBounds = L.geoJSON(targetFeature).getBounds();

                // 2. 부드럽게 줌인 (1.2초)
                mapRef.current.flyToBounds(targetBounds, {
                    padding: [50, 50],
                    duration: 1.2,
                    easeLinearity: 0.25
                });

                // 3. 줌이 얼추 끝날 때쯤 동 레이어로 교체
                // flyToBounds가 끝나는 시점을 정확히 잡기 위해 setTimeout 사용
                setTimeout(() => {
                    renderDongLayer();
                }, 1200);
            } else {
                // 혹시 못 찾으면 즉시 렌더링
                renderDongLayer();
            }

        } else {
            // [동 -> 구] 줌아웃 애니메이션

            // 1. 구 레이어 즉시 복구 (서울 전체가 보여야 함)
            renderGuLayer();

            // 2. 서울 전체로 부드럽게 줌아웃
            if (seoulBoundsRef.current) {
                mapRef.current.flyToBounds(seoulBoundsRef.current, {
                    padding: [50, 50],
                    duration: 1.2,
                    easeLinearity: 0.25
                });
            }
        }
    }, [currentGu]); // stores가 바뀔 때는 스타일만 업데이트(아래 useEffect)

    // 스타일 업데이트 (방문 체크 시)
    useEffect(() => {
        if (currentGu && activeDongLayerRef.current) {
            activeDongLayerRef.current.setStyle(getDongStyle);
        } else if (!currentGu && guLayerRef.current) {
            guLayerRef.current.setStyle(getGuStyle);
        }
    }, [stores, visitedStores]);

    return (
        <div className="map-container">
            <div className="map-floating-buttons">
                <button className="floating-btn profile-btn" onClick={onShowProfile} title="프로필">★</button>
            </div>
            <div ref={mapContainerRef} className="map-view" />
        </div>
    );
}

export default MapView;
