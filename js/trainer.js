/* =================================================================
   Культура развивает — «Экран 4: выполнение упражнений».

   Пользователь выбирает категорию → получает случайное упражнение
   из пула (js/content/tasks.js) → выполняет → «Проверить» →
   подсветка верно/неверно → «Ещё задание». Режим demo —
   «Попробуй прямо сейчас»: два задания с прогрессом и итогом.

   Тип задания подключается файлом из js/tasks/ командой
   registerTask(type, { render(task, api) }). Через api:
     api.stage        — контейнер, куда рисуется задание
     api.setCheck(fn) — функция «Проверить»: вернуть { ok, msg } (готово),
                        { ok:false, msg, retry:true } (ошибка, можно ещё раз)
                        или null (ответ ещё не введён)
     api.enable(bool) — включить/выключить кнопку «Проверить»
     api.noCheck()    — игра сама завершается (кнопки «Проверить» нет)
     api.finish({ ok, msg }) — завершить задание из игры
   ================================================================= */

const TASK_TYPES = {};
function registerTask(type, def){ TASK_TYPES[type] = def; }

/* Короткий помощник создания элемента */
function h(tag, cls, html){
  const el = document.createElement(tag);
  if(cls) el.className = cls;
  if(html !== undefined) el.innerHTML = html;
  return el;
}
function pad2(n){ return String(n).padStart(2, '0'); }
function fmtTime(sec){ return Math.floor(sec / 60) + ':' + pad2(Math.floor(sec % 60)); }
function norm(s){
  return String(s).toLowerCase().replace(/ё/g, 'е').replace(/[\s.,!?;:«»"'()-]/g, '');
}
function shakeEl(el){
  el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
  setTimeout(()=> el.classList.remove('shake'), 350);
}

const trainer = {
  mode: 'train',          // 'train' | 'demo'
  cat: null,
  task: null,
  checkFn: null,
  done: false,
  hintUsed: false,
  startedAt: 0,
  timerId: null,
  demo: { list: [], index: 0, results: [] },
  lastTaskId: null,
};

const taskEl = id => document.getElementById(id);

/* ---------- выбор случайного упражнения ---------- */
function pickTask(catId){
  const pool = TASKS[catId] || [];
  if(!pool.length) return null;
  const seen = (loadStats().seen[catId]) || [];
  let candidates = pool.filter(t => !seen.includes(t.id));
  if(!candidates.length){                         // всё уже видели — начинаем круг заново
    candidates = pool;
    const s = loadStats(); s.seen[catId] = []; saveStats(s);
  }
  if(candidates.length > 1) candidates = candidates.filter(t => t.id !== trainer.lastTaskId);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function startCategory(catId){
  trainer.mode = 'train';
  trainer.cat = catId;
  const t = pickTask(catId);
  if(!t){ alert('В этой категории пока нет упражнений.'); return; }
  showTask(t);
}

function startDemo(){
  // два задания из разных категорий, помеченные demo:true
  const cats = shuffle(CATEGORIES.map(c => c.id).filter(id => (TASKS[id] || []).some(t => t.demo)));
  trainer.mode = 'demo';
  trainer.demo = { list: cats.slice(0, 2).map(id => ({ cat:id, task: shuffle(TASKS[id].filter(t => t.demo))[0] })), index: 0, results: [] };
  trainer.cat = null;
  showDemoTask();
}

function showDemoTask(){
  const item = trainer.demo.list[trainer.demo.index];
  trainer.cat = item.cat;
  showTask(item.task);
}

/* ---------- показ задания ---------- */
function showTask(task){
  trainer.task = task;
  trainer.checkFn = null;
  trainer.done = false;
  trainer.hintUsed = false;
  trainer.lastTaskId = task.id;

  const cat = CATEGORIES.find(c => c.id === trainer.cat);
  const demo = trainer.mode === 'demo';
  const total = trainer.demo.list.length, idx = trainer.demo.index;

  taskEl('task-kicker').textContent = demo ? 'Задание ' + (idx + 1) + ' из ' + total : (cat ? cat.name : '');
  taskEl('task-title').textContent = demo ? 'Попробуй прямо сейчас' : (cat ? cat.name : 'Упражнение');
  taskEl('task-q').textContent = task.q || '';
  taskEl('task-back').innerHTML = icon('arrowLeft', 18) + '<span>' + (demo ? 'Назад' : 'Тренировки') + '</span>';

  const bar = taskEl('task-progress');
  bar.hidden = !demo;
  if(demo){
    const pct = Math.round(idx / total * 100);
    taskEl('task-progress-fill').style.width = pct + '%';
    bar.setAttribute('aria-valuenow', String(pct));
    // после прорисовки заполняем до текущего шага (анимация)
    requestAnimationFrame(()=> { taskEl('task-progress-fill').style.width = Math.round((idx + 0.5) / total * 100) + '%'; });
  }

  const stage = taskEl('task-stage');
  stage.innerHTML = '';
  stage.className = 'task-stage';
  const fb = taskEl('task-feedback'); fb.textContent = ''; fb.className = 'task-feedback';

  const check = taskEl('task-check'), skip = taskEl('task-skip'), next = taskEl('task-next'), close = taskEl('task-close'), hint = taskEl('task-hint');
  check.classList.remove('hidden'); check.disabled = false; skip.classList.remove('hidden');
  next.classList.add('hidden'); close.classList.add('hidden');
  hint.hidden = !task.hint;

  startTaskTimer();
  go('screen-task');

  const def = TASK_TYPES[task.type];
  if(!def){ fb.textContent = 'Неизвестный тип упражнения: ' + task.type; fb.className = 'task-feedback bad'; return; }
  def.render(task, {
    stage,
    setCheck(fn){ trainer.checkFn = fn; },
    enable(on){ check.disabled = !on; },
    noCheck(){ check.classList.add('hidden'); },
    showCheck(on){ check.classList.toggle('hidden', !on); },
    finish(res){ completeTask(res); },
  });
}

function startTaskTimer(){
  clearInterval(trainer.timerId);
  trainer.startedAt = Date.now();
  const el = taskEl('task-timer');
  const render = ()=> { el.innerHTML = icon('clock', 16) + ' ' + fmtTime((Date.now() - trainer.startedAt) / 1000); };
  render();
  trainer.timerId = setInterval(render, 1000);
}

/* ---------- кнопки ---------- */
function onTaskCheck(){
  if(trainer.done || !trainer.checkFn) return;
  const res = trainer.checkFn();
  const fb = taskEl('task-feedback');
  if(!res){
    fb.textContent = 'Сначала выполни задание.';
    fb.className = 'task-feedback info';
    return;
  }
  if(res.retry){                                   // неверно, но можно исправить
    fb.textContent = res.msg || 'Пока неверно — попробуй ещё раз.';
    fb.className = 'task-feedback bad';
    shakeEl(taskEl('task-stage'));
    return;
  }
  completeTask(res);
}

function completeTask(res){
  if(trainer.done) return;
  trainer.done = true;
  clearInterval(trainer.timerId);
  const ok = !!res.ok;
  const stage = taskEl('task-stage');
  stage.classList.add(ok ? 'is-correct' : 'is-wrong');

  const fb = taskEl('task-feedback');
  fb.textContent = (ok ? 'Верно! ' : 'Не совсем. ') + (res.msg || '');
  fb.className = 'task-feedback ' + (ok ? 'good' : 'bad');

  taskEl('task-check').classList.add('hidden');
  taskEl('task-skip').classList.add('hidden');
  taskEl('task-hint').hidden = true;

  const next = taskEl('task-next'), close = taskEl('task-close');
  next.classList.remove('hidden');
  if(trainer.mode === 'demo'){
    trainer.demo.results.push({ id: trainer.task.id, cat: trainer.cat, ok });
    const last = trainer.demo.index >= trainer.demo.list.length - 1;
    next.textContent = last ? 'Результат' : 'Далее';
  } else {
    recordTask(trainer.cat, trainer.task.id, ok);
    next.textContent = 'Ещё задание';
    close.classList.remove('hidden');
  }
  next.focus();
}

function onTaskSkip(){
  if(trainer.done) return;
  clearInterval(trainer.timerId);
  if(trainer.mode === 'demo'){
    trainer.demo.results.push({ id: trainer.task.id, cat: trainer.cat, ok:false, skipped:true });
    advanceDemo();
  } else {
    const t = pickTask(trainer.cat);
    if(t) showTask(t);
  }
}

function onTaskNext(){
  if(trainer.mode === 'demo') advanceDemo();
  else startCategory(trainer.cat);
}

function advanceDemo(){
  if(trainer.demo.index < trainer.demo.list.length - 1){
    trainer.demo.index++;
    showDemoTask();
  } else {
    finishDemo();
  }
}

function onTaskHint(){
  const t = trainer.task;
  if(!t || !t.hint || trainer.done) return;
  const fb = taskEl('task-feedback');
  fb.textContent = 'Подсказка: ' + t.hint;
  fb.className = 'task-feedback info';
  trainer.hintUsed = true;
}

function closeTask(){
  clearInterval(trainer.timerId);
  if(trainer.mode === 'demo') go('screen-welcome');
  else openTraining();
}
