/* Типы упражнений-игр: schulte, oddout, pairs, recall, sudoku, sort, stroop.
   Все завершаются сами (api.finish) либо проверяются кнопкой «Проверить». */

/* ---------- schulte: числа по порядку ---------- */
registerTask('schulte', { render(t, api){
  const n = t.size || 3, total = n * n;
  const grid = h('div', 'grid grid-' + n);
  let next = 1, errors = 0;
  const info = h('div', 'task-line', 'Найди: <b>1</b>');
  api.stage.append(info, grid);
  shuffle(Array.from({ length: total }, (_, i)=> i + 1)).forEach(v=>{
    const b = h('button', 'cell', String(v)); b.type = 'button';
    b.addEventListener('click', ()=>{
      if(trainer.done || b.classList.contains('correct')) return;
      if(v === next){
        b.classList.add('correct'); next++;
        if(next > total) api.finish({ ok: errors <= 2, msg: 'Ошибок: ' + errors + '.' });
        else info.innerHTML = 'Найди: <b>' + next + '</b>';
      } else { errors++; b.classList.add('wrong'); setTimeout(()=> b.classList.remove('wrong'), 350); }
    });
    grid.appendChild(b);
  });
  api.noCheck();
}});

/* ---------- oddout: найди отличающийся ---------- */
registerTask('oddout', { render(t, api){
  const PAIRS = [['О','Q'],['6','9'],['М','Н'],['Е','Ё'],['5','S'],['В','Б'],['3','8']];
  const rounds = t.rounds || 5;
  let r = 0, errors = 0;
  const info = h('div', 'task-line'), grid = h('div', 'grid grid-5');
  api.stage.append(info, grid);
  api.noCheck();
  const draw = ()=>{
    info.textContent = 'Таблица ' + (r + 1) + ' из ' + rounds;
    grid.innerHTML = '';
    const [a, b] = shuffle(PAIRS[Math.floor(Math.random() * PAIRS.length)]);
    const odd = Math.floor(Math.random() * 25);
    for(let i = 0; i < 25; i++){
      const c = h('button', 'cell', i === odd ? b : a); c.type = 'button';
      c.addEventListener('click', ()=>{
        if(trainer.done) return;
        if(i === odd){
          if(++r >= rounds) { c.classList.add('correct'); api.finish({ ok: errors <= 1, msg: 'Ошибок: ' + errors + '.' }); }
          else draw();
        } else { errors++; c.classList.add('wrong'); setTimeout(()=> c.classList.remove('wrong'), 350); }
      });
      grid.appendChild(c);
    }
  };
  draw();
}});

/* ---------- pairs: найди пары ---------- */
registerTask('pairs', { render(t, api){
  const n = t.symbols || 6;
  const SYM = ['★','●','▲','■','◆','♥','☾','✿','☀'].slice(0, n);
  const grid = h('div', 'grid pairs-grid');
  api.stage.appendChild(grid);
  api.noCheck();
  let open = [], matched = 0, fails = 0, lock = false;
  shuffle(SYM.concat(SYM)).forEach(s=>{
    const c = h('button', 'cell card', '<span class="card-face">' + s + '</span>');
    c.type = 'button'; c.setAttribute('aria-label', 'Карточка');
    c.addEventListener('click', ()=>{
      if(lock || trainer.done || c.classList.contains('open') || c.classList.contains('correct')) return;
      c.classList.add('open'); open.push({ c, s });
      if(open.length === 2){
        const [a, b] = open; open = [];
        if(a.s === b.s){
          [a.c, b.c].forEach(x=> x.classList.add('correct'));
          if(++matched === n) api.finish({ ok: fails <= n, msg: 'Неудачных попыток: ' + fails + '.' });
        } else {
          fails++; lock = true;
          setTimeout(()=>{ [a.c, b.c].forEach(x=> x.classList.remove('open')); lock = false; }, 700);
        }
      }
    });
    grid.appendChild(c);
  });
}});

/* ---------- recall: запомни и повтори ---------- */
registerTask('recall', { render(t, api){
  const st = api.stage;
  const show = h('div', 'recall-show'), info = h('div', 'task-line');
  st.append(info, show);
  api.enable(false);
  let left = t.seconds || 8;
  const memo = t.mode === 'type' ? t.text : t.items.join('   ·   ');
  show.textContent = memo;
  const tick = ()=>{ info.textContent = 'Запоминай: осталось ' + left + ' с'; };
  tick();
  const timer = setInterval(()=>{
    if(trainer.done){ clearInterval(timer); return; }
    if(--left > 0) { tick(); return; }
    clearInterval(timer); recall();
  }, 1000);
  api.showCheck(false);

  function recall(){
    show.remove(); api.showCheck(true);
    if(t.mode === 'type'){
      info.textContent = 'Введи число, которое было на экране.';
      const inp = h('input', 'task-input'); inp.type = 'text'; inp.inputMode = 'numeric'; inp.autocomplete = 'off';
      inp.setAttribute('aria-label', 'Число'); st.appendChild(inp); inp.focus();
      inp.addEventListener('input', ()=> api.enable(inp.value.trim().length > 0));
      inp.addEventListener('keydown', e=>{ if(e.key === 'Enter') onTaskCheck(); });
      api.setCheck(()=>{
        const v = inp.value.replace(/\D/g, ''), a = t.text.replace(/\D/g, '');
        if(!v) return null;
        const ok = v === a; inp.classList.add(ok ? 'correct' : 'wrong'); inp.readOnly = true;
        return { ok, msg: ok ? '' : 'Было: ' + t.text + '.' };
      });
    } else {
      info.textContent = 'Отметь слова, которые были на экране.';
      const list = h('div', 'opts opts-wrap'); const chosen = new Set();
      const btns = shuffle(t.items.concat(t.decoys || [])).map(w=>{
        const b = h('button', 'opt'); b.type = 'button'; b.textContent = w; b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', ()=>{
          if(trainer.done) return;
          chosen.has(w) ? chosen.delete(w) : chosen.add(w);
          b.classList.toggle('selected'); b.setAttribute('aria-pressed', String(chosen.has(w)));
          api.enable(chosen.size > 0);
        });
        list.appendChild(b); return b;
      });
      st.appendChild(list);
      api.setCheck(()=>{
        if(!chosen.size) return null;
        let hit = 0, wrong = 0;
        btns.forEach(b=>{
          const w = b.textContent, isReal = t.items.includes(w), pick = chosen.has(w);
          b.classList.remove('selected'); b.disabled = true;
          if(isReal) b.classList.add(pick ? 'correct' : 'missed');
          else if(pick) b.classList.add('wrong');
          if(isReal && pick) hit++; if(!isReal && pick) wrong++;
        });
        return { ok: hit >= t.items.length - 1 && wrong <= 1, msg: 'Найдено ' + hit + ' из ' + t.items.length + ', лишних: ' + wrong + '.' };
      });
    }
  }
}});

/* ---------- sudoku 4×4 ---------- */
registerTask('sudoku', { render(t, api){
  const g = t.grid.map(r => r.slice());
  const grid = h('div', 'sudoku');
  const cells = [];
  for(let r = 0; r < 4; r++) for(let c = 0; c < 4; c++){
    const fixed = t.grid[r][c] !== 0;
    const b = h('button', 'cell sud' + (fixed ? ' fixed' : '') + (c === 1 ? ' bR' : '') + (r === 1 ? ' bB' : ''), fixed ? String(g[r][c]) : '');
    b.type = 'button'; b.disabled = fixed;
    b.setAttribute('aria-label', 'Строка ' + (r + 1) + ', столбец ' + (c + 1) + (fixed ? ', ' + g[r][c] : ', пусто'));
    b.addEventListener('click', ()=>{
      if(trainer.done) return;
      g[r][c] = (g[r][c] + 1) % 5; b.textContent = g[r][c] ? String(g[r][c]) : '';
      b.classList.remove('wrong'); update();
    });
    cells.push(b); grid.appendChild(b);
  }
  api.stage.append(h('div', 'task-line', 'Нажимай на пустую клетку, чтобы менять цифру.'), grid);
  const update = ()=> api.enable(g.every(r => r.every(v => v > 0)));
  api.enable(false);
  const ok4 = a => new Set(a).size === 4;
  api.setCheck(()=>{
    if(!g.every(r => r.every(v => v > 0))) return null;
    const bad = new Set();
    for(let i = 0; i < 4; i++){
      const row = g[i], col = g.map(r => r[i]);
      if(!ok4(row)) for(let c = 0; c < 4; c++) bad.add(i * 4 + c);
      if(!ok4(col)) for(let r = 0; r < 4; r++) bad.add(r * 4 + i);
    }
    [[0,0],[0,2],[2,0],[2,2]].forEach(([r0, c0])=>{
      const box = [g[r0][c0], g[r0][c0+1], g[r0+1][c0], g[r0+1][c0+1]];
      if(!ok4(box)) for(let dr = 0; dr < 2; dr++) for(let dc = 0; dc < 2; dc++) bad.add((r0 + dr) * 4 + c0 + dc);
    });
    if(bad.size){
      cells.forEach((b, i)=> { if(bad.has(i) && !b.disabled) b.classList.add('wrong'); });
      return { ok:false, retry:true, msg:'Где-то цифры повторяются — исправь подсвеченные клетки.' };
    }
    cells.forEach(b => { if(!b.disabled) b.classList.add('correct'); });
    return { ok:true, msg:'Все цифры расставлены без повторов.' };
  });
}});

/* ---------- sort: разложить по группам (правило меняется) ---------- */
registerTask('sort', { render(t, api){
  const st = api.stage;
  let ri = 0, ii = 0, errors = 0, items = [];
  const title = h('div', 'task-line'), card = h('div', 'sort-card'), bks = h('div', 'sort-buckets');
  st.append(title, card, bks);
  api.noCheck();
  const loadRound = ()=>{
    const R = t.rounds[ri]; items = shuffle(R.items); ii = 0;
    title.innerHTML = '<b>' + R.title + '</b>';
    bks.innerHTML = '';
    R.buckets.forEach((name, bi)=>{
      const b = h('button', 'opt'); b.type = 'button'; b.textContent = name;
      b.addEventListener('click', ()=>{
        if(trainer.done) return;
        if(items[ii].b === bi){
          b.classList.add('correct'); setTimeout(()=> b.classList.remove('correct'), 300);
          if(++ii >= items.length){
            if(++ri >= t.rounds.length) return api.finish({ ok: errors <= 1, msg: 'Ошибок: ' + errors + '.' });
            loadRound(); return;
          }
          card.textContent = items[ii].t;
        } else { errors++; b.classList.add('wrong'); setTimeout(()=> b.classList.remove('wrong'), 350); }
      });
      bks.appendChild(b);
    });
    card.textContent = items[0].t;
  };
  loadRound();
}});

/* ---------- stroop: цвет чернил ---------- */
registerTask('stroop', { render(t, api){
  const COLORS = [['Красный','#D7263D'],['Синий','#1F5FBF'],['Зелёный','#1E8E3E'],['Жёлтый','#B58900']];
  const rounds = t.rounds || 8;
  let r = 0, errors = 0, ink = null;
  const info = h('div', 'task-line'), word = h('div', 'stroop-word'), bks = h('div', 'opts opts-wrap');
  api.stage.append(info, word, bks);
  api.noCheck();
  const draw = ()=>{
    info.textContent = 'Слово ' + (r + 1) + ' из ' + rounds;
    const w = COLORS[Math.floor(Math.random() * 4)];
    ink = COLORS.filter(c => c !== w)[Math.floor(Math.random() * 3)];
    word.textContent = w[0]; word.style.color = ink[1];
  };
  COLORS.forEach(c=>{
    const b = h('button', 'opt'); b.type = 'button'; b.textContent = c[0];
    b.addEventListener('click', ()=>{
      if(trainer.done) return;
      if(c === ink){ if(++r >= rounds) return api.finish({ ok: errors <= 2, msg: 'Ошибок: ' + errors + '.' }); draw(); }
      else { errors++; b.classList.add('wrong'); setTimeout(()=> b.classList.remove('wrong'), 350); }
    });
    bks.appendChild(b);
  });
  draw();
}});
