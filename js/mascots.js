/* =============================================================
   Культура развивает — маскоты и декоративные SVG-иконки.

   Если для пары «регион+поза» в assets/ лежит файл
   mascot-<регион>-<поза>.png — используется он.
   Если файла нет — рисуется SVG-заглушка (см. renderMascot ниже).
   Подробности — assets/README-маскоты.txt
   ============================================================= */

function hourglassSVG(){
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

const WORD_ICON_ORDER = ['star','moon','sun','water'];
const WORD_ICONS = {
  star: '<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gStar" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dbe6f5"/><stop offset="1" stop-color="#7c93c4"/></linearGradient></defs><path d="M30 4 L35 25 L56 30 L35 35 L30 56 L25 35 L4 30 L25 25 Z" fill="url(#gStar)"/><path d="M46 40 L48 46 L54 48 L48 50 L46 56 L44 50 L38 48 L44 46 Z" fill="url(#gStar)"/></svg>',
  moon: '<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gMoon" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6f74c9"/><stop offset="1" stop-color="#c9d0ef"/></linearGradient></defs><path d="M40 6 A24 24 0 1 0 40 54 A18 18 0 1 1 40 6 Z" fill="url(#gMoon)"/></svg>',
  sun: '<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="gSun"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#f0a53a"/></radialGradient></defs><path d="M30 2 L34 15 L46 9 L42 22 L55 24 L44 31 L55 38 L42 40 L46 53 L34 47 L30 60 L26 47 L14 53 L18 40 L5 38 L16 31 L5 24 L18 22 L14 9 L26 15 Z" fill="url(#gSun)"/><circle cx="30" cy="31" r="12" fill="url(#gSun)"/></svg>',
  fire: '<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gFire" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e8452c"/><stop offset="1" stop-color="#ffc84a"/></linearGradient></defs><path d="M30 4 C34 16 46 22 46 38 C46 49 39 56 30 56 C21 56 14 49 14 38 C14 30 19 26 22 20 C23 26 26 28 28 28 C27 20 28 12 30 4 Z" fill="url(#gFire)"/></svg>',
  earth: '<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gEarth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9bc16a"/><stop offset="1" stop-color="#5f8a3c"/></linearGradient></defs><path d="M2 50 L20 20 L30 34 L40 14 L58 50 Z" fill="url(#gEarth)"/><rect x="2" y="48" width="56" height="6" rx="3" fill="#8a5a2b"/></svg>',
  water: '<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g stroke="#0d6e7a" stroke-width="4.5" fill="none" stroke-linecap="round"><path d="M6 24 Q15 15 24 24 T42 24 T60 24"/><path d="M6 40 Q15 31 24 40 T42 40 T60 40"/></g></svg>',
};
/* ---------- маскоты ---------- */
let __gradSeq = 0;
function mascotSVG(c1, c2, pose){
  pose = pose || 'plain';
  const gid = 'mg' + (__gradSeq++);
  const legs = '<line x1="40" y1="78" x2="37" y2="107" stroke="#231F20" stroke-width="3.4" stroke-linecap="round"/>' +
               '<line x1="60" y1="78" x2="63" y2="107" stroke="#231F20" stroke-width="3.4" stroke-linecap="round"/>';
  const ring = '<ellipse cx="50" cy="113" rx="35" ry="5" fill="none" stroke="'+c2+'" stroke-opacity="0.4" stroke-width="1.6"/>';
  let eyes = '<circle cx="41" cy="49" r="3.6" fill="#231F20"/><circle cx="59" cy="49" r="3.6" fill="#231F20"/>';
  let extra = '';
  if(pose === 'glasses'){
    eyes = '<circle cx="39" cy="50" r="10" fill="none" stroke="#231F20" stroke-width="2.6"/>' +
           '<circle cx="61" cy="50" r="10" fill="none" stroke="#231F20" stroke-width="2.6"/>' +
           '<line x1="49" y1="50" x2="51" y2="50" stroke="#231F20" stroke-width="2.6"/>' +
           '<circle cx="39" cy="50" r="2.6" fill="#231F20"/><circle cx="61" cy="50" r="2.6" fill="#231F20"/>';
  }
  if(pose === 'cap'){
    extra = '<g transform="translate(50 4)">' +
            '<polygon points="-24,6 0,-6 24,6 0,18" fill="#231F20"/>' +
            '<rect x="-3" y="8" width="6" height="9" fill="#231F20"/>' +
            '<line x1="19" y1="3" x2="27" y2="22" stroke="#231F20" stroke-width="2"/>' +
            '<circle cx="27" cy="24" r="2.8" fill="#231F20"/>' +
            '</g>';
  }
  if(pose === 'flex'){
    extra = '<g stroke="#231F20" stroke-width="3.2" fill="none" stroke-linecap="round">' +
            '<path d="M18 62 C10 50 14 36 26 34"/><path d="M82 62 C90 50 86 36 74 34"/>' +
            '</g>' +
            '<circle cx="24" cy="30" r="7" fill="#231F20"/><circle cx="76" cy="30" r="7" fill="#231F20"/>';
  }
  if(pose === 'cook'){
    extra = '<g transform="translate(66 70)">' +
            '<path d="M0 10 a14 9 0 1 0 28 0 Z" fill="#231F20"/>' +
            '<rect x="10" y="1" width="8" height="6" rx="2" fill="#231F20"/>' +
            '<line x1="-10" y1="4" x2="0" y2="8" stroke="#231F20" stroke-width="3" stroke-linecap="round"/>' +
            '</g>';
  }
  if(pose === 'book'){
    extra = '<g transform="translate(50 72)">' +
            '<path d="M-22 0 L-22 -18 Q0 -24 0 -18 L0 0 Z" fill="#231F20"/>' +
            '<path d="M22 0 L22 -18 Q0 -24 0 -18 L0 0 Z" fill="#231F20"/>' +
            '<path d="M-20 -2 L-20 -16 Q0 -22 0 -16 L0 -2 Z" fill="#fff"/>' +
            '<path d="M20 -2 L20 -16 Q0 -22 0 -16 L0 -2 Z" fill="#fff"/>' +
            '</g>';
  }
  return '<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">' +
    '<defs><linearGradient id="'+gid+'" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="'+c1+'"/><stop offset="1" stop-color="'+c2+'"/></linearGradient></defs>' +
    ring + legs +
    '<path d="M50 12 C74 12 84 38 84 54 C84 80 70 92 50 92 C30 92 16 80 16 54 C16 38 26 12 50 12 Z" fill="url(#'+gid+')"/>' +
    eyes + extra + '</svg>';
}

function groupMascotSVG(){
  const seq = __gradSeq++;
  const set = [
    ['#F2685C','#C0392B'],
    ['#4DA3CA','#1F235A'],
    ['#F5B8CD','#E62B6F'],
    ['#C04F8A','#7A2E5C']
  ];
  let out = '<svg viewBox="0 0 260 130" xmlns="http://www.w3.org/2000/svg"><defs>';
  set.forEach((c,i)=>{
    out += '<linearGradient id="gg'+seq+'-'+i+'" x1="0" y1="0" x2="0" y2="1">' +
           '<stop offset="0" stop-color="'+c[0]+'"/><stop offset="1" stop-color="'+c[1]+'"/></linearGradient>';
  });
  out += '</defs>';
  const xs = [18, 82, 148, 210];
  set.forEach((c,i)=>{
    const x = xs[i];
    out += '<line x1="'+(x+12)+'" y1="96" x2="'+(x+9)+'" y2="120" stroke="#231F20" stroke-width="3" stroke-linecap="round"/>' +
           '<line x1="'+(x+26)+'" y1="96" x2="'+(x+29)+'" y2="120" stroke="#231F20" stroke-width="3" stroke-linecap="round"/>' +
           '<ellipse cx="'+(x+19)+'" cy="62" rx="19" ry="36" fill="url(#gg'+seq+'-'+i+')"/>' +
           '<circle cx="'+(x+13)+'" cy="52" r="2.6" fill="#231F20"/><circle cx="'+(x+25)+'" cy="52" r="2.6" fill="#231F20"/>';
  });
  out += '<rect x="112" y="98" width="40" height="20" rx="5" fill="#E08A2E"/>' +
         '<rect x="126" y="92" width="12" height="7" rx="2" fill="#231F20"/>' +
         '</svg>';
  return out;
}

function quizMascotSVG(c1, c2){
  const gid = 'mg' + (__gradSeq++);
  return '<svg viewBox="0 0 140 84" xmlns="http://www.w3.org/2000/svg">' +
    '<defs><linearGradient id="'+gid+'" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="'+c1+'"/><stop offset="1" stop-color="'+c2+'"/></linearGradient></defs>' +
    '<ellipse cx="70" cy="78" rx="62" ry="5" fill="none" stroke="'+c2+'" stroke-opacity="0.35" stroke-width="1.5"/>' +
    '<rect x="6" y="56" width="26" height="7" rx="2" fill="#231F20"/>' +
    '<rect x="108" y="56" width="26" height="7" rx="2" fill="#231F20"/>' +
    '<path d="M42 50 C54 45 64 50 70 55 C76 50 86 45 98 50 L98 62 C86 57 76 62 70 67 C64 62 54 57 42 62 Z" fill="#fff" stroke="#231F20" stroke-width="1.6"/>' +
    '<ellipse cx="70" cy="30" rx="21" ry="17" fill="url(#'+gid+')"/>' +
    '<circle cx="63" cy="28" r="2.8" fill="#231F20"/><circle cx="77" cy="28" r="2.8" fill="#231F20"/>' +
    '</svg>';
}

/* Цвета маскота региона берутся из data.js (mascotColors). */
const NEUTRAL_MASCOT_COLORS = ['#ECC9E0', '#F8A48A'];
function getMascotColors(id){
  if(CULTURES[id] && CULTURES[id].mascotColors) return CULTURES[id].mascotColors;
  return NEUTRAL_MASCOT_COLORS;
}

function renderMascot(containerId, region, pose){
  const el = document.getElementById(containerId);
  if(!el) return;
  const colors = getMascotColors(region);
  const svgFallback = (containerId === 'quiz-mascot')
    ? quizMascotSVG(colors[0], colors[1])
    : (pose === 'group' ? groupMascotSVG() : mascotSVG(colors[0], colors[1], pose));

  // картинка позы: из data.js (mascots в регионе / NEUTRAL_MASCOTS) или по имени assets/mascot-<регион>-<поза>.png
  const custom = region === 'neutral' ? NEUTRAL_MASCOTS[pose] : (CULTURES[region] && CULTURES[region].mascots && CULTURES[region].mascots[pose]);
  const src = custom ? assetUrl(custom) : 'assets/mascot-' + region + '-' + pose + '.png';
  const probe = new Image();
  probe.onload = ()=>{
    el.innerHTML = '<img class="asset-img" src="' + src + '" alt="">';
  };
  probe.onerror = ()=>{ el.innerHTML = svgFallback; };
  probe.src = src;
}

