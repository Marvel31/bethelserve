# Firebase 보안 규칙 업데이트 가이드

## 문제
`monthOpenStatus` 경로에 대한 읽기 권한이 없어서 "Permission denied" 에러가 발생합니다.

## 해결 방법

Firebase Console에서 다음 보안 규칙을 추가하세요:

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. 프로젝트 `bethelserve-14680` 선택
3. 왼쪽 메뉴에서 **Realtime Database** 선택
4. **규칙** 탭 클릭
5. 다음 규칙을 추가:

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
      ".write": true
    },
    "enabledDates": {
      ".read": true,
      ".write": true
    },
    "monthOpenStatus": {
      ".read": true,
      ".write": true
    },
    "selectedByRole": {
      ".read": true,
      ".write": true
    },
    "announcements": {
      ".read": true,
      ".write": true
    },
    "universalPrayers": {
      ".read": true,
      ".write": true
    }
  }
}
```

6. **게시** 버튼 클릭

## 참고
- 현재는 모든 사용자가 읽기/쓰기 권한을 가지고 있습니다 (테스트 모드)
- 프로덕션 환경에서는 Firebase Authentication을 사용하여 관리자만 쓰기 권한을 가지도록 제한하는 것을 권장합니다.



