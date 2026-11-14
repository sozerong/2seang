// CCTV 화면을 캔버스로 직접 그린다. 320x180 저해상도로 그리고 화면에서는 픽셀 그대로 확대.
const CCTV = (() => {
  const W = 320, H = 180;
  const cache = {};

  // ---- 도구 ----
  let rnd = Math.random;
  const seed = s => { let a = [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 7);
    rnd = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  const gy = (v, a = 1) => `rgba(${v},${v},${v},${a})`;
  const rect = (c, x, y, w, h, f) => { c.fillStyle = f; c.fillRect(x, y, w, h); };
  const poly = (c, f, ...p) => { c.fillStyle = f; c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.closePath(); c.fill(); };
  const line = (c, s, w, ...p) => { c.strokeStyle = s; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.stroke(); };
  const ell = (c, x, y, rx, ry, f) => { c.fillStyle = f; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); };
  const glow = (c, x, y, r, a, col = '255,255,255') => { const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); };
  const text = (c, s, x, y, size, f, bold, align = 'center') => { c.font = `${bold ? 'bold ' : ''}${size}px ${bold ? 'Galmuri11B' : 'Galmuri11'}`;
    c.fillStyle = f; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(s, x, y); };
  const canvas = () => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; return [cv, cv.getContext('2d')]; };

  function vignette(c, k = .8) { const g = c.createRadialGradient(W / 2, H / 2, H * .25, W / 2, H / 2, W * .62);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${k})`); c.fillStyle = g; c.fillRect(0, 0, W, H); }

  // 흑백 + 약간 녹색끼 + 입자
  function finish(c, grain = 18, tint = true) {
    const d = c.getImageData(0, 0, W, H), p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      const n = (rnd() - .5) * grain;
      const l = p[i] * .3 + p[i + 1] * .59 + p[i + 2] * .11 + n;
      if (tint) { p[i] = l * .9; p[i + 1] = l; p[i + 2] = l * .88; } else { p[i] += n; p[i + 1] += n; p[i + 2] += n; }
    }
    c.putImageData(d, 0, 0);
  }

  // ---- 사람 ----
  // o: {x, y(발), h(키 px), body, legs, hair:'short'|'long'|'cap', face:'front'|'back'|'left'|'right',
  //     pose:'stand'|'walk'|'sit', env, card, case, badge, band, torch, push}
  function person(c, o) {
    const s = o.h / 60, body = gy(o.body ?? 140), legs = gy(o.legs ?? 45), skin = gy(170), hair = gy(25);
    c.save(); c.translate(o.x, o.y); c.scale(s, s);
    const sit = o.pose === 'sit', dy = sit ? 14 : 0;
    if (!sit) {
      if (o.pose === 'walk') { line(c, legs, 4.5, -2, -28, -7, -1); line(c, legs, 4.5, 2, -28, 6, -1); }
      else { rect(c, -5, -28, 4, 28, legs); rect(c, 1, -28, 4, 28, legs); }
      rect(c, -6, -2, 5, 2, gy(15)); rect(c, 1, -2, 5, 2, gy(15));
    }
    // 머리카락(뒤)
    if (o.hair === 'long' && o.face !== 'back') rect(c, -6.5, -58 + dy, 13, 15, hair);
    // 몸통
    poly(c, body, -8, -48 + dy, 8, -48 + dy, 6.5, -27 + dy, -6.5, -27 + dy);
    if (o.suit && o.face !== 'back') { poly(c, gy(200), -2.5, -48 + dy, 2.5, -48 + dy, 0, -38 + dy); line(c, gy(20), 1.4, 0, -46 + dy, 0, -37 + dy); }
    // 팔
    const arm = (sx, ex, ey) => line(c, body, 3.4, sx, -46 + dy, ex, ey + dy);
    if (o.env) { arm(-7, -2, -38); arm(7, 2, -38); }
    else if (o.card) { arm(-7, -8, -28); arm(7, 15, -40); rect(c, 14, -44 + dy, 5, 4, gy(235)); }
    else if (o.torch) { arm(-7, -8, -28); arm(7, 16, -38); rect(c, 15, -40 + dy, 6, 3, gy(60)); }
    else if (o.push) { arm(-7, -12, -34); arm(7, 12, -34); }
    else if (o.reach) { arm(-7, -8, -28); arm(7, 4, -26); line(c, body, 3.4, 4, -26 + dy, 20, -20 + dy); }
    else { arm(-7, -8, -28); arm(7, 8, -28); }
    if (o.band) rect(c, 5.5, -44 + dy, 3.5, 3, gy(240));
    if (o.badge && o.face !== 'back') { line(c, gy(30), .8, -3, -48 + dy, 0, -40 + dy, 3, -48 + dy); rect(c, -2, -40 + dy, 4, 5, gy(240)); }
    if (o.env) rect(c, -7, -45 + dy, 14, 10, gy(225));
    if (o.case) { rect(c, 6, -29 + dy, 10, 8, gy(30)); line(c, gy(30), 1, 9, -29 + dy, 9, -31 + dy, 13, -31 + dy, 13, -29 + dy); }
    // 머리
    ell(c, 0, -53 + dy, 5.5, 6.5, o.face === 'back' ? hair : skin);
    if (o.face !== 'back') {
      if (o.hair === 'cap') { poly(c, gy(30), -6, -55 + dy, 6, -55 + dy, 5, -60 + dy, -5, -60 + dy); rect(c, -7, -55.5 + dy, 14, 1.6, gy(20)); }
      else { c.save(); c.beginPath(); c.ellipse(0, -53 + dy, 5.6, 6.6, 0, 0, Math.PI * 2); c.clip(); rect(c, -7, -61 + dy, 14, o.hair === 'long' ? 6 : 4.5, hair); c.restore(); }
      if (o.face === 'left') rect(c, 1, -58 + dy, 5, 9, hair);
      if (o.face === 'right') rect(c, -6, -58 + dy, 5, 9, hair);
    }
    c.restore();
    if (o.torch) { // 손전등 빛
      const g = c.createLinearGradient(o.x + 20 * s, 0, o.x + 70 * s, 0); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      poly(c, g, o.x + 20 * s, o.y - 40 * s, o.x + 75 * s, o.y - 58 * s, o.x + 75 * s, o.y - 5 * s);
    }
  }

  // ---- 카메라 배경 ----
  // CAM 01: 3층 복도, 오른쪽 벽에 보관실 문
  const rw = t => ({ x: 320 - 135 * t, top: 40 * t, bot: 180 - 95 * t }); // 오른쪽 벽 깊이 t 위치
  function cam01(c, on) {
    const L = on ? 1 : .55;
    poly(c, gy(22 * L), 0, 0, 320, 0, 185, 40, 120, 40);              // 천장
    poly(c, gy(62 * L), 0, 0, 120, 40, 120, 85, 0, 180);              // 왼쪽 벽
    poly(c, gy(70 * L), 320, 0, 185, 40, 185, 85, 320, 180);          // 오른쪽 벽
    poly(c, gy(84 * L), 0, 180, 320, 180, 185, 85, 120, 85);          // 바닥
    rect(c, 120, 40, 65, 45, gy(on ? 50 : 14));                        // 끝 벽
    rect(c, 140, 52, 22, 33, gy(on ? 70 : 24));                        // 끝 비상문
    rect(c, 143, 47, 16, 4, gy(on ? 200 : 150));                       // 비상구 표시등
    for (let i = 1; i < 9; i++) { const t = 1 - Math.pow(.72, i), y = 180 - 95 * t;
      line(c, gy(55 * L), .6, 160 - 160 * (1 - t), y, 160 + 160 * (1 - t), y); }
    [-1.2, -.4, .4, 1.2].forEach(k => line(c, gy(58 * L), .6, 160 + k * 140, 180, 152 + k * 25, 85));
    // 걸레받이
    line(c, gy(40 * L), 2, 0, 176, 120, 84); line(c, gy(40 * L), 2, 320, 176, 185, 84);
    // 보관실 문 (오른쪽 벽 t=.42~.58)
    const a = rw(.42), b = rw(.58), dh = .72;
    const ay = a.bot - (a.bot - a.top) * dh, by = b.bot - (b.bot - b.top) * dh;
    poly(c, gy(95 * L), a.x + 2, ay - 2, b.x - 2, by - 2, b.x - 2, b.bot, a.x + 2, a.bot);
    poly(c, gy(38 * L), a.x, ay, b.x, by, b.x, b.bot, a.x, a.bot);
    rect(c, b.x + 6, by + 8, 2, 4, gy(150 * L));                         // 손잡이
    const r = rw(.36); rect(c, r.x - 6, r.bot - 52, 5, 8, gy(30)); rect(c, r.x - 5, r.bot - 51, 3, 2, gy(230)); // 카드 단말기
    poly(c, gy(180 * L), a.x - 1, ay - 12, b.x + 1, by - 10, b.x + 1, by - 5, a.x - 1, ay - 6); // 문패
    // 천장 형광등
    [[.25, on ? .5 : .0], [.55, on ? .5 : .32], [.8, on ? .45 : 0]].forEach(([t, a2]) => {
      const y = 40 * t * 1.0 + 4, w = 40 * (1 - t) + 10;
      rect(c, 160 - w / 2, y, w, 3 * (1 - t) + 1.5, gy(a2 ? 245 : 60));
      if (a2) glow(c, 160, 180 - 95 * t + 10, 90 * (1 - t) + 30, a2 * .5);
    });
  }

  // CAM 02: 1층 로비
  function cam02(c, on) {
    const L = on ? 1 : .6;
    rect(c, 0, 0, 320, 30, gy(18 * L));
    rect(c, 0, 30, 320, 66, gy(48 * L));
    for (let i = 0; i < 6; i++) { rect(c, 130 + i * 30, 38, 26, 58, gy(on ? 95 : 10)); line(c, gy(70 * L), 1, 143 + i * 30, 40, 143 + i * 30, 96); } // 유리문
    rect(c, 20, 40, 70, 14, gy(on ? 120 : 45)); text(c, '한빛시청', 55, 47, 12, gy(on ? 30 : 15), true);
    rect(c, 0, 96, 320, 84, gy(70 * L));
    for (let i = 0; i < 5; i++) line(c, gy(60 * L), .6, 0, 100 + i * i * 4, 320, 100 + i * i * 4);
    // 계단 (오른쪽)
    for (let i = 0; i < 7; i++) poly(c, gy((60 + i * 4) * L), 262 + i * 9, 180 - i * 12, 320, 180 - i * 12, 320, 172 - i * 12, 262 + i * 9, 172 - i * 12);
    // 출입 게이트
    for (let i = 0; i < 4; i++) { const x = 160 + i * 26; rect(c, x, 112, 6, 26, gy(110 * L)); rect(c, x + 6, 118, 9, 2, gy(170 * L)); }
    // 안내데스크
    poly(c, gy(110 * L), 30, 108, 120, 108, 126, 114, 36, 114);
    rect(c, 36, 114, 90, 30, gy(52 * L));
    rect(c, 36, 114, 90, 3, gy(80 * L));
    // 조명 (야간엔 절반)
    [40, 100, 160, 220, 280].forEach((x, i) => { const lit = on || i % 2 === 0;
      rect(c, x - 12, 6, 24, 2, gy(lit ? 240 : 55)); if (lit) glow(c, x, 120, 70, on ? .32 : .22); });
  }

  // CAM 03: 2층 소회의실
  function cam03(c, on) {
    const L = on ? 1 : .55;
    rect(c, 0, 0, 320, 70, gy(52 * L));
    rect(c, 30, 14, 110, 44, gy(on ? 40 : 8));                             // 창 (밖은 어둠)
    for (let y = 16; y < 58; y += 4) line(c, gy(50 * L), 1, 30, y, 140, y);   // 블라인드
    rect(c, 200, 18, 70, 36, gy(120 * L)); rect(c, 203, 21, 64, 30, gy(150 * L)); // 화이트보드
    poly(c, gy(66 * L), 0, 70, 320, 70, 320, 180, 0, 180);
    // 의자
    const chair = (x, y, sh = 30) => { rect(c, x, y, 18, 14, gy(sh * L)); rect(c, x + 2, y - 10, 14, 10, gy((sh - 8) * L)); };
    chair(105, 76); chair(150, 74); chair(195, 72);
    // 테이블
    poly(c, gy(40 * L), 80, 98, 250, 88, 252, 96, 82, 106);
    poly(c, gy(125 * L), 70, 96, 240, 86, 282, 132, 104, 150);
    poly(c, gy(55 * L), 104, 150, 282, 132, 282, 138, 104, 157);
    chair(120, 158, 26); chair(200, 150, 26);
    rect(c, 145, 2, 30, 3, gy(on ? 240 : 60));
  }

  // CAM 04: 2층 재난안전과 사무실
  function cam04(c, on, time) {
    const L = on ? 1 : .45;
    rect(c, 0, 0, 320, 64, gy(55 * L));
    for (let i = 0; i < 4; i++) rect(c, 10 + i * 58, 12, 44, 30, gy(on ? 60 : 8)); // 창
    // 벽시계
    const cx = 270, cy = 26; ell(c, cx, cy, 13, 13, gy(on ? 200 : 120)); ell(c, cx, cy, 11, 11, gy(on ? 235 : 150));
    const [hh, mm] = time.split(':').map(Number), ha = ((hh % 12) + mm / 60) / 12 * Math.PI * 2, ma = mm / 60 * Math.PI * 2;
    line(c, gy(20), 2, cx, cy, cx + Math.sin(ha) * 6, cy - Math.cos(ha) * 6);
    line(c, gy(20), 1.2, cx, cy, cx + Math.sin(ma) * 9, cy - Math.cos(ma) * 9);
    rect(c, 0, 64, 320, 116, gy(64 * L));
    // 책상 줄
    const desk = (x, y, w, lit) => {
      poly(c, gy(110 * L), x, y, x + w, y, x + w + 6, y + 8, x + 6, y + 8); rect(c, x + 6, y + 8, w, 12, gy(45 * L));
      for (let i = 0; i < w / 28 - .5; i++) { rect(c, x + 8 + i * 28, y - 13, 16, 11, gy(28)); rect(c, x + 14 + i * 28, y - 2, 4, 2, gy(28));
        rect(c, x + 9 + i * 28, y - 12, 14, 9, gy(on ? 50 : 12)); }
      if (lit) { rect(c, x + w - 20, y - 12, 14, 9, gy(250)); glow(c, x + w - 13, y - 8, 46, .55); }
    };
    desk(40, 80, 180, time === '22:31'); desk(20, 112, 220); desk(0, 148, 260);
    if (on) [60, 160, 260].forEach(x => { rect(c, x - 14, 2, 28, 2, gy(240)); glow(c, x, 90, 80, .25); });
  }

  const SCENES = {
    '01': (c, t) => {
      const on = t === '18:20'; cam01(c, on);
      if (t === '18:20') { // 카트 미는 여성
        rect(c, 188, 128, 26, 4, gy(60)); rect(c, 190, 108, 22, 20, gy(150)); rect(c, 192, 92, 18, 16, gy(165)); rect(c, 189, 112, 24, 2, gy(120));
        ell(c, 192, 140, 2.5, 2.5, gy(20)); ell(c, 210, 140, 2.5, 2.5, gy(20));
        person(c, { x: 222, y: 142, h: 74, body: 175, hair: 'long', face: 'front', push: true, badge: true });
      }
      if (t === '21:50') person(c, { x: 238, y: 136, h: 70, body: 150, hair: 'short', face: 'right', card: true, badge: true });
      if (t === '22:05') person(c, { x: 222, y: 141, h: 75, body: 150, hair: 'short', face: 'left', env: true, pose: 'walk', badge: true });
    },
    '02': (c, t) => {
      const on = t === '18:20'; cam02(c, on);
      person(c, { x: 80, y: 122, h: 50, body: 70, hair: 'cap', face: 'front', pose: 'sit' });   // 경비원
      if (t === '18:20') [[175, 0], [205, 4], [238, 2]].forEach(([x, d], i) =>
        person(c, { x, y: 134 + d, h: 56, body: [150, 120, 170][i], hair: i === 2 ? 'long' : 'short', face: 'back', pose: 'walk' }));
      if (t === '21:58') person(c, { x: 142, y: 160, h: 64, body: 38, legs: 30, hair: 'short', face: 'left', suit: true, case: true, badge: true });
      if (t === '23:05') person(c, { x: 262, y: 168, h: 62, body: 115, hair: 'short', face: 'right', torch: true, band: true, pose: 'walk' });
    },
    '03': (c, t) => {
      cam03(c, t === '18:20');
      if (t === '22:14') {
        glow(c, 170, 110, 110, .38);
        person(c, { x: 158, y: 104, h: 58, body: 150, hair: 'short', face: 'front', pose: 'sit', reach: true, badge: true });
        rect(c, 176, 104, 18, 12, gy(225));                                                   // 테이블 위 봉투
        person(c, { x: 214, y: 168, h: 62, body: 38, hair: 'short', face: 'back', pose: 'sit' }); // 방문자 (뒷모습)
        rect(c, 232, 140, 22, 12, gy(30)); rect(c, 234, 137, 18, 3, gy(45));                  // 열린 서류가방
      }
    },
    '04': (c, t) => {
      cam04(c, t === '18:20', t);
      if (t === '18:20') { person(c, { x: 95, y: 108, h: 46, body: 160, hair: 'long', face: 'front', pose: 'sit' });
        person(c, { x: 180, y: 140, h: 62, body: 120, hair: 'short', face: 'left' }); }
      if (t === '22:31') { person(c, { x: 194, y: 104, h: 58, body: 150, hair: 'short', face: 'right', pose: 'sit' });
        glow(c, 205, 70, 30, .35); }
    },
  };

  // ---- 확대 화면 ----
  const ZOOMS = {
    '01-18:20': c => { rect(c, 0, 0, W, H, gy(40)); poly(c, gy(150), 30, 30, 290, 20, 300, 170, 20, 175);
      line(c, gy(110), 3, 30, 90, 295, 85); rect(c, 95, 50, 130, 70, gy(235));
      text(c, '보존문서', 160, 72, 24, gy(25), true); text(c, '2024', 160, 100, 24, gy(25), true); text(c, 'B-02', 205, 114, 12, gy(90)); },
    '01-21:50': c => { rect(c, 0, 0, W, H, gy(70)); rect(c, 230, 30, 50, 80, gy(30)); rect(c, 240, 45, 30, 20, gy(60)); ell(c, 255, 90, 4, 4, gy(220));
      poly(c, gy(170), 40, 180, 80, 120, 130, 110, 140, 140, 90, 180); rect(c, 100, 70, 120, 76, gy(240));
      rect(c, 108, 80, 30, 38, gy(120)); text(c, '재난안전과', 182, 92, 12, gy(30)); text(c, '박도현', 182, 112, 24, gy(20), true); rect(c, 108, 128, 104, 10, gy(60)); },
    '02-21:58': c => { rect(c, 0, 0, W, H, gy(30)); poly(c, gy(205), 130, 0, 190, 0, 160, 70); line(c, gy(15), 8, 160, 5, 160, 75);
      line(c, gy(200), 2, 120, 0, 140, 80); line(c, gy(200), 2, 200, 0, 180, 80); rect(c, 110, 78, 100, 90, gy(240));
      text(c, 'VISITOR', 160, 98, 12, gy(60)); text(c, 'V-0731', 160, 128, 24, gy(15), true); rect(c, 120, 150, 80, 6, gy(120)); },
    '01-22:05': c => { rect(c, 0, 0, W, H, gy(50)); poly(c, gy(215), 40, 20, 280, 26, 276, 164, 44, 160);
      poly(c, gy(190), 40, 20, 280, 26, 160, 62); text(c, 'EV-2417', 150, 104, 24, gy(25), true);
      c.save(); c.translate(220, 135); c.rotate(-.12); c.strokeStyle = gy(40); c.lineWidth = 3; c.strokeRect(-36, -14, 72, 28); text(c, '대외비', 0, 0, 24, gy(40), true); c.restore(); },
    '03-22:14': c => { rect(c, 0, 0, W, H, gy(120)); poly(c, gy(220), 20, 70, 150, 60, 160, 150, 30, 160);
      text(c, 'EV-2417', 90, 108, 12, gy(40), true); poly(c, gy(170), 0, 130, 40, 120, 60, 140, 20, 170);
      rect(c, 180, 0, 140, 180, gy(32)); line(c, gy(200), 2, 230, 0, 240, 60); line(c, gy(200), 2, 290, 0, 280, 60);
      rect(c, 215, 58, 90, 64, gy(240)); text(c, 'VISITOR', 260, 74, 12, gy(60)); text(c, 'V-0731', 260, 100, 24, gy(15), true); },
    '04-22:31': c => { rect(c, 0, 0, W, H, gy(10)); rect(c, 30, 14, 260, 150, gy(40)); rect(c, 40, 22, 240, 132, gy(225));
      rect(c, 40, 22, 240, 16, gy(90)); text(c, '평가관리시스템', 46, 30, 12, gy(245), false, 'left');
      text(c, 'EV-2417  주혁볼트', 50, 54, 12, gy(40), false, 'left'); text(c, '부적합 → 적합', 50, 70, 12, gy(40), false, 'left');
      rect(c, 80, 88, 160, 50, gy(250)); c.strokeStyle = gy(40); c.lineWidth = 2; c.strokeRect(80, 88, 160, 50);
      text(c, '수정 저장 완료', 160, 106, 12, gy(20), true); text(c, '22:31:07', 160, 124, 12, gy(90)); },
    '02-23:05': c => { rect(c, 0, 0, W, H, gy(25)); poly(c, gy(110), 40, 0, 200, 0, 230, 180, 60, 180);
      poly(c, gy(240), 52, 60, 208, 52, 214, 104, 58, 112); text(c, '당직', 133, 82, 24, gy(25), true);
      rect(c, 230, 120, 60, 22, gy(60)); glow(c, 300, 131, 40, .7); },
  };

  function make(key, draw, tint = true) {
    if (cache[key]) return cache[key];
    seed(key); const [cv, c] = canvas(); c.imageSmoothingEnabled = false;
    draw(c); if (tint) { vignette(c, key.startsWith('Z') ? .55 : .8); finish(c); }
    return cache[key] = cv.toDataURL();
  }

  // 대피소 (엔딩용, 컬러)
  function shelter(lit) {
    return make('S' + lit, c => {
      const k = lit ? 1 : .12, col = (r, g, b, a = 1) => `rgba(${r * k | 0},${g * k | 0},${b * k | 0},${a})`;
      rect(c, 0, 0, W, 90, lit ? col(90, 80, 70) : 'rgb(8,10,16)');
      for (let i = 0; i < 5; i++) { rect(c, 20 + i * 62, 20, 36, 40, 'rgb(10,14,24)');
        for (let j = 0; j < 9; j++) line(c, 'rgba(140,160,200,.35)', .7, 24 + i * 62 + j * 4, 22, 22 + i * 62 + j * 4, 58); }
      rect(c, 0, 90, W, 90, lit ? col(150, 110, 70) : 'rgb(10,10,14)');
      for (let i = 0; i < 8; i++) line(c, lit ? col(120, 85, 55) : 'rgb(14,14,18)', 1, 0, 95 + i * 11, W, 95 + i * 11);
      for (let i = 0; i < 9; i++) { const x = 20 + i * 35, y = 120 + (i % 3) * 18;
        rect(c, x - 14, y + 4, 30, 10, lit ? col(70, 90, 130) : 'rgb(14,16,22)');
        ell(c, x, y - 6, 4, 5, lit ? col(60, 45, 35) : 'rgb(4,4,6)'); poly(c, lit ? col(80, 70, 90) : 'rgb(5,5,8)', x - 7, y + 6, x + 7, y + 6, x + 5, y - 2, x - 5, y - 2); }
      if (lit) [50, 160, 270].forEach(x => { rect(c, x - 14, 4, 28, 3, 'rgb(255,240,200)'); glow(c, x, 60, 120, .35, '255,220,160'); });
      seed('S'); const d = c.getImageData(0, 0, W, H), p = d.data;
      for (let i = 0; i < p.length; i += 4) { const n = (rnd() - .5) * 14; p[i] += n; p[i + 1] += n; p[i + 2] += n; }
      c.putImageData(d, 0, 0);
    }, false);
  }

  return {
    scene: (cam, time) => make(`${cam}-${time}`, c => SCENES[cam](c, time)),
    zoom: key => ZOOMS[key] ? make('Z' + key, ZOOMS[key]) : null,
    hasZoom: key => !!ZOOMS[key],
    shelter,
  };
})();
