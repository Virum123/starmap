// ============================================================================
// utils/celebration.js - 축하 효과 유틸리티
// ============================================================================

// 📌 꽃가루 효과
export function createConfetti(count = 50) {
    const colors = ['#00704a', '#1e3932', '#ffffff', '#d4af37', '#87ceeb'];
    for (let i = 0; i < count; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
    }
}

// 📌 폭죽 효과
export function createFirework() {
    const firework = document.createElement('div');
    firework.className = 'firework';
    firework.style.left = (20 + Math.random() * 60) + 'vw';
    firework.style.top = (20 + Math.random() * 40) + 'vh';
    document.body.appendChild(firework);

    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'firework-particle';
        const angle = (i / 20) * 360;
        const distance = 50 + Math.random() * 50;
        particle.style.setProperty('--angle', angle + 'deg');
        particle.style.setProperty('--distance', distance + 'px');
        particle.style.backgroundColor = `hsl(${Math.random() * 60 + 100}, 70%, 50%)`;
        firework.appendChild(particle);
    }

    setTimeout(() => firework.remove(), 1500);
}

// 📌 축하 효과 실행
export function celebrateDongComplete() {
    createConfetti(30);
}

export function celebrateGuComplete() {
    createConfetti(50);
    for (let i = 0; i < 5; i++) {
        setTimeout(() => createFirework(), i * 300);
    }
}
