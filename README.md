# TOEIC 1-Day

Nuxt 4와 TypeScript로 구현한 정적 토익 학습 SPA입니다. 레벨 설정, 오늘의 문제, 결과 및 해설의 세 화면을 하나의 흐름으로 제공합니다.

## 실행

Node.js 22 이상을 사용합니다. 현재 Node.js 24에서 검증합니다.

```sh
npm ci --cache /workspace/.npm-cache
npm run dev
```

```sh
npm run typecheck
npm run generate
```

정적 배포 결과는 `.output/public`입니다. 서버 배포는 `npm run build` 후 `node .output/server/index.mjs`로 실행합니다.

## 데이터와 저장

`app/data/problems.json`에 레벨별로 두 문제씩 총 10개를 수록했습니다. 날짜가 지정된 문제는 해당 날짜에 우선 제공하며, 그 외에는 한국 시간 날짜의 일수 인덱스로 레벨별 문제를 선택합니다. 현재는 이틀마다 같은 문제가 반복됩니다. 레벨 및 당일 결과와 피드백은 브라우저 localStorage에 저장합니다. 잘못된 기록은 무시하며 저장소 접근이 차단되면 안내를 표시합니다.

## 분석

선택 사항으로 `NUXT_PUBLIC_GA_ID=G-...`를 설정하면 GA4를 로드하고 `level_selected`, `answer_submitted`, `feedback_clicked`를 전송합니다. 측정 ID는 별도로 공급해야 합니다. 기본 상태에서는 외부 전송을 하지 않으며 `toeic:analytics` 브라우저 이벤트로 연동할 수 있습니다. 피드백 내용은 현재 브라우저에 저장됩니다.

## 디자인

`toeic_1_day_mvp_prd.md`와 첨부 DESIGN-kraken.md의 색상 및 컴포넌트 기준을 반영했습니다. 폰트는 설치된 시스템 글꼴을 사용합니다. 독립적인 TOEIC 브랜드로 구성했습니다.
