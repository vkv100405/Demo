/* Упражнение «Давай проверим» — один или несколько вопросов подряд.
   Навык: внимание. Подсказка считается как ошибка (раз на вопрос). */
registerExercise('quiz', {
  skill: 'attention',
  timeLimit: 179,
  steps: { 'step-quiz': { progress: '04/05', time: 179, timerIds: ['ex-timer', 'quiz-timer'] } },

  run(cfg, ctx){
    // вопросы, связанные со словами, берём только по тем словам, что показывали
    let pool = cfg.questions.filter(q => !q.requires || (session.words || []).includes(q.requires));
    if(!pool.length) pool = cfg.questions;
    const questions = shuffle(pool).slice(0, cfg.pick || pool.length);

    ctx.show('step-quiz');
    ctx.tracker.start();
    renderMascot('quiz-mascot', ctx.culture.id, 'book');

    const optsEl = document.getElementById('quiz-options');
    const fb = document.getElementById('quiz-feedback');
    const nextBtn = document.getElementById('quiz-next');
    const hintLink = document.getElementById('quiz-hint-link');
    let i = 0;

    function showQuestion(){
      const qd = questions[i];
      const isLast = i === questions.length - 1;
      document.getElementById('quiz-question').innerText = qd.q;
      optsEl.innerHTML = '';
      fb.innerText = ''; fb.className = 'feedback';
      nextBtn.classList.add('hidden');

      let hinted = false;
      hintLink.classList.toggle('hidden', !qd.hint);
      hintLink.onclick = ()=>{
        if(!hinted){ hinted = true; ctx.tracker.hints++; }
        alert(qd.hint);
      };

      shuffle(qd.options).forEach(opt=>{
        const btn = document.createElement('button');
        btn.className = 'qopt';
        btn.innerText = opt;
        btn.onclick = ()=>{
          optsEl.querySelectorAll('.qopt').forEach(b=>b.disabled = true);
          if(opt === qd.answer){
            btn.classList.add('correct');
            fb.innerText = qd.explain;
            fb.className = 'feedback good';
            ctx.tracker.hits++;
          } else {
            btn.classList.add('wrong');
            fb.innerText = 'Неверно. Правильный ответ — «' + qd.answer + '». ' + qd.explain;
            fb.className = 'feedback bad';
            ctx.tracker.mistakes++;
          }
          if(isLast) ctx.complete();
          nextBtn.classList.remove('hidden');
        };
        optsEl.appendChild(btn);
      });
    }

    nextBtn.onclick = ()=>{
      if(i < questions.length - 1){ i++; showQuestion(); }
      else ctx.next();
    };
    showQuestion();
  }
});
