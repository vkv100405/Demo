/* =================================================================
   Культура развивает — ядро: навигация между экранами, таймер,
   прохождение списка упражнений региона.

   Как подключается упражнение: файл в js/exercises/ вызывает
   registerExercise(type, { skill, timeLimit, steps, run }).
     skill      — какой навык оценивает (memory/attention/logic) или
                  не указан, если задание не оценивается;
     timeLimit  — лимит времени в секундах (для оценки скорости);
     steps      — { 'step-id': { progress:'03/05', time:150 } } —
                  подпись прогресса и таймер для экранов задания;
     run(cfg, ctx) — собрать экран. ctx.tracker считает верные
                  действия/ошибки/подсказки, ctx.complete() фиксирует
                  результат, ctx.next() переходит к следующему заданию.
   ================================================================= */

const MAIN_SCREENS = ['screen-cabinet','screen-train','screen-stats','screen-me'];   // экраны с нижним/боковым меню
const NEUTRAL_SCREENS = ['screen-splash','screen-welcome','screen-task','screen-demo-result','screen-profile','screen-goal',
  'screen-select','screen-history'].concat(MAIN_SCREENS);
const THEME_CLASSES = REGION_ORDER.map(id => 'theme-' + id);

let current = null;          // выбранный регион (объект из CULTURES)
let timerInterval = null;
const session = { index: -1, results: [], plan: [], words: [] };

const EXERCISE_TYPES = {};
const STEP_META = { 'step-explain': { progress: '02/05' } };

function registerExercise(type, def){
  EXERCISE_TYPES[type] = def;
  Object.assign(STEP_META, def.steps || {});
}

/* ---------- утилиты ---------- */
function shuffle(arr){
  const a = arr.slice();
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ruPlural(n, one, few, many){
  const m10 = n % 10, m100 = n % 100;
  if(m10 === 1 && m100 !== 11) return one;
  if(m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

/* Путь к картинке из data.js: полная ссылка (https://…) или путь от
   корня сайта берутся как есть, просто имя файла — из папки assets/. */
function assetUrl(v){
  if(!v) return '';
  return /^(https?:)?\/\//.test(v) || v.startsWith('/') || v.startsWith('assets/') ? v : 'assets/' + v;
}

/* ---------- навигация ---------- */
function go(id){
  if(NEUTRAL_SCREENS.includes(id)){
    document.body.classList.remove(...THEME_CLASSES);
    document.getElementById('app').classList.remove(...THEME_CLASSES);
  }
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const nav = document.getElementById('mainnav');
  if(nav){
    nav.hidden = !MAIN_SCREENS.includes(id);
    document.body.classList.toggle('has-nav', MAIN_SCREENS.includes(id));
    nav.querySelectorAll('button').forEach(b=>{
      if(b.dataset.nav === id) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
  }
  window.scrollTo({top:0, behavior:'instant'});
}

function showStep(id){
  document.querySelectorAll('#screen-exercise > div[id^="step-"]').forEach(s=>s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');

  const meta = STEP_META[id] || {};
  document.getElementById('ex-progress').innerText = meta.progress || '';

  clearInterval(timerInterval);
  const timerIds = meta.timerIds || ['ex-timer'];
  const timerEls = timerIds.map(t => document.getElementById(t));
  if(meta.time) startTimer(meta.time, timerEls);
  else timerEls.forEach(el => { el.innerHTML = ''; });

  window.scrollTo({top:0, behavior:'instant'});
}

function startTimer(seconds, els){
  let s = seconds;
  const render = ()=>{
    const m = Math.floor(s/60), sec = s%60;
    const html = hourglassSVG() + ' ' + m + ':' + String(sec).padStart(2,'0');
    els.forEach(el => { el.innerHTML = html; });
  };
  render();
  timerInterval = setInterval(()=>{ s--; if(s<0){ clearInterval(timerInterval); return; } render(); }, 1000);
}

/* ---------- прохождение упражнений ---------- */

/* План тренировки: задания по порядку; из группы заданий с одинаковым
   полем group берётся одно случайное на место первого из них. */
function buildPlan(list){
  const plan = [], handled = {};
  list.forEach(cfg=>{
    if(!cfg.group){ plan.push(cfg); return; }
    if(handled[cfg.group]) return;
    handled[cfg.group] = true;
    plan.push(shuffle(list.filter(c => c.group === cfg.group))[0]);
  });
  return plan;
}

function startExercise(){
  session.index = -1;
  session.results = [];
  session.words = [];
  session.plan = buildPlan(current.exercises);
  document.getElementById('explain-title').innerHTML = 'Не знаешь <span class="accent">' + current.langAdj + '</span>?<br>Это нормально.';
  renderMascot('explain-mascot', current.id, 'glasses');
  go('screen-exercise');
  showStep('step-explain');
}

function nextExercise(){
  session.index++;
  const cfg = session.plan[session.index];
  if(!cfg){ showResults(); return; }
  const def = EXERCISE_TYPES[cfg.type];
  if(!def){
    console.error('Неизвестный тип упражнения: «' + cfg.type + '» (регион ' + current.id + ')');
    nextExercise();
    return;
  }
  def.run(cfg, makeContext(cfg, def));
}

function makeContext(cfg, def){
  const skill = cfg.skill || def.skill || null;
  const tracker = createTracker(cfg.timeLimit || def.timeLimit || 0);
  let completed = false;
  return {
    culture: current,
    tracker,
    show: showStep,
    next: nextExercise,
    complete(){
      if(completed) return;
      completed = true;
      tracker.stop();
      if(!skill) return;
      const snap = tracker.snapshot();
      session.results.push({ type: cfg.type, skill, score: exerciseScore(snap), seconds: snap.elapsed });
    }
  };
}
