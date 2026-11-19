export default defineNuxtConfig({
  compatibilityDate: '2026-11-19',
  ssr: false,
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  runtimeConfig: { public: { gaId: '' } },
  app: { head: { htmlAttrs: { lang: 'ko' }, title: 'TOEIC 1-Day · 오늘의 한 문제', meta: [{ name: 'description', content: '내 수준에 맞는 하루 한 문제. Part 5 문법과 해설로 가볍게 시작하는 토익 공부.' }] } }
})
