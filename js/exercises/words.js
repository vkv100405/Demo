/* Упражнение «Запомни слова». Не оценивается — это этап заучивания. */
registerExercise('words', {
  steps: { 'step-memorize': { progress: '03/05', time: 239 } },

  run(cfg, ctx){
    ctx.show('step-memorize');
    // из пула берём pick слов (по умолчанию 4) в случайном порядке
    const words = shuffle(cfg.words).slice(0, cfg.pick || 4);
    session.words = words.map(w => w.w);   // квиз спросит только об этих словах
    const grid = document.getElementById('word-grid');
    grid.innerHTML = '';
    words.forEach((item, i)=>{
      const iconKey = item.icon || WORD_ICON_ORDER[i] || 'star';
      const card = document.createElement('div');
      card.className = 'word-card';
      card.innerHTML =
        '<div class="front">' + item.w + '</div>' +
        '<div class="icon" id="word-icon-'+i+'">' + WORD_ICONS[iconKey] + '</div>' +
        '<div class="sub">' + item.m + '</div>';
      grid.appendChild(card);

      // если есть assets/word-<иконка>.png — он заменит SVG-заглушку
      const iconEl = card.querySelector('.icon');
      const imgSrc = item.image ? assetUrl(item.image) : 'assets/word-' + iconKey + '.png';
      const probe = new Image();
      probe.onload = ()=>{ iconEl.innerHTML = '<img class="asset-img" src="' + imgSrc + '" alt="">'; };
      probe.src = imgSrc;
    });
    document.getElementById('words-next').onclick = ctx.next;
  }
});
