/* «Рецепт по памяти»: сначала показываем шаги рецепта, после
   «Запомнил» — игра «Восстанови порядок». Оценивается только игра
   (навык: память), каждое неверное нажатие — ошибка. */
registerExercise('recipe', {
  skill: 'memory',
  timeLimit: 150,
  steps: {
    'step-recipe-view' : { progress: '04/05', time: 150 },
    'step-recipe-game' : { progress: '05/05', time: 150 }
  },

  run(cfg, ctx){
    const id = ctx.culture.id;
    // food: просто имя («tatarstan» → assets/food-tatarstan.png) или файл/ссылка («chak.png», «https://…»)
    const foodSrc = /[\/.]/.test(cfg.food) ? assetUrl(cfg.food) : 'assets/food-' + cfg.food + '.png';
    const setFood = (img)=>{
      img.classList.remove('hidden');
      img.onerror = ()=> img.classList.add('hidden');   // нет картинки — иконку не показываем
      img.src = foodSrc; img.alt = cfg.title;
    };

    /* --- 1) просмотр рецепта --- */
    ctx.show('step-recipe-view');
    document.getElementById('recipe-view-title').innerText = cfg.title;
    document.getElementById('recipe-view-intro').innerHTML = cfg.intro;
    const viewFood = document.getElementById('recipe-view-food');
    setFood(viewFood);
    renderMascot('recipe-view-mascot', id, 'cook');

    const list = document.getElementById('recipe-view-list');
    list.innerHTML = '';
    cfg.steps.forEach((t, i)=>{
      const row = document.createElement('div');
      row.className = 'recipe-step static';
      row.innerHTML = '<span class="order-badge">' + (i + 1) + '</span><span>' + t + '</span>';
      list.appendChild(row);
    });
    document.getElementById('recipe-view-next').onclick = startGame;

    /* --- 2) игра «Восстанови порядок» --- */
    function startGame(){
      ctx.show('step-recipe-game');
      document.getElementById('recipe-title').innerText = cfg.title;
      document.getElementById('recipe-intro').innerHTML =
        'Теперь расставь шаги по порядку — так, как ты их запомнил.<br><b>Нажимай на шаги по очереди.</b>';
      const gameFood = document.getElementById('recipe-game-food');
      setFood(gameFood);
      renderMascot('recipe-game-mascot', id, 'cook');

      const container = document.getElementById('recipe-steps');
      const nextBtn = document.getElementById('recipe-next');
      nextBtn.classList.add('hidden');
      nextBtn.onclick = ctx.next;
      container.innerHTML = '';

      ctx.tracker.start();
      let nextExpected = 0;
      shuffle(cfg.steps.map((t, i)=>({t, i}))).forEach(item=>{
        const row = document.createElement('button');
        row.className = 'recipe-step';
        row.type = 'button';
        row.innerHTML = '<span class="order-badge">•</span><span>' + item.t + '</span>';
        row.onclick = ()=>{
          if(row.classList.contains('placed')) return;
          if(item.i === nextExpected){
            row.classList.add('placed');
            row.querySelector('.order-badge').innerText = nextExpected + 1;
            nextExpected++;
            ctx.tracker.hits++;
            if(nextExpected === cfg.steps.length){
              ctx.complete();
              nextBtn.classList.remove('hidden');
            }
          } else {
            ctx.tracker.mistakes++;
            row.classList.add('wrong');
            setTimeout(()=> row.classList.remove('wrong'), 400);
          }
        };
        container.appendChild(row);
      });
    }
  }
});
