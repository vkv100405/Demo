/* =================================================================
   Культура развивает — сохранение истории прохождения.

   Никакой регистрации и сервера: прогресс хранится в localStorage
   прямо в браузере пользователя (на этом устройстве). Поэтому сайт
   остаётся полностью статическим и его можно разместить на GitHub
   Pages без какого-либо бэкенда.

   Если localStorage недоступен (приватный режим, запрет cookies,
   квота исчерпана) — все функции просто молча ничего не делают,
   сайт при этом продолжает работать как обычно.
   ================================================================= */

const HISTORY_KEY = 'culture-develops-history-v1';

function loadHistory(){
  try{
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  }catch(e){
    return {};
  }
}

function saveHistoryEntry(cultureId, result){
  try{
    const hist = loadHistory();
    const prev = hist[cultureId] || { timesCompleted: 0, best: 0 };
    hist[cultureId] = {
      timesCompleted: prev.timesCompleted + 1,
      lastCompletedAt: new Date().toISOString(),
      lastScore: result,
      best: Math.max(prev.best || 0, result.overall)
    };
    localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
  }catch(e){
    /* localStorage недоступен — прогресс просто не сохранится в этот раз */
  }
}

function clearHistory(){
  try{ localStorage.removeItem(HISTORY_KEY); }catch(e){}
}

function formatHistoryDate(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', { day:'2-digit', month:'2-digit', year:'numeric' });
  }catch(e){
    return '';
  }
}

/* =================================================================
   Профиль и статистика (localStorage). Без регистрации: ник и
   иконка вводятся при первом заходе, всё хранится в браузере.
   Демо-результат до создания профиля — в sessionStorage.
   ================================================================= */

const PROFILE_KEY = 'culture-develops-profile-v1';
const STATS_KEY   = 'culture-develops-stats-v1';
const DEMO_KEY    = 'culture-develops-demo-v1';

function readJSON(store, key, fallback){
  try{
    const raw = store.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  }catch(e){ return fallback; }
}
function writeJSON(store, key, value){
  try{ store.setItem(key, JSON.stringify(value)); return true; }
  catch(e){ return false; }
}
function safeStore(name){ try{ return window[name]; }catch(e){ return null; } }

/* ---- профиль: { nick, avatar, goal } ---- */
function loadProfile(){
  const p = readJSON(safeStore('localStorage'), PROFILE_KEY, null);
  return p && p.nick ? p : null;
}
function saveProfile(p){ return writeJSON(safeStore('localStorage'), PROFILE_KEY, p); }
function clearProfile(){ try{ localStorage.removeItem(PROFILE_KEY); }catch(e){} }

/* ---- демо-результат ---- */
function saveDemoResult(r){ writeJSON(safeStore('sessionStorage'), DEMO_KEY, r); }
function loadDemoResult(){ return readJSON(safeStore('sessionStorage'), DEMO_KEY, null); }

/* ---- статистика ----
   { xp, streak:{count,last}, cats:{id:{done,correct,lastAt}}, seen:{id:[taskId]}, log:[...] } */
function emptyStats(){ return { xp:0, streak:{ count:0, last:null }, cats:{}, seen:{}, log:[] }; }
function loadStats(){
  const s = readJSON(safeStore('localStorage'), STATS_KEY, null);
  return s ? Object.assign(emptyStats(), s) : emptyStats();
}
function saveStats(s){ return writeJSON(safeStore('localStorage'), STATS_KEY, s); }
function clearStats(){ try{ localStorage.removeItem(STATS_KEY); }catch(e){} }

function dayKey(d){
  const dt = d || new Date();
  return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
}
function daysBetween(a, b){            // a, b — 'YYYY-MM-DD'
  const pa = a.split('-').map(Number), pb = b.split('-').map(Number);
  return Math.round((Date.UTC(pb[0], pb[1]-1, pb[2]) - Date.UTC(pa[0], pa[1]-1, pa[2])) / 86400000);
}

/* Серия дней: если последняя активность была вчера — продолжаем, сегодня — не меняем, раньше — начинаем заново */
function touchStreak(s){
  const today = dayKey();
  if(s.streak.last === today) return;
  s.streak.count = (s.streak.last && daysBetween(s.streak.last, today) === 1) ? s.streak.count + 1 : 1;
  s.streak.last = today;
}
/* Серия для показа: если пропущен хотя бы один день — 0 */
function currentStreak(s){
  if(!s.streak.last) return 0;
  return daysBetween(s.streak.last, dayKey()) <= 1 ? s.streak.count : 0;
}

const XP_PER_LEVEL = 50;
function levelInfo(xp){
  return { level: Math.floor(xp / XP_PER_LEVEL) + 1, into: xp % XP_PER_LEVEL, need: XP_PER_LEVEL };
}

function bumpCat(s, catId, ok){
  const c = s.cats[catId] || (s.cats[catId] = { done:0, correct:0, lastAt:null });
  c.done++; if(ok) c.correct++;
  c.lastAt = new Date().toISOString();
}

/* Результат одного упражнения категории */
function recordTask(catId, taskId, ok){
  const s = loadStats();
  bumpCat(s, catId, ok);
  s.xp += ok ? 10 : 3;
  const seen = s.seen[catId] || (s.seen[catId] = []);
  if(!seen.includes(taskId)) seen.push(taskId);
  s.log.unshift({ c:catId, id:taskId, ok:!!ok, at:new Date().toISOString() });
  s.log = s.log.slice(0, 30);
  touchStreak(s);
  saveStats(s);
}

/* Прохождение «Культуры» (4 задания региона) — вносим в статистику по навыкам */
function recordCultureSession(regionId, result){
  const s = loadStats();
  const map = { memory:'memory', attention:'attention', logic:'problem' };
  Object.keys(map).forEach(k=>{
    if(result[k] !== null && result[k] !== undefined) bumpCat(s, map[k], result[k] >= 60);
  });
  s.xp += Math.round(result.overall / 5);
  s.log.unshift({ c:'culture', id:regionId, ok: result.overall >= 60, at:new Date().toISOString(), score:result.overall });
  s.log = s.log.slice(0, 30);
  touchStreak(s);
  saveStats(s);
}
