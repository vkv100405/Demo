/* Типы упражнений: choice, input, count, match, order, free.
   Контракт — см. шапку js/trainer.js. Поля заданий — js/content/tasks.js. */

/* ---------- choice: выбор одного варианта ---------- */
registerTask('choice', { render(t, api){
  const st = api.stage;
  if(t.before) st.appendChild(h('div', 'task-before', t.before));
  const list = h('div', 'opts');
  list.setAttribute('role', 'radiogroup');
  let picked = null;
  const opts = shuffle(t.options.map(o => typeof o === 'string' ? { value:o, html:o } : o));
  const btns = opts.map(o=>{
    const b = h('button', 'opt', o.html);
    b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
    b.addEventListener('click', ()=>{
      if(trainer.done) return;
      picked = o.value;
      btns.forEach(x=>{ x.classList.toggle('selected', x === b); x.setAttribute('aria-checked', String(x === b)); });
      api.enable(true);
    });
    list.appendChild(b); return b;
  });
  st.appendChild(list);
  api.enable(false);
  api.setCheck(()=>{
    if(picked === null) return null;
    const mine = btns[opts.findIndex(o => o.value === picked)];
    if(t.any){
      mine.classList.add('correct');
      return { ok:true, msg:(t.explains && t.explains[picked] ? t.explains[picked] + ' ' : '') + (t.explain || '') };
    }
    const ok = picked === t.answer;
    mine.classList.remove('selected');
    mine.classList.add(ok ? 'correct' : 'wrong');
    if(!ok) btns[opts.findIndex(o => o.value === t.answer)].classList.add('correct');
    btns.forEach(b => b.disabled = true);
    return { ok, msg:t.explain || '' };
  });
}});

/* ---------- input / count: ввод ответа ---------- */
function renderInput(t, api, answers, explain){
  const st = api.stage;
  if(t.before) st.appendChild(h('div', 'task-before', t.before));
  if(t.line) st.appendChild(h('div', 'task-line', t.line));
  const inp = h('input', 'task-input');
  inp.type = 'text'; inp.autocomplete = 'off'; inp.autocapitalize = 'off'; inp.spellcheck = false;
  inp.setAttribute('aria-label', 'Твой ответ');
  if(t.inputmode) inp.inputMode = t.inputmode;
  inp.placeholder = 'Введи ответ';
  st.appendChild(inp);
  api.enable(false);
  let tries = 0;
  inp.addEventListener('input', ()=> api.enable(inp.value.trim().length > 0));
  inp.addEventListener('keydown', e=>{ if(e.key === 'Enter') onTaskCheck(); });
  setTimeout(()=> inp.focus(), 50);
  api.setCheck(()=>{
    const v = inp.value.trim();
    if(!v) return null;
    const ok = answers.some(a => norm(a) === norm(v));
    if(ok){ inp.classList.add('correct'); inp.readOnly = true; return { ok:true, msg:explain }; }
    tries++;
    inp.classList.add('wrong');
    setTimeout(()=> inp.classList.remove('wrong'), 600);
    if(tries >= 2){ inp.readOnly = true; return { ok:false, msg:'Правильный ответ: ' + answers[0] + '. ' + explain }; }
    return { ok:false, retry:true, msg:'Пока неверно — у тебя есть ещё одна попытка.' };
  });
}
registerTask('input', { render(t, api){ renderInput(t, api, t.answers, t.explain || ''); }});
registerTask('count', { render(t, api){
  const n = t.line.split(/\s+/).filter(x => x === t.target).length;
  renderInput(Object.assign({}, t, { inputmode:'numeric' }), api, [String(n)], 'В строке «' + t.target + '» встречается ' + n + ' раз(а).');
}});

/* ---------- match: соединить пары ---------- */
registerTask('match', { render(t, api){
  const st = api.stage;
  const wrap = h('div', 'match');
  const left = h('div', 'match-col'), right = h('div', 'match-col');
  let sel = null, done = 0, errors = 0;
  const mk = (txt, idx, col)=>{
    const b = h('button', 'opt'); b.type = 'button'; b.textContent = txt; b.dataset.i = idx;
    col.appendChild(b); return b;
  };
  const L = shuffle(t.pairs.map((p, i)=> [p[0], i])).map(([txt, i])=> mk(txt, i, left));
  const R = shuffle(t.pairs.map((p, i)=> [p[1], i])).map(([txt, i])=> mk(txt, i, right));
  const pick = (b, side)=>{
    if(trainer.done || b.classList.contains('correct')) return;
    if(!sel || sel.side === side){
      if(sel) sel.b.classList.remove('selected');
      sel = { b, side }; b.classList.add('selected'); return;
    }
    const a = sel.b, c = b; sel.b.classList.remove('selected'); sel = null;
    if(a.dataset.i === c.dataset.i){
      a.classList.add('correct'); c.classList.add('correct'); done++;
      if(done === t.pairs.length) api.finish({ ok: errors <= 1, msg: errors ? 'Ошибок: ' + errors + '.' : 'Без единой ошибки!' });
    } else {
      errors++;
      [a, c].forEach(x=>{ x.classList.add('wrong'); setTimeout(()=> x.classList.remove('wrong'), 450); });
    }
  };
  L.forEach(b => b.addEventListener('click', ()=> pick(b, 'l')));
  R.forEach(b => b.addEventListener('click', ()=> pick(b, 'r')));
  wrap.append(left, right); st.appendChild(wrap);
  api.noCheck();
}});

/* ---------- order: нажимать в правильном порядке ---------- */
registerTask('order', { render(t, api){
  const st = api.stage;
  const list = h('div', 'opts');
  let next = 0, errors = 0;
  shuffle(t.items.map((txt, i)=> ({ txt, i }))).forEach(o=>{
    const b = h('button', 'opt order-item'); b.type = 'button';
    b.innerHTML = '<span class="order-num" aria-hidden="true"></span><span></span>';
    b.lastChild.textContent = o.txt;
    b.addEventListener('click', ()=>{
      if(trainer.done || b.classList.contains('correct')) return;
      if(o.i === next){
        b.classList.add('correct'); b.firstChild.textContent = String(++next);
        if(next === t.items.length) api.finish({ ok: errors <= 1, msg: errors ? 'Ошибок: ' + errors + '.' : 'Порядок верный с первого раза!' });
      } else {
        errors++; b.classList.add('wrong'); setTimeout(()=> b.classList.remove('wrong'), 450);
      }
    });
    list.appendChild(b);
  });
  st.appendChild(list);
  api.noCheck();
}});

/* ---------- free: свободные идеи ---------- */
registerTask('free', { render(t, api){
  const st = api.stage;
  const box = h('div', 'free');
  const n = Math.max(t.min + 1, 4);
  const inputs = [];
  for(let i = 0; i < n; i++){
    const inp = h('input', 'task-input'); inp.type = 'text'; inp.autocomplete = 'off';
    inp.placeholder = 'Идея ' + (i + 1); inp.setAttribute('aria-label', 'Идея ' + (i + 1));
    inp.addEventListener('input', ()=> api.enable(distinct() >= t.min));
    inputs.push(inp); box.appendChild(inp);
  }
  const distinct = ()=> new Set(inputs.map(i => norm(i.value)).filter(Boolean)).size;
  st.appendChild(box);
  api.enable(false);
  api.setCheck(()=>{
    const d = distinct();
    if(d < t.min) return { ok:false, retry:true, msg:'Нужно хотя бы ' + t.min + ' разных идей.' };
    inputs.forEach(i => i.readOnly = true);
    return { ok:true, msg:'Идей: ' + d + '. Здесь нет неправильных ответов — важны гибкость и необычность.' };
  });
}});
