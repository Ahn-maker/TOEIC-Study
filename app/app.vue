<script setup lang="ts">
import problems from './data/problems.json'
const levels = [
  { id: 'beginner', label: '토익 응시 경험 없음', detail: '입문' },
  { id: 'under_600', label: '600점 미만', detail: '기초' },
  { id: '600_749', label: '600 ~ 749점', detail: '기본' },
  { id: '750_849', label: '750 ~ 849점', detail: '중급' },
  { id: 'over_850', label: '850점 이상', detail: '고난도 · 900점 목표' }
]
type Problem = typeof problems[number] & { date?: string }
type History = { date: string; level: string; problemId: string; selected: number; feedback?: string }
const level = ref('')
const pendingLevel = ref('')
const screen = ref<'level' | 'question' | 'result'>('level')
const selected = ref<number | null>(null)
const feedback = ref('')
const storageWarning = ref('')
const date = ref('')
const restoredProblemId = ref('')
let timer: ReturnType<typeof setInterval>
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const problem = computed(() => {
  const levelProblems: Problem[] = problems.filter(item => item.level === level.value)
  const restored = levelProblems.find(item => item.id === restoredProblemId.value)
  const scheduled = levelProblems.find(item => item.date === date.value)
  const pool = levelProblems.filter(item => !item.date)
  const day = Math.floor(Date.parse(date.value + 'T00:00:00Z') / 86400000)
  return restored || scheduled || pool[((day || 0) % pool.length + pool.length) % pool.length] || problems[0]!
})
const levelLabel = computed(() => levels.find(item => item.id === level.value)?.label)
const correct = computed(() => selected.value === problem.value.answer)
const dateLabel = computed(() => date.value ? new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'long', day: 'numeric', weekday: 'long' }).format(new Date(date.value + 'T12:00:00+09:00')) : '')
function read(key: string) {
  try { return localStorage.getItem(key) } catch { storageWarning.value = '브라우저 저장소를 사용할 수 없어 새로고침하면 기록이 사라질 수 있어요.'; return null }
}
function write(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch { storageWarning.value = '기록을 저장하지 못했어요. 현재 화면에서는 계속 학습할 수 있어요.' }
}
function track(event: string, extra: Record<string, unknown> = {}) {
  const payload = { level: level.value, problem_id: problem.value.id, ...extra }
  window.dispatchEvent(new CustomEvent('toeic:analytics', { detail: { event, ...payload } }))
  const analytics = window as typeof window & { dataLayer?: unknown[] }
  if (analytics.dataLayer) {
    function gtag(..._args: unknown[]) { analytics.dataLayer!.push(arguments) }
    gtag('event', event, payload)
  }
}
function restore() {
  selected.value = null
  feedback.value = ''
  restoredProblemId.value = ''
  screen.value = 'question'
  try {
    const history: History = JSON.parse(read('toeic_daily_history') || 'null')
    if (history?.date === date.value && history.level === level.value && Number.isInteger(history.selected) && history.selected >= 0 && history.selected < 4 && problems.some(item => item.level === level.value && item.id === history.problemId)) {
      restoredProblemId.value = history.problemId
      selected.value = history.selected
      feedback.value = ['helpful', 'unhelpful'].includes(history.feedback || '') ? history.feedback! : ''
      screen.value = 'result'
    }
  } catch { /* Invalid saved records are replaced on the next submission. */ }
}
function start() {
  if (!levels.some(item => item.id === pendingLevel.value)) return
  const changed = level.value !== pendingLevel.value
  level.value = pendingLevel.value
  date.value = today()
  write('toeic_user_level', level.value)
  if (changed) { selected.value = null; feedback.value = ''; restoredProblemId.value = ''; screen.value = 'question'; write('toeic_daily_history', 'null') }
  else restore()
  track('level_selected')
}
function save() {
  write('toeic_daily_history', JSON.stringify({ date: date.value, level: level.value, problemId: problem.value.id, selected: selected.value, correct: correct.value, completed: true, feedback: feedback.value }))
}
function refreshDay() {
  if (date.value === today()) return false
  date.value = today()
  if (level.value) restore()
  return true
}
function submit() {
  if (refreshDay() || selected.value === null || screen.value !== 'question') return
  screen.value = 'result'; save(); track('answer_submitted', { correct: correct.value })
}
function rate(value: string) {
  if (refreshDay() || feedback.value || screen.value !== 'result') return
  feedback.value = value; save(); track('feedback_clicked', { feedback: value })
}
onMounted(() => {
  date.value = today()
  const saved = read('toeic_user_level')
  if (levels.some(item => item.id === saved)) { level.value = saved!; pendingLevel.value = saved!; restore() }
  timer = setInterval(refreshDay, 15000)
  const id = useRuntimeConfig().public.gaId
  if (/^G-[A-Z0-9]+$/.test(id)) {
    const analytics = window as typeof window & { dataLayer?: unknown[] }
    analytics.dataLayer = analytics.dataLayer || []
    function gtag(..._args: unknown[]) { analytics.dataLayer!.push(arguments) }
    gtag('js', new Date()); gtag('config', id)
    useHead({ script: [{ src: `https://www.googletagmanager.com/gtag/js?id=${id}`, async: true }] })
  }
})
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div class="site">
    <header class="header">
      <a class="brand" href="/" aria-label="TOEIC 1-Day 홈"><span class="brand-icon">t<span>•</span></span> TOEIC <span class="brand-light">1-Day</span></a>
      <div v-if="level && screen !== 'level'" class="level-control"><span>{{ levelLabel }}</span><button class="text-button" @click="pendingLevel = level; screen = 'level'">레벨 변경 ↗</button></div>
      <span v-else class="header-caption">하루 한 문제, 나를 위한 시작</span>
    </header>
    <main>
      <nav class="steps" aria-label="학습 진행 단계"><span :class="{ active: screen === 'level' }">레벨 설정</span><span class="step-line"/><span :class="{ active: screen === 'question' }">오늘의 문제</span><span class="step-line"/><span :class="{ active: screen === 'result' }">정답과 해설</span></nav>
      <template v-if="screen === 'level'">
        <div class="intro"><p class="eyebrow">A SMALL STEP, EVERY DAY</p><h1>오늘의 한 문제,<br>내일의 <em>가능성.</em></h1><p>무엇부터 공부할지 고민되시나요?<br>딱 한 문제로 오늘의 토익 공부를 시작해보세요.</p></div>
        <section class="card onboarding" aria-labelledby="level-title">
          <h2 id="level-title">현재 나의 토익 점수대는 어디인가요?</h2><p class="muted">선택한 수준에 맞는 Part 5 문제를 드릴게요.</p>
          <fieldset><legend class="sr-only">학습 레벨 선택</legend><label v-for="item in levels" :key="item.id" class="option level-option" :class="{ chosen: pendingLevel === item.id }"><input v-model="pendingLevel" type="radio" name="level" :value="item.id"><span class="option-label">{{ item.label }}</span><span class="detail">{{ item.detail }}</span></label></fieldset>
          <button class="primary" :disabled="!pendingLevel" @click="start">오늘의 문제 시작하기 <span>→</span></button>
          <p class="privacy"><span aria-hidden="true">⌑</span> 회원가입 없이, 이 브라우저에만 학습 설정을 저장해요.</p>
        </section>
      </template>
      <template v-else>
        <div class="intro question-intro"><p class="eyebrow">{{ dateLabel }} · DAILY PART 5</p><h1>{{ screen === 'result' ? '한 문제만큼, 더 가까이.' : '오늘도 한 걸음 앞으로.' }}</h1><p>{{ screen === 'result' ? '정답보다 중요한 건, 이해하고 넘어가는 것.' : '빈칸에 들어갈 가장 알맞은 답을 골라주세요.' }}</p></div>
        <section class="card question-card" aria-label="오늘의 문법 문제">
          <div class="question-meta"><span>PART 5 <span class="meta-divider">/</span> 문법</span><span v-if="screen === 'question'">오늘의 한 문제</span><span v-else class="badge" :class="correct ? 'success' : 'incorrect'" role="status">{{ correct ? '✓ 정답입니다!' : '✕ 오답입니다' }}</span></div>
          <p class="sentence" lang="en">{{ problem.sentence.split('_______')[0] }}<span class="blank" :class="{ filled: screen === 'result' }">{{ screen === 'result' ? problem.options[problem.answer] : '' }}</span>{{ problem.sentence.split('_______')[1] }}</p>
          <p class="answer-instruction">{{ screen === 'result' ? '선택한 답과 정답을 확인해보세요.' : '정답을 하나 선택해주세요.' }}</p>
          <fieldset><legend class="sr-only">답안 선택</legend><label v-for="(option, index) in problem.options" :key="problem.id + index" class="option answer-option" :class="{ chosen: selected === index, 'correct-option': screen === 'result' && problem.answer === index, 'wrong-option': screen === 'result' && selected === index && !correct }"><input v-model="selected" type="radio" name="answer" :value="index" :disabled="screen === 'result'"><span class="letter">{{ 'ABCD'[index] }}</span><span lang="en">{{ option }}</span><span v-if="screen === 'result' && problem.answer === index" class="answer-tag">정답</span><span v-if="screen === 'result' && selected === index" class="my-tag">내 선택</span></label></fieldset>
          <button v-if="screen === 'question'" class="primary" :disabled="selected === null" @click="submit">정답 확인하기 <span>→</span></button>
          <div v-else class="explanation"><div class="explanation-heading"><span class="book-icon">▤</span><h2>오늘의 문법 노트</h2></div><h3>문장 해석</h3><p>{{ problem.translation }}</p><h3>정답과 문법 포인트</h3><span class="topic">{{ problem.topic }}</span><p>{{ problem.rule }}</p><h3>오답 살펴보기</h3><ul><template v-for="(reason, index) in problem.reasons" :key="index"><li v-if="index !== problem.answer"><b>{{ 'ABCD'[index] }}</b><span>{{ reason }}</span></li></template></ul></div>
        </section>
        <section v-if="screen === 'result'" class="feedback" aria-label="해설 피드백"><h2>해설이 이해하는 데 도움이 되었나요?</h2><div><button :disabled="!!feedback" :class="{ rated: feedback === 'helpful' }" @click="rate('helpful')">♡ 도움 됐어요</button><button :disabled="!!feedback" :class="{ rated: feedback === 'unhelpful' }" @click="rate('unhelpful')">아쉬워요</button></div><p v-if="feedback" role="status">의견 고마워요. 더 좋은 학습을 만드는 데 참고할게요.</p><p v-else>여러분의 의견으로 더 나은 해설을 만들어요.</p></section>
      </template>
      <p v-if="storageWarning" role="status" class="storage-warning">{{ storageWarning }}</p>
    </main>
  </div>
</template>
