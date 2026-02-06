# StarMap Seoul - GTM & GA4 설정 가이드 📊

이 문서는 StarMap Seoul 애플리케이션에 심어진 데이터 추적 코드를 Google Analytics 4 (GA4)에서 받아볼 수 있도록 **Google Tag Manager (GTM)**를 설정하는 방법입니다.

---

## 1. 사전 준비
- **GTM 컨테이너 ID**: `GTM-TNMFBPBD` (이미 코드에 적용됨)
- **GA4 측정 ID**: `G-XXXXXXXXXX` (GA4 설정에서 확인 필요)

---

## 2. 변수(Variables) 설정
코드에서 보내주는 데이터(`gu_name`, `store_name` 등)를 GTM이 잡을 수 있도록 변수를 만듭니다.

**[설정 방법]**
1. GTM 왼쪽 메뉴 **변수(Variables)** 클릭
2. **사용자 정의 변수(User-Defined Variables)** > **새로 만들기(New)**
3. 아래 표를 참고하여 모두 생성하세요. (유형은 모두 **데이터 영역 변수 (Data Layer Variable)**)

| 변수 이름 (GTM Name) | 데이터 영역 변수 이름 (Data Layer Variable Name) | 설명 |
| :--- | :--- | :--- |
| `dlv_gu_name` | `gu_name` | 선택한 구 이름 (예: 강남구) |
| `dlv_dong_name` | `dong_name` | 선택한 동 이름 (예: 역삼동) |
| `dlv_store_name` | `store_name` | 스타벅스 매장명 |
| `dlv_action` | `action` | 방문 체크 여부 (add/remove) |
| `dlv_achievement_type` | `type` | 업적 종류 (gu_completion/dong_completion) |
| `dlv_user_age` | `user_age` | 사용자 연령대 |
| `dlv_user_gender` | `user_gender` | 사용자 성별 |

---

## 3. 트리거(Triggers) 설정
"언제" 데이터를 보낼지 타이밍을 정합니다.

**[설정 방법]**
1. **트리거(Triggers)** > **새로 만들기(New)**
2. 유형은 모두 **맞춤 이벤트 (Custom Event)** 선택

| 트리거 이름 | 이벤트 이름 (Event Name) | 설명 |
| :--- | :--- | :--- |
| `Custom - View Gu Detail` | `view_gu_detail` | 구 상세 지도 진입 시 |
| `Custom - Store Visit Toggle` | `store_visit_toggle` | 매장 체크/체크해제 시 |
| `Custom - Achievement Unlocked` | `achievement_unlocked` | 동/구 정복 완료 시 (폭죽 터질 때) |
| `Custom - User Signup` | `user_signup` | 최초 정보 입력 시 |
| `Custom - Profile Update` | `user_profile_update` | 정보 수정 완료 시 |
| `Custom - Contact Click` | `contact_click` | 문의 버튼 클릭 시 |
| `Custom - Reset Data` | `reset_data` | 초기화 버튼 클릭 시 |

---

## 4. 태그(Tags) 설정 - GA4로 쏘기 🚀
이제 잡은 데이터를 GA4로 전송합니다.

**[설정 방법]**
1. **태그(Tags)** > **새로 만들기(New)**
2. 태그 유형: **Google 애널리틱스: GA4 이벤트 (GA4 Event)**
3. **측정 ID**: 본인의 GA4 측정 ID 입력

### (1) 핵심 이벤트 태그 목록

#### A. 매장 방문 체크 (Store Visit)
- **이벤트 이름**: `store_visit`
- **이벤트 매개변수(Parameters)**:
  - `store_name`: `{{dlv_store_name}}`
  - `region_gu`: `{{dlv_gu_name}}`
  - `action_type`: `{{dlv_action}}`
- **트리거**: `Custom - Store Visit Toggle`

#### B. 업적 달성 (Achievement) ✨
- **이벤트 이름**: `achievement_unlocked`
- **이벤트 매개변수**:
  - `achievement_type`: `{{dlv_achievement_type}}`
  - `region_gu`: `{{dlv_gu_name}}`
  - `region_dong`: `{{dlv_dong_name}}`
- **트리거**: `Custom - Achievement Unlocked`

#### C. 구경하기 (View Region)
- **이벤트 이름**: `view_region`
- **이벤트 매개변수**:
  - `region_gu`: `{{dlv_gu_name}}`
- **트리거**: `Custom - View Gu Detail`

#### D. 유저 가입/수정 (User Signup)
- **이벤트 이름**: `sign_up` (또는 `user_update`)
- **이벤트 매개변수**:
  - `age_group`: `{{dlv_user_age}}`
  - `gender`: `{{dlv_user_gender}}`
- **트리거**: `Custom - User Signup` / `Custom - Profile Update`

---

## 5. 사용자 속성 (User Properties) - *중요*
연령/성별로 사용자를 분류해서 보고 싶다면, **[맞춤 측정기준]** 설정이 필요합니다.

1. **GA4 관리자 페이지** 접속
2. **데이터 표시(Data Display)** > **맞춤 정의(Custom Definitions)**
3. **맞춤 측정기준 만들기(Create custom dimensions)**
   - **범위**: 사용자(User)
   - **이름**: Age Group / **설명**: user_age
   - **이름**: Gender / **설명**: user_gender

---

## 6. 게시(Publish)
설정이 끝났다면 GTM 우측 상단의 **[제출(Submit)]** -> **[게시(Publish)]**를 눌러야 실제 반영됩니다!
