# Bethel Serve - 봉사 체크 웹앱

성당 봉사 스케줄 관리 웹 애플리케이션입니다.

## 주요 기능

- 📅 **월별 일요일 표시**: 선택한 월의 모든 일요일 날짜를 자동으로 표시
- 👥 **봉사자 등록**: 봉사자들이 이름을 등록하고 봉사 가능한 날짜를 선택
- ✅ **봉사 가능 날짜 체크**: 봉사자들이 자신의 가능한 날짜를 간편하게 선택
- 🎯 **관리자 선택 기능**: 관리자가 각 날짜별로 봉사 가능한 봉사자 중 6명을 선택
- 📱 **반응형 디자인**: 모바일과 데스크톱 모두에서 사용 가능
- 🌐 **PWA 지원**: 브라우저에서 설치하여 앱처럼 사용 가능

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. Firebase 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. Realtime Database 생성 (테스트 모드로 시작)
3. `src/firebase/config.js` 파일에 Firebase 설정 정보 입력:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  databaseURL: "YOUR_DATABASE_URL"
}
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 4. 빌드

```bash
npm run build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

## 사용 방법

### 봉사자 모드

1. 봉사자가 자신의 이름을 입력하여 등록
2. 월별 일요일 날짜가 표시됨
3. 봉사 가능한 날짜를 클릭하여 선택/해제
4. 선택한 정보는 자동으로 저장됨

### 관리자 모드

- 기본 비밀번호: `admin123` (수정 가능)
1. 관리자 모드 버튼 클릭 후 비밀번호 입력
2. 월별 일요일 날짜 선택
3. 선택한 날짜에 가능한 봉사자 목록 확인
4. 최대 6명까지 봉사자 선택
5. 선택 완료 후 저장

## 보안 설정

### 관리자 비밀번호 변경

`src/App.jsx` 파일에서 `ADMIN_PASSWORD` 상수를 수정하세요:

```javascript
const ADMIN_PASSWORD = 'your-new-password'
```

### Firebase 보안 규칙

Firebase Realtime Database 보안 규칙을 설정하세요:

```json
{
  "rules": {
    "volunteers": {
      ".read": true,
      ".write": true
    },
    "availability": {
      ".read": true,
      ".write": true
    },
    "selected": {
      ".read": true,
      ".write": false  // 관리자만 수정 가능하도록 별도 인증 추가 권장
    }
  }
}
```

## 기술 스택

- React 18
- Vite
- Firebase Realtime Database
- date-fns
- PWA (Progressive Web App)

## 라이선스

MIT


