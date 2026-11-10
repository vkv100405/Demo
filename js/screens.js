/* =================================================================
   Культура развивает — экраны: заставка, знакомство, демо-результат,
   профиль (ник + иконка), цель, личный кабинет, тренировки,
   статистика. Данные — localStorage (см. storage.js).
   ================================================================= */

const $ = id => document.getElementById(id);
const catById = id => CATEGORIES.find(c => c.id === id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));

/* ---------- аватар: PNG из assets/ или цветная заглушка ---------- */
function avatarHTML(file, nick, cls){
  const i = Math.max(0, AVATARS.findIndex(a => a.file === file));
  const [c1, c2] = AVATAR_FALLBACK_COLORS[i % AVATAR_FALLBACK_COLORS.length];
  const letter = esc((nick || '?').trim().charAt(0).toUpperCase());
  return '<span class="avatar ' + (cls || '') + '" style="--c1:' + c1 + ';--c2:' + c2 + '">' +
    '<span class="avatar-letter" aria-hidden="true">' + letter + '</span>' +
    '<img src="' + esc(assetUrl(file)) + '" alt="" onerror="this.remove()"></span>';
}

function userHead(){
  const p = loadProfile() || { nick:'Гость', avatar:AVATARS[0].file };
  return '<div class="brand small">Культура развивает</div>' +
    '<button class="user-chip" type="button" onclick="go(\'screen-me\')" aria-label="Профиль: ' + esc(p.nick) + '">' +
    avatarHTML(p.avatar, p.nick, 'sm') + '<span class="user-name">' + esc(p.nick) + '</span></button>';
}

/* ---------- заставка и первичный маршрут ---------- */
function route(){
  if(loadProfile()) openCabinet(); else openWelcome();
}

/* ---------- знакомство с постепенным появлением ---------- */
let revealObserver = null;
function setupReveal(root){
  const els = root.querySelectorAll('.reveal:not(.in)');
  if(!('IntersectionObserver' in window)){ els.forEach(e => e.classList.add('in')); return; }
  if(revealObserver) revealObserver.disconnect();
  revealObserver = new IntersectionObserver(es => es.forEach(e=>{
    if(e.isIntersecting){ e.target.classList.add('in'); revealObserver.unobserve(e.target); }
  }), { threshold: 0.2 });
  els.forEach((e, i)=>{ e.style.transitionDelay = Math.min(i, 3) * 90 + 'ms'; revealObserver.observe(e); });
}

function openWelcome(){
  renderMascot('welcome-mascot', 'neutral', 'cap');
  const facts = FACTS.filter(f => f.text).slice(0, 3);
  $('welcome-facts').innerHTML = facts.map(f => '<div class="fact-tile">' + esc(f.text) + '</div>').join('');
  $('welcome-after').classList.add('hidden');
  $('welcome-gate').classList.remove('done');
  go('screen-welcome');
  setupReveal($('screen-welcome'));
}

function onWelcomeYes(){
  $('welcome-gate').classList.add('done');
  renderMascot('welcome-mascot', 'neutral', 'flex');
  $('welcome-after').classList.remove('hidden');
  setupReveal($('welcome-after'));
  $('welcome-after').scrollIntoView({ behavior:'smooth', block:'start' });
}

/* ---------- демо: итог ---------- */
function finishDemo(){
  const res = trainer.demo.results, total = trainer.demo.list.length;
  const good = res.filter(r => r.ok).length;
  saveDemoResult({ good, total, at: Date.now() });
  $('demo-num').textContent = good + ' из ' + total;
  $('demo-text').textContent = good === total ? 'Отличное начало! Мозг уже разогрелся — дальше будет интереснее.'
    : good > 0 ? 'Хорошее начало! С регулярными тренировками результат вырастет.'
    : 'Ничего страшного — это только разминка. Тренировки как раз для этого.';
  go('screen-demo-result');
}
function afterDemo(){ loadProfile() ? openCabinet() : openProfileCreate(); }

/* ---------- профиль: создание / правка ---------- */
let profileDraft = { avatar: null };
function openProfileCreate(){ buildProfile(false); }
function openProfileEdit(){ buildProfile(true); }

function buildProfile(edit){
  const p = loadProfile();
  profileDraft.avatar = (edit && p) ? p.avatar : null;
  profileDraft.edit = edit;
  $('profile-nick').value = (edit && p) ? p.nick : '';
  $('profile-error').textContent = '';
  $('profile-title').textContent = edit ? 'Профиль' : 'Как тебя зовут?';
  $('profile-sub').classList.toggle('hidden', edit);
  $('profile-back').classList.toggle('hidden', !edit);
  $('profile-reset').classList.toggle('hidden', !edit);
  $('profile-save').textContent = edit ? 'Сохранить' : 'Продолжить';
  const grid = $('avatar-grid'); grid.innerHTML = '';
  AVATARS.forEach(a=>{
    const b = h('button', 'avatar-opt', avatarHTML(a.file, '', 'lg'));
    b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-label', a.label);
    b.setAttribute('aria-checked', String(a.file === profileDraft.avatar));
    b.classList.toggle('selected', a.file === profileDraft.avatar);
    b.addEventListener('click', ()=>{
      profileDraft.avatar = a.file;
      grid.querySelectorAll('.avatar-opt').forEach(x=>{ x.classList.toggle('selected', x === b); x.setAttribute('aria-checked', String(x === b)); });
      validateProfile();
    });
    grid.appendChild(b);
  });
  validateProfile();
  go('screen-profile');
  setTimeout(()=> $('profile-nick').focus(), 50);
}

function validateProfile(){
  const n = $('profile-nick').value.trim();
  $('profile-save').disabled = !(n.length >= 2 && profileDraft.avatar);
}

function onProfileSubmit(e){
  e.preventDefault();
  const nick = $('profile-nick').value.trim();
  if(nick.length < 2){ $('profile-error').textContent = 'Ник — минимум 2 символа.'; return; }
  if(!profileDraft.avatar) return;
  const old = loadProfile();
  saveProfile({ nick, avatar: profileDraft.avatar, goal: old ? old.goal : null });
  if(profileDraft.edit) openMe(); else openGoal(false);
}

function resetAll(){
  if(!confirm('Удалить профиль и всю статистику на этом устройстве?')) return;
  clearProfile(); clearStats(); clearHistory();
  try{ sessionStorage.clear(); }catch(e){}
  openWelcome();
}

/* ---------- цель ---------- */
let goalDraft = null, goalFromSettings = false;
function openGoal(fromSettings){
  goalFromSettings = !!fromSettings;
  const p = loadProfile();
  goalDraft = p && p.goal ? p.goal : null;
  const grid = $('goal-grid'); grid.innerHTML = '';
  GOALS.forEach(g=>{
    const b = h('button', 'goal-card', '<span class="goal-ico">' + icon(g.icon, 28) + '</span><b>' + esc(g.name) + '</b><small>' + esc(g.desc) + '</small>');
    b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(g.id === goalDraft));
    b.classList.toggle('selected', g.id === goalDraft);
    b.addEventListener('click', ()=>{
      goalDraft = g.id;
      grid.querySelectorAll('.goal-card').forEach(x=>{ x.classList.toggle('selected', x === b); x.setAttribute('aria-checked', String(x === b)); });
      $('goal-next').disabled = false;
    });
    grid.appendChild(b);
  });
  $('goal-next').disabled = !goalDraft;
  go('screen-goal');
}
function onGoalNext(){
  if(!goalDraft) return;
  const p = loadProfile() || { nick:'Гость', avatar:AVATARS[0].file };
  p.goal = goalDraft; saveProfile(p);
  openCabinet();
}

/* ---------- рекомендации ---------- */
function recommendCategory(){
  const p = loadProfile(), s = loadStats();
  const goal = GOALS.find(g => p && g.id === p.goal);
  const pool = goal ? goal.categories : CATEGORIES.map(c => c.id);
  const done = id => (s.cats[id] ? s.cats[id].done : 0);
  return catById(pool.slice().sort((a, b)=> done(a) - done(b))[0]);
}
function recoCard(){
  const c = recommendCategory(); if(!c) return '';
  return '<button class="reco-card" type="button" onclick="startCategory(\'' + c.id + '\')" style="--cat:' + c.color + '">' +
    '<span class="reco-ico">' + icon(c.icon, 32) + '</span>' +
    '<span class="reco-text"><small>Продолжить тренировку</small><b>' + esc(c.name) + '</b><span>' + esc(c.desc) + '</span></span>' +
    '<span class="reco-go" aria-hidden="true">→</span></button>';
}

function catCard(c){
  const st = loadStats().cats[c.id] || { done:0, correct:0 };
  return '<button class="cat-card" type="button" onclick="startCategory(\'' + c.id + '\')" style="--cat:' + c.color + '">' +
    '<span class="cat-ico">' + icon(c.icon, 26) + '</span><b>' + esc(c.name) + '</b>' +
    '<small>' + (st.done ? 'Выполнено: ' + st.done : 'Ещё не пробовал') + '</small></button>';
}

function dashHTML(){
  const s = loadStats(), L = levelInfo(s.xp), total = Object.values(s.cats).reduce((a, c)=> a + c.done, 0);
  const ok = Object.values(s.cats).reduce((a, c)=> a + c.correct, 0);
  const pct = Math.round(L.into / L.need * 100);
  return '<div class="dash-card"><small>Уровень</small><b class="dash-num">' + L.level + '</b>' +
      '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
      '<small>' + L.into + ' / ' + L.need + ' XP</small></div>' +
    '<div class="dash-card"><small>Серия дней</small><b class="dash-num">' + icon('flame', 22) + ' ' + currentStreak(s) + '</b><small>подряд</small></div>' +
    '<div class="dash-card"><small>Заданий</small><b class="dash-num">' + total + '</b><small>верно: ' + ok + '</small></div>';
}

/* ---------- экраны главного меню ---------- */
function openCabinet(){
  $('cabinet-head').innerHTML = userHead();
  $('cabinet-dash').innerHTML = dashHTML();
  $('cabinet-reco').innerHTML = recoCard();
  $('cabinet-cats').innerHTML = CATEGORIES.map(catCard).join('');
  go('screen-cabinet');
}

function openTraining(){
  $('train-head').innerHTML = userHead();
  $('train-pills').innerHTML = CATEGORIES.map(c =>
    '<button class="cat-pill" type="button" onclick="startCategory(\'' + c.id + '\')">' + icon(c.icon, 16) + ' ' + esc(c.name) + '</button>').join('');
  $('train-reco').innerHTML = recoCard();
  renderFact();
  go('screen-train');
}

function renderFact(){
  const f = FACTS[Math.floor(Math.random() * FACTS.length)], box = $('train-fact');
  if(f.text){
    box.innerHTML = '<small>Знаешь ли ты?</small><p>' + esc(f.text) + '</p>';
  } else {
    box.innerHTML = '<small>Миф или правда?</small><p>' + esc(f.myth) + '</p>' +
      '<div class="task-actions"><button class="btn-ghost" data-a="1" type="button">Правда</button><button class="btn-ghost" data-a="0" type="button">Миф</button></div>';
    box.querySelectorAll('button').forEach(b => b.addEventListener('click', ()=>{
      const ok = (b.dataset.a === '1') === f.answer;
      box.innerHTML = '<small>' + (ok ? 'Верно!' : 'Не совсем.') + '</small><p>' + esc(f.explain) + '</p>';
    }));
  }
}

function openStats(){
  const s = loadStats();
  $('stats-head').innerHTML = userHead();
  $('stats-dash').innerHTML = dashHTML();
  $('stats-cats').innerHTML = CATEGORIES.map(c=>{
    const x = s.cats[c.id] || { done:0, correct:0 }, pct = x.done ? Math.round(x.correct / x.done * 100) : 0;
    return '<div class="stat-row" style="--cat:' + c.color + '"><span class="stat-name">' + icon(c.icon, 18) + ' ' + esc(c.name) + '</span>' +
      '<div class="progress" role="progressbar" aria-label="' + esc(c.name) + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
      '<span class="stat-val">' + (x.done ? x.correct + '/' + x.done : '—') + '</span></div>';
  }).join('');
  $('stats-log').innerHTML = s.log.length ? s.log.slice(0, 10).map(l=>{
    const c = catById(l.c), name = c ? c.name : 'Культуры России' + (l.score !== undefined ? ' · ' + l.score + '%' : '');
    return '<li class="' + (l.ok ? 'good' : 'bad') + '">' + icon(l.ok ? 'check' : 'x', 16) + ' ' + esc(name) + ' <small>' + formatHistoryDate(l.at) + '</small></li>';
  }).join('') : '<li>Пока пусто — выполни первое задание.</li>';
  go('screen-stats');
}

function openMe(){
  const p = loadProfile(); if(!p) return openProfileCreate();
  const g = GOALS.find(x => x.id === p.goal);
  $('me-head').innerHTML = userHead();
  $('me-avatar').innerHTML = avatarHTML(p.avatar, p.nick, 'xl');
  $('me-nick').textContent = p.nick;
  $('me-goal').textContent = g ? 'Цель: ' + g.name : 'Цель не выбрана';
  go('screen-me');
}

/* ---------- запуск ---------- */
function initScreens(){
  renderMascot('splash-mascot', 'neutral', 'cap');
  $('welcome-yes').addEventListener('click', onWelcomeYes);
  $('welcome-try').addEventListener('click', startDemo);
  $('demo-go').addEventListener('click', afterDemo);
  $('profile-form').addEventListener('submit', onProfileSubmit);
  $('profile-nick').addEventListener('input', ()=>{ $('profile-error').textContent = ''; validateProfile(); });
  $('profile-reset').addEventListener('click', resetAll);
  $('goal-next').addEventListener('click', onGoalNext);
  $('task-back').addEventListener('click', ()=>{});   // действие задаёт onclick в разметке
  const nav = { 'screen-cabinet':openCabinet, 'screen-train':openTraining, 'screen-stats':openStats, 'screen-me':openMe };
  $('mainnav').querySelectorAll('button').forEach(b => b.addEventListener('click', ()=> nav[b.dataset.nav]()));
  // ссылки <a onclick> доступны с клавиатуры
  document.querySelectorAll('a[onclick]').forEach(a=>{
    a.setAttribute('role', 'button'); a.tabIndex = 0;
    a.addEventListener('keydown', e=>{ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); a.click(); } });
  });
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(route, reduce ? 300 : 1800);
}
