/* =============================================================
   Культура развивает — экраны: выбор культуры, интро региона,
   результат, история прохождения. Навигация и прохождение
   упражнений — в core.js, сами упражнения — в js/exercises/.
   Без регистрации и сервера: прогресс — в localStorage
   (см. storage.js).
   ============================================================= */

function renderCultureGrid(){
  const grid = document.getElementById('culture-grid');
  grid.innerHTML = '';
  REGION_ORDER.forEach(id=>{
    const c = CULTURES[id];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'culture-card';
    btn.dataset.culture = id;
    btn.innerHTML =
      '<span class="culture-thumb culture-thumb--'+id+'"></span>' +
      '<span class="culture-name">'+c.name+'</span>';
    // картинка карточки: c.thumb из data.js или assets/culture-<id>.png.
    // Путь делаем абсолютным от страницы: иначе url() в CSS-переменной
    // браузер считает от папки css/ и ищет css/assets/.
    const thumbUrl = new URL(assetUrl(c.thumb || 'culture-' + id + '.png'), document.baseURI).href;
    btn.querySelector('.culture-thumb').style.setProperty('--thumb-img', 'url("' + thumbUrl + '")');
    btn.onclick = ()=>{ openCulture(id); };
    grid.appendChild(btn);
  });
}

function openCulture(id){
  current = CULTURES[id];
  const app = document.getElementById('app');
  app.classList.remove(...THEME_CLASSES);
  app.classList.add('theme-' + id);
  document.body.classList.remove(...THEME_CLASSES);
  document.body.classList.add('theme-' + id);

  document.getElementById('intro-title').innerHTML = current.name + ' <span class="native">' + current.native + '</span>';
  document.getElementById('intro-lede').innerHTML = 'Сегодня ты познакомишься с языком и культурой ' + current.nameGenitive + ' через <b>5 небольших заданий</b>.';
  document.getElementById('intro-native').innerText = current.native;
  renderMascot('intro-mascot', id, 'plain');
  document.getElementById('ex-back').innerText = '← ' + current.native;
  document.getElementById('intro-timer').innerHTML = hourglassSVG() + ' 09:59';

  go('screen-intro');
}

/* ---------- результат ---------- */

function resultComment(overall){
  if(overall >= 85) return 'Отличная работа';
  if(overall >= 60) return 'Хороший результат — есть куда расти';
  return 'Попробуй ещё раз — получится лучше';
}

function showResults(){
  go('screen-results');
  renderMascot('res-mascot', 'neutral', 'cap');
  document.getElementById('res-greeting').innerText = current.greeting;

  const result = buildResult(session.results);
  recordCultureSession(current.id, result);
  document.getElementById('res-pct').innerText = result.overall + '%';
  document.querySelector('#screen-results .result-sub').innerText = resultComment(result.overall);

  const words = session.words.length;
  const traditions = session.plan.filter(e=>e.type === 'ornament').length;
  const recipes = session.plan.filter(e=>e.type === 'recipe').length;
  document.getElementById('res-learned-line').innerHTML =
    'Ты узнал: <b>' + words + '</b> ' + current.langGenitive + ' ' + ruPlural(words, 'слово', 'слова', 'слов') +
    ' · <b>' + traditions + '</b> ' + ruPlural(traditions, 'традицию', 'традиции', 'традиций') +
    ' · <b>' + recipes + '</b> ' + ruPlural(recipes, 'рецепт', 'рецепта', 'рецептов');

  animateBar('bar-memory','val-memory',result.memory);
  animateBar('bar-attention','val-attention',result.attention);
  animateBar('bar-logic','val-logic',result.logic);

  saveHistoryEntry(current.id, result);
}

/* pct === null — навык в этой тренировке не проверялся */
function animateBar(barId, valId, pct){
  const bar = document.getElementById(barId), val = document.getElementById(valId);
  bar.style.width = '0%';
  requestAnimationFrame(()=>{ bar.style.width = (pct === null ? 0 : pct) + '%'; });
  val.innerText = pct === null ? '—' : pct + '%';
}

function goNextCulture(){
  const idx = REGION_ORDER.indexOf(current ? current.id : REGION_ORDER[0]);
  openCulture(REGION_ORDER[(idx + 1) % REGION_ORDER.length]);
}

/* ---------- история прохождения (localStorage, см. storage.js) ---------- */

function openHistory(){
  renderHistoryScreen();
  go('screen-history');
}

function historyBar(name, pct){
  const shown = pct === null || pct === undefined ? null : pct;
  return '<div class="bar-row"><div class="bname">' + name + '</div>' +
    '<div class="bar-track"><div class="bar-fill" style="width:' + (shown === null ? 0 : shown) + '%"></div></div>' +
    '<div class="bar-val">' + (shown === null ? '—' : shown + '%') + '</div></div>';
}

function renderHistoryScreen(){
  const hist = loadHistory();
  const entries = REGION_ORDER.filter(id=>hist[id]);
  const listEl = document.getElementById('history-list');
  if(!listEl) return;

  if(entries.length === 0){
    listEl.innerHTML = '<div class="box"><p class="box-text">Ты ещё не прошёл ни одной тренировки. Выбери культуру на главной — и результат появится здесь.</p></div>';
    return;
  }

  listEl.innerHTML = '';
  entries.forEach(id=>{
    const c = CULTURES[id];
    const h = hist[id];
    const s = h.lastScore || {};
    const box = document.createElement('div');
    box.className = 'box theme-' + id;
    box.innerHTML =
      '<div class="history-head">' +
        '<div class="history-name">' + c.name + '</div>' +
        '<div class="history-meta">Пройдено раз: ' + h.timesCompleted + ' · лучший результат ' + h.best + '% · ' + formatHistoryDate(h.lastCompletedAt) + '</div>' +
      '</div>' +
      historyBar('Память', s.memory) + historyBar('Внимание', s.attention) + historyBar('Логика', s.logic) +
      '<div class="history-actions"><button class="btn" type="button">Повторить →</button></div>';
    box.querySelector('button').onclick = ()=> openCulture(id);
    listEl.appendChild(box);
  });
}

function clearHistoryUI(){
  if(confirm('Удалить сохранённую историю прохождения на этом устройстве?')){
    clearHistory();
    renderHistoryScreen();
  }
}

renderCultureGrid();
renderMascot('select-mascots', 'neutral', 'group');
