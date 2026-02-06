// ============================================================================
// 🎓 LEARNING: main.jsx - React 앱의 진입점 (Entry Point)
// ============================================================================
//
// 📌 이 파일의 역할
// ----------------------------------------------------------------------------
// - React 앱이 시작되는 곳
// - HTML의 <div id="root">에 React 앱을 "꽂아넣는" 역할
// - 전체 앱 중 딱 한 번만 실행됨
//
// 📌 순수 HTML에서는?
// - <script src="app.js"></script>로 불러오면 끝
// - React는 "가상 DOM"을 사용하므로 이런 초기화 과정이 필요함
// ============================================================================

import React from 'react';
import ReactDOM from 'react-dom/client';  // React 18+ 문법
import App from './App.jsx';

// 📌 createRoot: React 앱을 HTML에 연결하는 함수
// - document.getElementById('root'): HTML에서 id="root"인 div를 찾음
// - .render(<App />): 그 안에 App 컴포넌트를 그림

ReactDOM.createRoot(document.getElementById('root')).render(
    // 📌 React.StrictMode
    // - 개발 중 잠재적 문제를 찾아주는 도구
    // - 프로덕션 빌드에서는 자동으로 비활성화됨
    // - 컴포넌트가 2번 렌더링되는 건 이것 때문 (버그 아님!)
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
