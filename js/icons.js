/* =================================================================
   Культура развивает — единый набор иконок (в стиле Lucide:
   линия 2 px, скруглённые концы, viewBox 24×24).
   Использование: icon('brain') или icon('brain', 32) → строка SVG.
   Чтобы заменить на Lucide/свой набор — поправьте объект ICONS
   (значение — внутренняя часть <svg>).
   ================================================================= */
const ICONS = {
  brain:   '<path d="M9.5 3A3.5 3.5 0 0 0 6 6.5c-1.7.3-3 1.8-3 3.5 0 1 .5 1.9 1.2 2.5-.4.6-.7 1.3-.7 2A3.5 3.5 0 0 0 7 18c.4 1.7 1.9 3 3.7 3H12V3z"/><path d="M14.5 3A3.5 3.5 0 0 1 18 6.5c1.7.3 3 1.8 3 3.5 0 1-.5 1.9-1.2 2.5.4.6.7 1.3.7 2A3.5 3.5 0 0 1 17 18c-.4 1.7-1.9 3-3.7 3H12V3z"/>',
  target:  '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  zap:     '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  puzzle:  '<path d="M10 4a2 2 0 1 1 4 0v2h4v4h-2a2 2 0 1 0 0 4h2v6H4v-6h2a2 2 0 1 0 0-4H4V6h6V4z"/>',
  sparkles:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z"/>',
  leaf:    '<path d="M11 20A7 7 0 0 1 4 13c0-6 6-9 16-9 0 10-3 16-9 16z"/><path d="M4 21c2-4 5-7 10-9"/>',
  eye:     '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  shapes:  '<circle cx="7" cy="7" r="4"/><rect x="13" y="3" width="8" height="8" rx="1"/><path d="M12 14l5 8H7z"/>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  lightbulb:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.44 1 1.16 1 1.94V16h5v-.16c0-.78.4-1.5 1-1.94A6 6 0 0 0 12 3z"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M16 8l-2 6-6 2 2-6z"/>',
  shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.3-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.3A3.7 3.7 0 0 0 21 10.7C21 6.4 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10.5" cy="7" r="1"/><circle cx="15.5" cy="7.5" r="1"/>',
  book:    '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M20 17v4H6.5A2.5 2.5 0 0 1 4 18.5"/>',
  flame:   '<path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z"/>',
  home:    '<path d="M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6"/>',
  dumbbell:'<path d="M6 6v12M18 6v12M3 9v6M21 9v6M6 12h12"/>',
  chart:   '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  user:    '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  check:   '<path d="M5 12l5 5L20 7"/>',
  x:       '<path d="M6 6l12 12M18 6 6 18"/>',
  arrowLeft:'<path d="M19 12H5M12 5l-7 7 7 7"/>',
  globe:   '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  clock:   '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  star:    '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
};

function icon(name, size){
  const s = size || 24;
  return '<svg class="icon" aria-hidden="true" focusable="false" width="' + s + '" height="' + s +
    '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    (ICONS[name] || '') + '</svg>';
}
