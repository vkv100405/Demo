/* =================================================================
   Культура развивает — подсчёт результата.

   Результат упражнения (0–100):
     точность  = верные действия / (верные + ошибки + подсказки)   — 85 %
     скорость  = 1 − (потраченное время / лимит времени)           — 15 %

   Каждая ошибка (неверное нажатие, неверный ответ) и каждая
   использованная подсказка снижают точность. Лимит времени — то,
   что показывает таймер на экране задания.

   Результат по навыку (память / внимание / логика) — среднее по
   упражнениям этого навыка. Общий результат — среднее по тем
   навыкам, которые в этой тренировке проверялись.
   Файл не трогает страницу — его можно проверять в Node.
   ================================================================= */

const SKILLS = ['memory', 'attention', 'logic'];
const SCORE_WEIGHT_ACCURACY = 0.85;
const SCORE_WEIGHT_SPEED = 0.15;

function createTracker(timeLimit){
  return {
    hits: 0, mistakes: 0, hints: 0,
    timeLimit: timeLimit || 0,
    startedAt: Date.now(),
    endedAt: null,
    start(){ this.startedAt = Date.now(); this.endedAt = null; },
    stop(){ if(this.endedAt === null) this.endedAt = Date.now(); },
    snapshot(){
      const end = this.endedAt === null ? Date.now() : this.endedAt;
      return {
        hits: this.hits, mistakes: this.mistakes, hints: this.hints,
        timeLimit: this.timeLimit,
        elapsed: Math.max(0, (end - this.startedAt) / 1000)
      };
    }
  };
}

function exerciseScore(s){
  const attempts = s.hits + s.mistakes + s.hints;
  const accuracy = attempts > 0 ? s.hits / attempts : 0;
  const speed = s.timeLimit > 0 ? Math.min(1, Math.max(0, 1 - s.elapsed / s.timeLimit)) : 0;
  return Math.round(100 * (SCORE_WEIGHT_ACCURACY * accuracy + SCORE_WEIGHT_SPEED * speed));
}

/* results: [{ skill, score, seconds }]  →  { memory, attention, logic, overall, seconds } */
function buildResult(results){
  const out = { memory: null, attention: null, logic: null, overall: 0, seconds: 0 };
  SKILLS.forEach(k=>{
    const list = results.filter(r=>r.skill === k);
    if(list.length){
      out[k] = Math.round(list.reduce((a, r)=>a + r.score, 0) / list.length);
    }
  });
  const present = SKILLS.map(k=>out[k]).filter(v=>v !== null);
  out.overall = present.length ? Math.round(present.reduce((a, v)=>a + v, 0) / present.length) : 0;
  out.seconds = Math.round(results.reduce((a, r)=>a + (r.seconds || 0), 0));
  return out;
}

if(typeof module !== 'undefined') module.exports = { createTracker, exerciseScore, buildResult, SKILLS };
