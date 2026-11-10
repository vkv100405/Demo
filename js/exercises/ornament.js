/* Игра «Восстанови последовательность»: плитки из банка нужно
   выставить в полоску в правильном порядке (тап или перетаскивание).
   Навык: логика. Каждое неверное нажатие — ошибка.

   Картинки плиток (в правильном порядке слева направо):
     • cfg.tiles = ['file1.png', 'https://…/2.png', …] — список файлов/ссылок;
     • либо по соглашению assets/ornament-<images или регион>-1..N.png.
   Если первой картинки нет — берутся татарские с поворотом оттенка
   (cfg.fallbackFilter), чтобы экран не был пустым. */
registerExercise('ornament', {
  skill: 'logic',
  timeLimit: 150,
  steps: { 'step-ornament': { progress: '03/05', time: 150 } },

  run(cfg, ctx){
    const region = ctx.culture.id;
    const set = cfg.images || region;   // имя набора плиток: assets/ornament-<set>-N.png
    const byName = (r, n)=> 'assets/ornament-' + r + '-' + n + '.png';
    const urls = Array.isArray(cfg.tiles)
      ? cfg.tiles.map(assetUrl)
      : Array.from({length: cfg.tiles || 5}, (_, i)=> byName(set, i + 1));
    const count = urls.length;
    const fallbackUrls = Array.from({length: count}, (_, i)=> byName('tatar', i + 1));

    ctx.show('step-ornament');
    document.getElementById('orn-desc').innerHTML = cfg.intro;
    let hinted = false;
    document.getElementById('orn-hint-link').onclick = ()=>{
      if(!hinted){ hinted = true; ctx.tracker.hints++; }
      alert(cfg.hint);
    };
    const nextBtn = document.getElementById('orn-next');
    nextBtn.classList.add('hidden');
    nextBtn.onclick = ctx.next;

    const order = shuffle(Array.from({length: count}, (_, i)=>i));

    const probe = new Image();
    probe.onload  = ()=> renderBoard(urls, 'none');
    probe.onerror = ()=> renderBoard(fallbackUrls, cfg.fallbackFilter || 'none');
    probe.src = urls[0];

    function renderBoard(tileUrls, filter){
      const strip = document.getElementById('orn-strip');
      const bank = document.getElementById('orn-tilebank');
      const progress = document.getElementById('orn-progress');
      strip.innerHTML = ''; bank.innerHTML = ''; progress.innerHTML = '';

      for(let i = 0; i < count; i++){
        const slot = document.createElement('div');
        slot.className = 'orn-slot';
        strip.appendChild(slot);
        const dot = document.createElement('div');
        dot.className = 'orn-dot';
        progress.appendChild(dot);
      }

      let nextExpected = 0;
      ctx.tracker.start();

      order.forEach(idx=>{
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'orn-tile';
        tile.dataset.idx = idx;
        tile.style.backgroundImage = 'url("' + tileUrls[idx] + '")';
        tile.style.filter = filter;
        tile.setAttribute('draggable', 'true');
        tile.onclick = ()=>{
          if(tile.classList.contains('used')) return;
          if(idx === nextExpected){
            const slot = strip.children[nextExpected];
            slot.classList.add('filled');
            slot.style.backgroundImage = tile.style.backgroundImage;
            slot.style.filter = filter;
            tile.classList.add('used');
            progress.children[nextExpected].classList.add('on');
            nextExpected++;
            ctx.tracker.hits++;
            if(nextExpected === count){
              ctx.complete();
              nextBtn.classList.remove('hidden');
            }
          } else {
            ctx.tracker.mistakes++;
            tile.classList.add('wrong');
            setTimeout(()=> tile.classList.remove('wrong'), 300);
          }
        };
        tile.ondragstart = e=> e.dataTransfer.setData('text/plain', String(idx));
        bank.appendChild(tile);
      });

      Array.from(strip.children).forEach(slot=>{
        slot.ondragover = e=> e.preventDefault();
        slot.ondrop = e=>{
          e.preventDefault();
          const idx = e.dataTransfer.getData('text/plain');
          const tile = Array.from(bank.children).find(t=>!t.classList.contains('used') && t.dataset.idx === idx);
          if(tile) tile.click();
        };
      });
    }
  }
});
