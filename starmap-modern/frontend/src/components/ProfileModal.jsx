// ============================================================================
// components/ProfileModal.jsx - 프로필 모달 컴포넌트
// ============================================================================

import { useState } from 'react';

function ProfileModal({ onSave, onClose, initialData, isWelcome }) {
    const [gender, setGender] = useState(initialData?.gender || '');
    const [ageGroup, setAgeGroup] = useState(initialData?.ageGroup || '');

    const ageGroups = ['10대', '20대', '30대', '40대', '50대', '60대 이상'];

    function handleSubmit() {
        if (!gender || !ageGroup) {
            alert('성별과 나이대를 선택해주세요.');
            return;
        }
        onSave({ gender, ageGroup });
    }

    return (
        <div className="modal-overlay" onClick={isWelcome ? undefined : onClose}>
            <div className="modal-content profile-modal" onClick={e => e.stopPropagation()}>
                <h2>{isWelcome ? '👋 환영합니다!' : '프로필 수정'}</h2>
                {isWelcome && <p className="welcome-text">StarMap Seoul 사용을 위해 간단한 정보를 입력해주세요.</p>}

                <div className="profile-form">
                    <div className="form-group">
                        <label>성별</label>
                        <div className="chip-group">
                            <button
                                className={`chip ${gender === '남성' ? 'active' : ''}`}
                                onClick={() => setGender('남성')}
                            >남성</button>
                            <button
                                className={`chip ${gender === '여성' ? 'active' : ''}`}
                                onClick={() => setGender('여성')}
                            >여성</button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>나이대</label>
                        <div className="chip-group">
                            {ageGroups.map(age => (
                                <button
                                    key={age}
                                    className={`chip ${ageGroup === age ? 'active' : ''}`}
                                    onClick={() => setAgeGroup(age)}
                                >{age}</button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="modal-buttons">
                    {!isWelcome && (
                        <button className="modal-btn secondary" onClick={onClose}>취소</button>
                    )}
                    <button className="modal-btn primary" onClick={handleSubmit}>
                        {isWelcome ? '시작하기' : '저장'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProfileModal;
