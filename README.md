# GSO 관리 앱 v0.2

개인용 GSO 요청 관리 SPA. React + Vite + IndexedDB.

## 시작
```bash
npm install
npm run dev          # → http://localhost:5173
```

## 핵심 기능

### ✈️ CRS 입력 탭
Topas/CRS 스케줄 텍스트를 그대로 붙여넣고 [🔍 파싱] → 자동으로 1행 생성.

예시 입력:
```
  1  KE 901 K 11NOV 3 ICNCDG DK1  1205 1830  11NOV  E  0 77W DL
  2  KE 928 K 18NOV 3 MXPICN DK1  2005 1535  19NOV  E  0 789 M
```

→ 결과: `CDG / KE901 / 11/11 → MXP / KE928 / 18/11 / 8일`
(HUB=ICN 기준으로 out/in 자동 인식)

### 🔁 패턴 일괄
- "CDG/MXP 9일" 같은 노선 조합을 패턴으로 등록
- 시작일 + 반복 주기(매주=7, 격주=14) + 횟수 입력 → 한 번에 N건 생성
- 미리보기 단계에서 체크박스로 개별 제외 가능

### 📋 요청 목록
- 검색/필터/정렬, CSV export
- 행마다 📋 버튼 → Escalation 비고 클립보드 복사

### 📤 ADM / 🌐 공항-편명
- ADM: Booking ID로 요청 자동 연결, 모객성/테마성 구분
- 공항-편명: CRS 미입력 시 공항 코드로 편명 자동 채움

## 데이터
모든 데이터는 **브라우저 IndexedDB**에 저장. 우상단 ⬇️백업 / ⬆️복원으로 JSON 입출력.

## GitHub Pages 배포
1. 비공개 레포 생성 후 push
2. Settings → Pages → Source: **GitHub Actions** 선택
3. 끝. 다음 push부터 자동 배포 (`.github/workflows/deploy.yml`)

## 일수 계산식
`일수 = 리턴일 - 출발일 + 2` (엑셀 원본 호환)

## 키 단축
- 검색창 클릭 후 바로 타이핑
