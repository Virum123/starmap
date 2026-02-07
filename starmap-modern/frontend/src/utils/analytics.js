// ============================================================================
// utils/analytics.js - GA4/GTM 데이터 전송 유틸리티
// ============================================================================

// window.dataLayer가 있는지 확인하고 안전하게 push하는 함수
function pushToDataLayer(eventObj) {
    if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push(eventObj);
    } else {
        // 개발 모드나 GTM 로드 실패 시 콘솔에 로그만 출력
        console.log('[GTM Debug]', eventObj);
    }
}

// 1. 매장 방문 체크/해제
export function trackStoreVisit(storeName, guName, action) {
    pushToDataLayer({
        event: 'store_visit_toggle',
        store_name: storeName,
        gu_name: guName,
        action: action // 'add' or 'remove'
    });
}

// 2. 업적 달성 (동/구 정복)
export function trackAchievement(type, guName, dongName = '') {
    pushToDataLayer({
        event: 'achievement_unlocked',
        type: type, // 'dong_completion' or 'gu_completion'
        gu_name: guName,
        dong_name: dongName
    });
}

// 3. 구 상세 보기 (지도 진입)
export function trackViewGu(guName) {
    pushToDataLayer({
        event: 'view_gu_detail',
        gu_name: guName
    });
}

// 4. 유저 프로필 입력/수정
export function trackUserProfile(gender, ageGroup, isSignup = false) {
    pushToDataLayer({
        event: isSignup ? 'user_signup' : 'user_profile_update',
        user_gender: gender,
        user_age: ageGroup
    });
}

// 5. 문의 클릭
export function trackContactClick() {
    pushToDataLayer({
        event: 'contact_click'
    });
}

// 6. 데이터 초기화
export function trackReset() {
    pushToDataLayer({
        event: 'reset_data'
    });
}
