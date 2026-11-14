// CCTV 화면을 캔버스로 직접 그린다. 320x180 저해상도로 그리고 화면에서는 픽셀 그대로 확대.
const CCTV = (() => {
  const W = 320, H = 180, SS = 2; // 논리 좌표 320x180, 실제 캔버스는 2배로 그려 디테일을 살림
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
  const canvas = () => { const cv = document.createElement('canvas'); cv.width = W * SS; cv.height = H * SS; const c = cv.getContext('2d'); c.scale(SS, SS); return [cv, c]; };

  function vignette(c, k = .8) { const g = c.createRadialGradient(W / 2, H / 2, H * .25, W / 2, H / 2, W * .62);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${k})`); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  const pixels = c => c.getImageData(0, 0, c.canvas.width, c.canvas.height);

  // 흑백 + 약간 녹색끼 + 입자
  function finish(c, grain = 18, tint = true) {
    const d = pixels(c), p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      const n = (rnd() - .5) * grain;
      const l = p[i] * .3 + p[i + 1] * .59 + p[i + 2] * .11 + n;
      if (tint) { p[i] = l * .9; p[i + 1] = l; p[i + 2] = l * .88; } else { p[i] += n; p[i + 1] += n; p[i + 2] += n; }
    }
    c.putImageData(d, 0, 0);
  }

  // ---- 사람 (둥글고 부드러운 2.5D 마스코트풍) ----
  // 키 60 단위 기준: 머리 지름 26(큰 머리), 몸통 26, 다리 8
  // o: {x, y(발), h(px), body, legs, hair:'short'|'slick'|'bob'|'buzz'|'cap', glasses, suit,
  //     face:'front'|'back'|'left'|'right', pose:'stand'|'walk'|'sit', env, card, case, badge, band, torch, push, reach}
  const rr = (c, x, y, w, h, r, f) => { c.fillStyle = f; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); };
  const ball = (c, x, y, r, v) => { const g = c.createRadialGradient(x - r * .35, y - r * .45, r * .1, x, y, r * 1.05);
    g.addColorStop(0, gy(Math.min(255, v + 50))); g.addColorStop(.65, gy(v)); g.addColorStop(1, gy(v * .55)); return g; };
  const side = (v, x0, x1) => { const g = c0.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, gy(Math.min(255, v + 35))); g.addColorStop(.55, gy(v)); g.addColorStop(1, gy(v * .6)); return g; };
  let c0;

  function head(c, x, y, o) { // 반지름 13
    const HAIR = o.hair === 'cap' ? 55 : o.hair === 'slick' ? 22 : 38, back = o.face === 'back';
    const fx = o.face === 'left' ? -4 : o.face === 'right' ? 4 : 0;
    if (o.hair === 'bob') { rr(c, x - 14, y - 10, 28, 20, 9, ball(c, x, y, 15, HAIR)); }        // 단발 뒷머리
    ell(c, x, y, 13, 13, back ? ball(c, x, y, 13, HAIR) : ball(c, x, y, 13, 205));
    c.strokeStyle = gy(15, .45); c.lineWidth = 1; c.beginPath(); c.arc(x, y, 13, 0, Math.PI * 2); c.stroke();
    if (back) { if (o.hair === 'cap') { ell(c, x, y - 6, 13, 8, ball(c, x, y - 6, 13, 60)); } return; }
    // 머리카락 (머리 원 안쪽으로 잘라서)
    c.save(); c.beginPath(); c.arc(x, y, 13.2, 0, Math.PI * 2); c.clip();
    const top = (cy, ry, v) => ell(c, x - fx * .6, cy, 15, ry, ball(c, x, cy, 15, v));
    if (o.hair === 'short') { top(y - 9, 8, HAIR); ell(c, x - 5 - fx, y - 4, 7, 3.5, gy(HAIR)); }     // 옆가르마 앞머리
    if (o.hair === 'slick') { top(y - 9, 7, HAIR); line(c, gy(70), 1, x - 7, y - 9, x + 5, y - 12); }    // 넘긴 머리 + 광
    if (o.hair === 'bob') { top(y - 8, 8, HAIR); rr(c, x - 13, y - 6, 26, 4, 2, gy(HAIR)); }           // 일자 앞머리
    if (o.hair === 'buzz') top(y - 10, 6, 60);
    if (fx) ell(c, x - fx * 2.6, y - 5, 5.5, 9, ball(c, x - fx * 2.6, y - 5, 9, HAIR));           // 옆모습 뒷머리
    c.restore();
    if (o.hair === 'cap') { ell(c, x, y - 7, 13.5, 8, ball(c, x, y - 8, 14, 60)); rr(c, x - 15 + fx * 1.5, y - 3, 30, 3, 1.5, gy(30)); rect(c, x - 3, y - 11, 6, 4, gy(200)); }
    // 얼굴
    const eyes = o.face === 'front' ? [x - 4.5, x + 4.5] : [x + fx * 1.8];
    eyes.forEach(ex => { ell(c, ex, y + 4.5, 2.4, 1.3, gy(165, .55)); ell(c, ex, y + 1.5, 1.8, 2.5, gy(15)); ell(c, ex + .6, y + .6, .6, .6, gy(250)); });
    if (o.glasses) { c.strokeStyle = gy(20); c.lineWidth = 1; eyes.forEach(ex => { c.beginPath(); c.arc(ex, y + 2, 3.2, 0, Math.PI * 2); c.stroke(); });
      if (eyes.length > 1) line(c, gy(20), 1, x - 1.3, y + 2, x + 1.3, y + 2); }
    ell(c, x + fx * 1.6, y + 7.2, 1.4, .8, gy(120));                                                    // 입
  }

  function person(c, o) {
    c0 = c; const s = o.h / 60, B = o.body ?? 160, Lg = o.legs ?? 50;
    c.save(); c.translate(o.x, o.y);
    ell(c, 0, 0, 13 * s, 3 * s, 'rgba(0,0,0,.35)');                                                  // 바닥 그림자
    c.scale(s, s);
    const sit = o.pose === 'sit', dy = sit ? 6 : 0, walk = o.pose === 'walk';
    if (!sit) { rr(c, -7.5, walk ? -12 : -10, 7, walk ? 12 : 10, 3, gy(Lg)); rr(c, .5, -10, 7, walk ? 8 : 10, 3, gy(Lg));
      ell(c, -4.5, walk ? -1.5 : -1, 4.5, 2.2, gy(22)); ell(c, 4.5, -1, 4.5, 2.2, gy(22)); }
    // 팔 (몸 뒤쪽에 있는 쪽 먼저)
    const arm = (x0, y0, x1, y1) => { line(c, gy(B * .82), 6, x0, y0 + dy, x1, y1 + dy); ell(c, x1, y1 + dy, 2.6, 2.6, gy(200)); };
    const arms = o.env ? [[-9, -28, -5, -22], [9, -28, 5, -22]] : o.card ? [[-9, -28, -12, -14], [9, -28, 18, -36]]
      : o.torch ? [[-9, -28, -12, -14], [9, -28, 18, -24]] : o.push ? [[-9, -28, -7, -17], [9, -28, 7, -17]]
      : o.reach ? [[-9, -28, -12, -15], [9, -28, 23, -20]] : [[-9, -28, -12, -14], [9, -28, 12, -14]];
    // 몸통
    rr(c, -11, -33 + dy, 22, 25, [8, 8, 11, 11], side(B, -11, 11));
    c.strokeStyle = gy(15, .4); c.lineWidth = 1; c.beginPath(); c.roundRect(-11, -33 + dy, 22, 25, [8, 8, 11, 11]); c.stroke();
    if (o.suit && o.face !== 'back') { poly(c, gy(225), -4, -33 + dy, 4, -33 + dy, 0, -24 + dy); line(c, gy(15), 2, 0, -31 + dy, 0, -22 + dy); }
    if (o.badge && o.face !== 'back') { line(c, gy(25), .8, -4, -33 + dy, 0, -25 + dy, 4, -33 + dy); rr(c, -3, -26 + dy, 6, 7, 1, gy(245)); }
    if (o.band) rr(c, 8, -29 + dy, 6, 4, 1, gy(245));
    arms.forEach(a => arm(...a));
    if (o.env) { rr(c, -9, -27 + dy, 18, 12, 1, gy(232)); line(c, gy(150), .8, -9, -27 + dy, 0, -21 + dy, 9, -27 + dy); }
    if (o.card) rr(c, 16, -42 + dy, 7, 5, 1, gy(245));
    if (o.torch) rr(c, 17, -26 + dy, 8, 4, 1, gy(55));
    if (o.case) { rr(c, 8, -14 + dy, 13, 10, 2, gy(28)); line(c, gy(28), 1.2, 12, -14 + dy, 12, -16 + dy, 17, -16 + dy, 17, -14 + dy); }
    head(c, 0, -45 + dy, o);
    c.restore();
    if (o.torch) { const g = c.createLinearGradient(o.x + 25 * s, 0, o.x + 75 * s, 0); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      poly(c, g, o.x + 25 * s, o.y - 24 * s, o.x + 80 * s, o.y - 45 * s, o.x + 80 * s, o.y + 5 * s); }
  }

  // ---- 원근 투영 (한 점 투시) ----
  // 방 좌표(m): x 오른쪽, y 아래쪽(카메라 높이가 0, 바닥이 +), z 깊이
  function view(cx, cy, f) {
    const p = (x, y, z) => [cx + x * f / z, cy + y * f / z];
    const q = (c, fill, ...v) => { const a = []; for (let i = 0; i < v.length; i += 3) a.push(...p(v[i], v[i + 1], v[i + 2])); poly(c, fill, ...a); };
    const V = {
      p, q, s: z => f / z,
      ln: (c, st, w, x0, y0, z0, x1, y1, z1) => line(c, st, w, ...p(x0, y0, z0), ...p(x1, y1, z1)),
      wallX: (c, X, y0, y1, z0, z1, fl) => q(c, fl, X, y0, z0, X, y0, z1, X, y1, z1, X, y1, z0),
      wallZ: (c, Z, x0, x1, y0, y1, fl) => q(c, fl, x0, y0, Z, x1, y0, Z, x1, y1, Z, x0, y1, Z),
      flat: (c, Y, x0, x1, z0, z1, fl) => q(c, fl, x0, Y, z0, x1, Y, z0, x1, Y, z1, x0, Y, z1),
      // 축 정렬 상자: 카메라에서 보이는 면만 그린다
      box(c, x0, x1, y0, y1, z0, z1, top, front, side) {
        if (side && x1 < 0) V.wallX(c, x1, y0, y1, z0, z1, side);
        if (side && x0 > 0) V.wallX(c, x0, y0, y1, z0, z1, side);
        if (top && y0 > 0) V.flat(c, y0, x0, x1, z0, z1, top);
        if (front) V.wallZ(c, z0, x0, x1, y0, y1, front);
      },
      // 사람을 바닥 위치에 세운다 (키 1.65m 기준)
      actor(c, X, Z, floor, o, k = 1.65) { const [x, y] = p(X, floor, Z); person(c, { ...o, x, y, h: k * f / Z }); },
      txt(c, s, X, Y, Z, size, fl, bold) { const [x, y] = p(X, Y, Z); text(c, s, x, y, size, fl, bold); },
    };
    return V;
  }

  // 밤 조명: 화면 전체를 어둡게 덮고, 광원 자리만 둥글게 뚫는다. L = [x, y, 반지름, 세기, 세로비율]
  function lighting(c, amb, lights) {
    const cv = c.canvas, o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height;
    const g = o.getContext('2d'); g.scale(SS, SS);
    g.fillStyle = `rgba(0,0,0,${1 - amb})`; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'destination-out';
    for (const [x, y, r, a = 1, sy = 1] of lights) {
      g.save(); g.translate(x, y); g.scale(1, sy);
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, r);
      gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(.45, `rgba(0,0,0,${a * .6})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(-r, -r, r * 2, r * 2); g.restore();
    }
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(o, 0, 0); c.restore();
  }

  // 녹화 테이프 느낌: 가끔 밝은 띠, 먼지
  function tapeFx(c) {
    const y = 20 + rnd() * 140; rect(c, 0, y, W, 1.5 + rnd() * 2, 'rgba(255,255,255,.06)');
    for (let i = 0; i < 6; i++) rect(c, rnd() * W, rnd() * H, .5, .5, `rgba(255,255,255,${.2 + rnd() * .3})`);
  }

  // 문 (X 벽면에 붙은 문): 문틀, 문짝, 좁은 유리창, 손잡이
  function doorX(c, V, X, z0, z1, top, floor, shade, win = true) {
    const d = X < 0 ? .01 : -.01;
    V.wallX(c, X + d, top - .08, floor, z0 - .06, z1 + .06, gy(205));
    V.wallX(c, X + d * 2, top, floor, z0, z1, gy(shade));
    if (win) V.wallX(c, X + d * 3, top + .25, top + 1.0, z0 + (z1 - z0) * .62, z0 + (z1 - z0) * .82, gy(35));
    const hz = X < 0 ? z0 + (z1 - z0) * .12 : z1 - (z1 - z0) * .12;
    V.ln(c, gy(225), 1.2, X + d * 3, floor - 1.05, hz, X + d * 3, floor - 1.05, hz + (X < 0 ? .12 : -.12));
  }

  // 사무용 의자 (등받이가 카메라 쪽)
  function chair(c, V, X, Z, floor, back = true, shade = 60, side = 0) {
    V.box(c, X - .24, X + .24, floor - .48, floor - .42, Z - .22, Z + .22, gy(shade + 20), gy(shade), gy(shade - 15));
    V.ln(c, gy(40), 1, X, floor - .42, Z, X, floor - .05, Z);
    V.ln(c, gy(40), 1, X - .2, floor - .02, Z, X + .2, floor - .02, Z);
    if (back) V.box(c, X - .23, X + .23, floor - 1.05, floor - .52, Z + .2, Z + .27, gy(shade + 10), gy(shade + 5), gy(shade - 15));
    if (side) { const x = X + side * .25; V.box(c, Math.min(x, x + side * .07), Math.max(x, x + side * .07), floor - 1.05, floor - .52, Z - .23, Z + .23, gy(shade + 10), gy(shade + 5), gy(shade - 5)); }
  }

  // ---------- CAM 01: 3층 자료보관실 앞 복도 ----------
  function cam01(c, t) {
    const V = view(152, 36, 190), F = 2.5, C = -.25, Z1 = 11, day = t === '18:20';
    V.q(c, gy(150), -1.2, C, .8, 1.2, C, .8, 1.2, C, Z1, -1.2, C, Z1);                          // 천장
    for (let z = 1.4; z < Z1; z += .6) V.ln(c, gy(120), .5, -1.2, C, z, 1.2, C, z);
    [-.6, 0, .6].forEach(x => V.ln(c, gy(120), .5, x, C, .8, x, C, Z1));
    V.wallX(c, -1.2, C, F, .8, Z1, gy(178)); V.wallX(c, 1.2, C, F, .8, Z1, gy(165));            // 벽
    V.wallX(c, -1.2, 1.45, F, .8, Z1, gy(138)); V.wallX(c, 1.2, 1.45, F, .8, Z1, gy(128));      // 징두리
    V.ln(c, gy(100), .8, -1.2, 1.45, .8, -1.2, 1.45, Z1); V.ln(c, gy(95), .8, 1.2, 1.45, .8, 1.2, 1.45, Z1);
    V.wallZ(c, Z1, -1.2, 1.2, C, F, gy(150));                                                    // 끝 벽
    V.wallZ(c, Z1, -.55, .55, .3, F, gy(110)); V.ln(c, gy(70), .6, 0, .3, Z1, 0, F, Z1);       // 비상문
    V.ln(c, gy(200), 1, -.45, 1.45, Z1, -.05, 1.45, Z1); V.ln(c, gy(200), 1, .05, 1.45, Z1, .45, 1.45, Z1);
    V.flat(c, F, -1.2, 1.2, .8, Z1, gy(188));                                                   // 바닥
    for (let z = 1.2; z < Z1; z += .6) V.ln(c, gy(160), .5, -1.2, F, z, 1.2, F, z);
    [-.6, 0, .6].forEach(x => V.ln(c, gy(160), .5, x, F, .8, x, F, Z1));
    V.wallX(c, -1.19, 2.38, F, .8, Z1, gy(60)); V.wallX(c, 1.19, 2.38, F, .8, Z1, gy(60));     // 걸레받이
    // 왼쪽 벽: 기록물팀 문, 게시판, 소화기함, 안쪽 문
    doorX(c, V, -1.2, 1.7, 2.7, .35, F, 120);
    V.wallX(c, -1.19, .1, .32, 3.0, 3.6, gy(225));                                              // 호실 표지
    V.wallX(c, -1.19, .7, 1.35, 3.9, 5.6, gy(120));                                             // 게시판
    [[4.0, .78, 4.4, 1.05], [4.5, .8, 4.85, 1.2], [4.95, .76, 5.4, 1.0], [4.1, 1.1, 4.6, 1.3], [5.0, 1.05, 5.45, 1.3]].forEach(([z0, y0, z1, y1]) =>
      V.wallX(c, -1.18, y0, y1, z0, z1, gy(230)));
    V.wallX(c, -1.19, 1.25, 2.15, 6.4, 6.85, gy(210)); V.wallX(c, -1.18, 1.35, 1.55, 6.45, 6.8, gy(80)); // 소화기함
    doorX(c, V, -1.2, 8.0, 8.8, .4, F, 120);
    // 오른쪽 벽: 자료보관실 철문(양문), 문패, 카드단말기, 출입금지 표지
    V.wallX(c, 1.19, .22, F, 4.05, 5.55, gy(205));
    V.wallX(c, 1.18, .3, F, 4.12, 5.48, gy(95)); V.ln(c, gy(60), .8, 1.17, .3, 4.8, 1.17, F, 4.8);
    V.ln(c, gy(215), 1.3, 1.17, 1.45, 4.65, 1.17, 1.45, 4.74); V.ln(c, gy(215), 1.3, 1.17, 1.45, 4.86, 1.17, 1.45, 4.95);
    V.wallX(c, 1.17, .95, 1.15, 4.3, 4.7, gy(220));                                               // 관계자 외 출입금지
    V.wallX(c, 1.19, -.08, .14, 4.25, 5.35, gy(235));                                             // 문패
    V.wallX(c, 1.19, 1.05, 1.32, 3.86, 3.97, gy(35));                                             // 카드단말기
    V.box(c, .95, 1.19, 2.05, F, 7.2, 7.45, gy(70), gy(90), gy(70));                              // 휴지통
    // 사람
    if (t === '21:50') V.actor(c, .78, 4.0, F, { body: 165, hair: 'short', glasses: true, face: 'right', card: true, badge: true });
    if (t === '22:05') { V.wallX(c, 1.16, .3, F, 4.8, 5.1, gy(15));                                // 열린 문틈
      V.actor(c, .5, 4.3, F, { body: 165, hair: 'short', glasses: true, face: 'left', env: true, pose: 'walk', badge: true }); }
    if (t === '18:20') { V.actor(c, .85, 4.75, F, { body: 190, hair: 'bob', face: 'front', push: true, badge: true });
      V.box(c, .05, .62, 2.22, 2.3, 4.0, 4.5, gy(150), gy(110), gy(90));                       // 카트
      V.ln(c, gy(90), 1.2, .6, 2.22, 4.5, .62, 1.55, 4.5);
      V.box(c, .08, .6, 1.9, 2.22, 4.03, 4.47, gy(215), gy(185), gy(150)); V.box(c, .12, .56, 1.6, 1.9, 4.06, 4.44, gy(220), gy(190), gy(155));
      V.box(c, .2, .48, 1.68, 1.78, 4.05, 4.06, null, gy(240), null);                            // 상자 라벨
      [4.03, 4.47].forEach(z => [.08, .58].forEach(x => { const [a, b] = V.p(x, F - .04, z); ell(c, a, b, 1.5, 1.5, gy(30)); })); }
    // 조명
    const fx = [2.2, 4.6, 7.0, 9.4];
    const lit = day ? fx : [4.6];
    if (!day) lighting(c, .2, [[...V.p(0, F, 4.6), 95, 1, .45], [...V.p(0, C, 4.6), 40, .8], [...V.p(0, .2, Z1), 28, .7], [...V.p(1.19, 1.18, 3.9), 8, .8]]);
    else lighting(c, .92, []);
    fx.forEach(z => { const on = lit.includes(z); V.flat(c, C + .03, -.32, .32, z - .55, z + .55, gy(on ? 250 : 95));
      if (on) { const [x, y] = V.p(0, F, z); glow(c, x, y, 30 * 4.6 / z, .12); } });
    V.wallZ(c, Z1 - .01, -.25, .25, .05, .25, gy(235)); V.txt(c, '비상구', 0, .15, Z1, 6, gy(30));   // 비상구 표시등
    const [lx, ly] = V.p(1.17, 1.12, 3.9); rect(c, lx - .8, ly - .8, 1.6, 1.6, gy(255));          // 단말기 LED
    V.txt(c, '자료보관실', 1.17, .03, 4.8, 6, gy(30), true); V.txt(c, '3-10', -1.17, .21, 3.3, 6, gy(40));
    V.txt(c, '관계자 외', 1.16, 1.05, 4.5, 6, gy(40));
  }

  // ---------- CAM 02: 1층 로비 ----------
  function cam02(c, t) {
    const V = view(160, 26, 165), F = 3.4, C = -1.0, Z1 = 10, day = t === '18:20';
    V.q(c, gy(145), -9, C, 1.5, 9, C, 1.5, 9, C, Z1, -9, C, Z1);                                  // 천장
    V.wallX(c, -9, C, F, 1.5, Z1, gy(165)); V.wallX(c, 9, C, F, 1.5, Z1, gy(160));
    V.wallZ(c, Z1, -9, 9, C, F, gy(170));                                                        // 뒷벽
    V.wallZ(c, Z1, -3.2, 3.2, .3, F, gy(day ? 175 : 22));                                         // 유리 출입구 (밖)
    if (!day) { [[-2.6, .9, .5], [-1.2, 1.2, .3], [1.9, .8, .4]].forEach(([x, y, h]) => V.wallZ(c, Z1, x, x + .5, y, y + h, gy(70)));   // 건너편 건물 창
      V.box(c, -.8, 1.6, 2.6, 3.3, Z1 + 2, Z1 + 3, gy(45), gy(35), null); }                      // 주차된 차
    for (let x = -3.2; x <= 3.21; x += 1.07) V.ln(c, gy(80), 1.2, x, .3, Z1, x, F, Z1);           // 창틀
    V.ln(c, gy(80), 1.2, -3.2, .3, Z1, 3.2, .3, Z1); V.ln(c, gy(80), 1, -3.2, 1.9, Z1, 3.2, 1.9, Z1);
    V.wallZ(c, Z1 - .01, -2.0, 2.0, -.5, .05, gy(60));                                           // 간판
    V.wallX(c, -8.99, .4, 1.9, 5.8, 7.6, gy(40));                                                  // 층별 안내 화면
    // 바닥 (대리석 체크)
    for (let x = -9; x < 9; x += 1.5) for (let z = 1.5; z < Z1; z += 1.5)
      V.flat(c, F, x, x + 1.5, z, Math.min(z + 1.5, Z1), gy(((x + z) / 1.5 & 1) ? 182 : 168));
    // 계단 (오른쪽)
    for (let i = 11; i >= 0; i--) { const y = F - i * .18, z = 4.2 + i * .34;
      V.box(c, 5.6, 8.9, y - .18, y, z, z + .34, gy(190 - i * 2), gy(140), null); }
    V.ln(c, gy(70), 1.4, 5.6, F - 1.0, 4.2, 5.6, F - 1.0 - 11 * .18, 4.2 + 11 * .34);             // 난간
    // 기둥
    [-5.6, 4.6].forEach(x => V.box(c, x - .35, x + .35, C, F, 6.2, 6.9, null, gy(178), gy(140)));
    // 스피드 게이트
    [0, 1.15, 2.3, 3.45].forEach(x => { V.box(c, x - .14, x + .14, 2.4, F, 6.0, 7.1, gy(215), gy(165), gy(130));
      if (x < 3.4) V.wallZ(c, 6.5, x + .14, x + .6, 2.55, 3.0, 'rgba(230,230,230,.35)'); });
    // 화분
    const plant = (X, Z) => { V.box(c, X - .3, X + .3, F - .6, F, Z, Z + .6, gy(120), gy(95), gy(80));
      const [x, y] = V.p(X, F - .9, Z + .3), r = V.s(Z) * .5; ell(c, x, y, r, r * .8, gy(70)); ell(c, x - r * .4, y - r * .3, r * .6, r * .5, gy(95)); ell(c, x + r * .4, y - r * .2, r * .5, r * .45, gy(85)); };
    plant(-8.2, 8.6); plant(3.9, 8.8);
    // 경비원 + 안내데스크
    V.box(c, -6.4, -5.9, .9, F, 7.6, 7.65, null, gy(225), null); V.txt(c, '민원실', -6.15, 1.35, 7.6, 6, gy(40), true); V.txt(c, '←', -6.15, 1.85, 7.6, 6, gy(40)); // 배너
    V.actor(c, -3.0, 5.4, F - .45, { body: 80, hair: 'cap', face: 'front', pose: 'sit' });   // 높은 의자에 앉은 경비원
    V.box(c, -4.8, -1.4, 2.25, F, 4.3, 5.1, gy(212), gy(125), gy(105));
    V.box(c, -4.8, -1.4, 2.12, 2.25, 4.22, 4.45, gy(225), gy(150), gy(120));
    V.box(c, -2.5, -2.0, 1.65, 2.12, 4.75, 4.8, gy(40), gy(35), gy(30));                          // 모니터
    V.box(c, -4.35, -4.25, 1.5, 2.25, 4.8, 4.85, null, gy(40), null); V.box(c, -4.5, -4.0, 1.42, 1.55, 4.7, 5.0, gy(220), gy(200), null); // 스탠드
    V.box(c, -1.85, -1.55, 2.1, 2.25, 4.6, 4.8, gy(45), gy(40), gy(35));                          // 전화기
    V.txt(c, '안 내', -3.1, 2.75, 4.3, 6, gy(60), true);
    // 사람
    if (t === '18:20') [[.6, 7.8, 'short', 150], [1.7, 8.3, 'buzz', 120], [2.9, 7.6, 'bob', 175]].forEach(([x, z, hair, body]) =>
      V.actor(c, x, z, F, { body, hair, face: 'back', pose: 'walk' }));
    if (t === '21:58') V.actor(c, -.85, 4.4, F, { body: 45, legs: 30, hair: 'slick', face: 'left', suit: true, case: true, badge: true });
    if (t === '23:05') V.actor(c, 3.7, 5.0, F, { body: 115, hair: 'buzz', face: 'right', torch: true, band: true, pose: 'walk' });
    // 조명
    const downs = [[-6, 3.5], [-2, 3.5], [2, 3.5], [6, 3.5], [-6, 7], [-2, 7], [2, 7], [6, 7]];
    const on = day ? downs : [[-6, 3.5], [2, 7], [6, 3.5]];
    const L = on.map(([x, z]) => [...V.p(x, F, z), 70 * 3.5 / z, .9, .5]);
    L.push([...V.p(-3.3, 1.9, 5.2), 48, 1], [...V.p(0, 1.5, Z1), 60, day ? 1 : .35], [...V.p(-8.99, 1.15, 6.7), 22, .5]);
    if (t === '23:05') L.push([...V.p(3.7, 2.4, 5.0), 40, .9], [...V.p(5.4, 2.6, 5.2), 55, 1, .6]);
    lighting(c, day ? .9 : .24, L);
    downs.forEach(([x, z]) => { const [a, b] = V.p(x, C + .01, z), r = V.s(z) * .22; ell(c, a, b, r, r * .35, gy(on.some(o => o[0] === x && o[1] === z) ? 252 : 110)); });
    V.txt(c, '한빛시청', 0, -.22, Z1, 12, gy(235), true);
    V.box(c, -2.45, -2.05, 1.7, 2.07, 4.74, 4.75, null, gy(day ? 200 : 150), null);             // 모니터 화면
    { const [a, b] = V.p(-4.25, 1.55, 4.85); glow(c, a, b, 10, .5); }                            // 스탠드 불빛
    [0, 1.15, 2.3, 3.45].forEach(x => { const [a, b] = V.p(x, 2.5, 6.0); rect(c, a - 1, b - .6, 2, 1.2, gy(250)); });
    V.txt(c, '층별 안내', -8.98, .7, 6.7, 6, gy(200));
    if (!day) { const [a, b] = V.p(2.5, .6, Z1 + 4); glow(c, a, b, 14, .6); rect(c, a - .5, b, 1, 9, gy(90)); }   // 바깥 가로등
  }

  // ---------- CAM 03: 2층 소회의실 ----------
  function cam03(c, t) {
    const V = view(165, 46, 150), F = 2.4, C = -.3, Z1 = 7.1, X = 3.6, day = t === '18:20', meet = t === '22:14';
    V.q(c, gy(150), -X, C, 1.6, X, C, 1.6, X, C, Z1, -X, C, Z1);
    V.wallX(c, -X, C, F, 1.6, Z1, gy(160)); V.wallX(c, X, C, F, 1.6, Z1, gy(170)); V.wallZ(c, Z1, -X, X, C, F, gy(175));
    V.flat(c, F, -X, X, 1.6, Z1, gy(118));                                                       // 카펫
    for (let z = 2.1; z < Z1; z += .5) V.ln(c, gy(105), .4, -X, F, z, X, F, z);
    for (let x = -3; x <= 3; x += .6) V.ln(c, gy(105), .4, x, F, 1.6, x, F, Z1);
    // 뒷벽: 창(블라인드), 화이트보드, 에어컨, 시계
    V.wallZ(c, Z1, -3.2, -.7, .3, 1.55, gy(day ? 150 : 18));
    if (!day) [[-2.9, .9], [-2.2, 1.1], [-1.5, .8], [-1.1, 1.2]].forEach(([x, y]) => V.wallZ(c, Z1, x, x + .18, y, y + .06, gy(200)));
    for (let y = .36; y < 1.55; y += .09) V.ln(c, gy(day ? 120 : 60), .7, -3.2, y, Z1, -.7, y, Z1);
    V.wallZ(c, Z1, .3, 2.9, .3, 1.35, gy(232)); V.ln(c, gy(150), 1.5, .3, 1.35, Z1, 2.9, 1.35, Z1);
    [[.6, .5, 1.6, .55], [.6, .65, 1.3, .7], [.6, .8, 2.0, .85]].forEach(([x0, y0, x1, y1]) => V.ln(c, gy(120), .6, x0, y0, Z1, x1, y1, Z1));
    V.ln(c, gy(120), .6, 1.9, 1.15, Z1, 2.2, .95, Z1, ); V.ln(c, gy(120), .6, 2.2, .95, Z1, 2.5, 1.05, Z1);
    V.box(c, -3.0, -1.7, C + .05, .05, Z1 - .25, Z1, gy(225), gy(215), gy(190));                   // 에어컨
    { const [a, b] = V.p(3.25, .15, Z1); ell(c, a, b, 5, 5, gy(220)); ell(c, a, b, 4.2, 4.2, gy(245)); }
    // 왼쪽 벽 문(반투명 유리), 오른쪽 벽 액자, 화분
    doorX(c, V, -X, 2.6, 3.6, .3, F, 135);
    V.wallX(c, X - .01, .6, 1.3, 3.4, 4.8, gy(70)); V.wallX(c, X - .02, .66, 1.24, 3.48, 4.72, gy(140));
    // 의자 (뒤쪽 줄) → 사람 → 테이블 → 앞쪽 의자
    [-.9, 0, .9].forEach(x => chair(c, V, x, 6.2, F, false));
    [-.9, 0, .9].forEach(x => V.box(c, x - .23, x + .23, F - 1.05, F - .52, 6.45, 6.52, gy(70), gy(65), gy(50)));
    if (meet) V.actor(c, -.05, 5.95, F, { body: 165, hair: 'short', glasses: true, face: 'front', pose: 'sit', reach: true, badge: true }, 1.6);
    [4.0, 5.1].forEach(z => { chair(c, V, -1.75, z, F, false, 60, -1); chair(c, V, 1.75, z, F, false, 60, 1); });
    V.box(c, -1.3, 1.3, 1.65, 1.72, 3.2, 5.8, gy(192), gy(120), gy(105));                        // 테이블
    V.box(c, -1.1, 1.1, 1.72, F, 3.3, 3.32, null, gy(85), null);
    [[-.9, 3.6], [.9, 3.6], [-.9, 5.4], [.9, 5.4]].forEach(([x, z]) => V.box(c, x - .04, x + .04, 1.42, 1.65, z, z + .08, gy(230), gy(205), gy(180))); // 물병
    V.box(c, -.6, .0, 1.6, 1.65, 5.2, 5.6, gy(55), gy(45), null);                                // 노트북
    if (meet) { V.flat(c, 1.64, .05, .55, 4.3, 4.85, gy(238)); V.ln(c, gy(160), .5, .05, 1.639, 4.3, .3, 1.639, 4.55); } // 봉투
    if (meet) { V.actor(c, .6, 2.95, F, { body: 45, hair: 'slick', face: 'back', pose: 'sit' }, 1.6);
      V.box(c, 1.15, 1.6, 1.62, 1.95, 2.8, 3.15, gy(55), gy(35), gy(30)); chair(c, V, -.6, 2.8, F); }  // 열린 서류가방
    else [-.6, .6].forEach(x => chair(c, V, x, 2.8, F));
    // 조명
    const L = [];
    if (day) L.push([...V.p(-1.9, 1, Z1), 70, .8]);
    if (meet) L.push([...V.p(0, 1.65, 4.5), 110, 1, .55], [...V.p(0, .6, 5.2), 55, .7]);
    lighting(c, day ? .85 : meet ? .16 : .17, L);
    V.flat(c, C + .02, -.8, .8, 3.9, 4.9, gy(day || meet ? 250 : 100));                         // 천장 등
    if (meet) { const [a, b] = V.p(0, 1.65, 4.5); glow(c, a, b, 40, .12); }
  }

  // ---------- CAM 04: 2층 재난안전과 사무실 ----------
  function cam04(c, t) {
    const V = view(170, 28, 150), F = 2.6, C = -.3, Z1 = 10, X = 5.5, day = t === '18:20', late = t === '22:31';
    V.q(c, gy(150), -X, C, 1.7, X, C, 1.7, X, C, Z1, -X, C, Z1);
    V.wallX(c, -X, C, F, 1.7, Z1, gy(160)); V.wallX(c, X, C, F, 1.7, Z1, gy(168)); V.wallZ(c, Z1, -X, X, C, F, gy(172));
    V.flat(c, F, -X, X, 1.7, Z1, gy(128));
    for (let z = 2.2; z < Z1; z += .6) V.ln(c, gy(115), .4, -X, F, z, X, F, z);
    // 왼쪽 벽 창 (블라인드)
    [[2.4, 4.4], [5.0, 7.0], [7.6, 9.6]].forEach(([z0, z1]) => { V.wallX(c, -X + .01, .2, 1.5, z0, z1, gy(day ? 160 : 20));
      for (let y = .26; y < 1.5; y += .1) V.ln(c, gy(day ? 125 : 55), .6, -X + .02, y, z0, -X + .02, y, z1); });
    // 뒷벽: 업무 현황판, 시계, 캐비닛
    V.wallZ(c, Z1, -3.8, -.4, .25, 1.25, gy(230));
    for (let i = 0; i < 4; i++) V.ln(c, gy(150), .5, -3.8, .45 + i * .2, Z1, -.4, .45 + i * .2, Z1);
    for (let i = 1; i < 5; i++) V.ln(c, gy(150), .5, -3.8 + i * .68, .25, Z1, -3.8 + i * .68, 1.25, Z1);
    V.txt(c, '재난안전과 업무현황', -2.1, .34, Z1, 6, gy(60));
    for (let i = 0; i < 4; i++) V.box(c, 1.0 + i * .9, 1.85 + i * .9, .9, F, Z1 - .6, Z1, gy(185), gy(165), null);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) V.ln(c, gy(120), .5, 1.05 + i * .9, 1.3 + j * .35, Z1 - .6, 1.8 + i * .9, 1.3 + j * .35, Z1 - .6);
    { const cl = V.p(2.6, .35, Z1), [hh, mm] = t.split(':').map(Number), ha = ((hh % 12) + mm / 60) / 12 * Math.PI * 2, ma = mm / 60 * Math.PI * 2;
      ell(c, cl[0], cl[1], 7, 7, gy(70)); ell(c, cl[0], cl[1], 6, 6, gy(240));
      line(c, gy(20), 1.3, cl[0], cl[1], cl[0] + Math.sin(ha) * 3.2, cl[1] - Math.cos(ha) * 3.2);
      line(c, gy(20), .8, cl[0], cl[1], cl[0] + Math.sin(ma) * 4.8, cl[1] - Math.cos(ma) * 4.8); }
    // 오른쪽 벽: 복합기, 정수기
    V.box(c, 4.6, X, 1.5, F, 6.2, 7.2, gy(205), gy(185), gy(170)); V.box(c, 4.6, X, 1.35, 1.5, 6.3, 7.1, gy(150), gy(130), gy(120));
    V.box(c, 4.9, X, .9, F, 4.2, 4.6, gy(215), gy(200), gy(185)); V.box(c, 5.0, 5.3, .55, .9, 4.25, 4.55, gy(240), gy(225), gy(210));
    // 천장 매달린 부서 표지
    V.ln(c, gy(90), .4, -.9, C, 4.4, -.9, -.12, 4.4); V.ln(c, gy(90), .4, .9, C, 4.4, .9, -.12, 4.4);
    V.wallZ(c, 4.4, -1.0, 1.0, -.12, .12, gy(70)); V.txt(c, '재난안전과', 0, 0, 4.4, 6, gy(235), true);
    // 책상 섬 (뒤에서 앞으로)
    const isl = (x0, x1, z, parkSeat) => {
      const zm = z + .7, Y = F - .75;
      for (let x = x0 + .3; x < x1 - .3; x += 1.2) chair(c, V, x + .3, z + 1.65, F, false, 70);  // 건너편 의자
      V.box(c, x0, x1, Y, F, z, z + 1.4, gy(205), gy(150), gy(130));                            // 책상
      for (let x = x0; x < x1 - .3; x += 1.2) {                                                   // 건너편 모니터 (뒷면)
        V.box(c, x + .3, x + .85, Y - .42, Y - .08, zm + .15, zm + .2, gy(50), gy(45), gy(40)); }
      V.box(c, x0, x1, Y - .42, Y, zm - .02, zm + .02, gy(150), gy(130), gy(110));               // 칸막이
      for (let x = x0; x < x1 - .3; x += 1.2) {                                                   // 이쪽 모니터 (화면)
        V.box(c, x + .3, x + .85, Y - .4, Y - .06, zm - .2, zm - .15, gy(55), gy(day ? 120 : 40), gy(45));
        V.flat(c, Y - .005, x + .35, x + .8, z + .25, z + .45, gy(70));                            // 키보드
        V.box(c, x + .9, x + 1.1, Y - .15, Y, z + .2, z + .45, gy(235), gy(220), gy(200));         // 서류 더미
      }
      V.box(c, x0 + .1, x0 + .16, Y - .1, Y, z + .5, z + .56, gy(220), gy(200), gy(180));        // 머그컵
    };
    isl(-4.6, -.8, 7.6); isl(.8, 4.6, 7.6);
    isl(-4.6, -.8, 5.0); isl(.8, 4.6, 5.0);
    [-4.03, -2.83, -1.63, 1.38, 2.58, 3.78].forEach(x => {                                         // 가운데 줄 이쪽 자리
      if (late && x === 2.58) return V.actor(c, 2.0, 4.75, F, { body: 165, hair: 'short', face: 'back', pose: 'sit' });
      if (day && x === -2.83) return V.actor(c, -2.83, 4.75, F, { body: 175, hair: 'bob', face: 'back', pose: 'sit' });
      chair(c, V, x, 4.75, F, true, 62); });
    if (day) V.actor(c, -.05, 6.6, F, { body: 125, hair: 'buzz', face: 'left' });
    isl(-4.6, -.8, 2.4); isl(.8, 4.6, 2.4);
    // 조명
    const L = [];
    if (day) [3, 6, 9].forEach(z => [-2.5, 2.5].forEach(x => L.push([...V.p(x, F, z), 70 * 3 / z, .9, .5])));
    if (late) L.push([...V.p(2.45, F - 1.1, 5.4), 58, .9], [...V.p(2.4, F, 5.0), 50, .5, .5]);
    lighting(c, day ? .88 : late ? .14 : .17, L);
    [3, 6, 9].forEach(z => [-2.5, 2.5].forEach(x => V.flat(c, C + .02, x - .5, x + .5, z - .4, z + .4, gy(day ? 250 : 90))));
    if (late) { V.box(c, 2.33, 2.82, F - 1.14, F - .8, 5.49, 5.5, null, gy(250), null); const [a, b] = V.p(2.58, F - .97, 5.49); glow(c, a, b, 26, .35); }
  }

  const SCENES = { '01': cam01, '02': cam02, '03': cam03, '04': cam04 };

  // ---- 확대 화면 ----
  const ZOOMS = {
    '01-18:20': c => { rect(c, 0, 0, W, H, gy(40)); poly(c, gy(150), 30, 30, 290, 20, 300, 170, 20, 175);
      line(c, gy(110), 3, 30, 90, 295, 85); rect(c, 95, 50, 130, 70, gy(235));
      text(c, '보존문서', 160, 72, 24, gy(25), true); text(c, '2024', 160, 100, 24, gy(25), true); text(c, 'B-02', 205, 114, 12, gy(90)); },
    '01-21:50': c => { rect(c, 0, 0, W, H, gy(70)); rect(c, 230, 30, 50, 80, gy(30)); rect(c, 240, 45, 30, 20, gy(60)); ell(c, 255, 90, 4, 4, gy(220));
      poly(c, gy(170), 40, 180, 80, 120, 130, 110, 140, 140, 90, 180); rect(c, 100, 70, 120, 76, gy(240));
      rect(c, 108, 80, 30, 38, gy(120)); c.save(); c.beginPath(); c.rect(108, 80, 30, 38); c.clip(); head(c, 123, 100, { hair: 'short', glasses: true, face: 'front' }); c.restore(); text(c, '재난안전과', 182, 92, 12, gy(30)); text(c, '박도현', 182, 112, 24, gy(20), true); rect(c, 108, 128, 104, 10, gy(60)); },
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
    draw(c); if (!key.startsWith('Z') && !key.startsWith('S')) tapeFx(c);
    if (tint) { vignette(c, key.startsWith('Z') ? .55 : .8); finish(c); }
    return cache[key] = cv.toDataURL();
  }

  // 대피소 (엔딩용, 컬러)
  function shelter(lit) {
    return make('S' + lit, c => {
      const k = lit ? 1 : .2, col = (r, g, b, a = 1) => `rgba(${r * k | 0},${g * k | 0},${b * k | 0},${a})`;
      rect(c, 0, 0, W, 90, lit ? col(90, 80, 70) : 'rgb(8,10,16)');
      for (let i = 0; i < 5; i++) { rect(c, 20 + i * 62, 20, 36, 40, 'rgb(10,14,24)');
        for (let j = 0; j < 9; j++) line(c, 'rgba(140,160,200,.35)', .7, 24 + i * 62 + j * 4, 22, 22 + i * 62 + j * 4, 58); }
      rect(c, 0, 90, W, 90, lit ? col(150, 110, 70) : 'rgb(10,10,14)');
      for (let i = 0; i < 8; i++) line(c, lit ? col(120, 85, 55) : 'rgb(14,14,18)', 1, 0, 95 + i * 11, W, 95 + i * 11);
      for (let i = 0; i < 9; i++) { const x = 20 + i * 35, y = 120 + (i % 3) * 18;
        rect(c, x - 14, y + 4, 30, 10, lit ? col(70, 90, 130) : 'rgb(14,16,22)');
        ell(c, x, y - 6, 4, 5, lit ? col(60, 45, 35) : 'rgb(4,4,6)'); poly(c, lit ? col(80, 70, 90) : 'rgb(5,5,8)', x - 7, y + 6, x + 7, y + 6, x + 5, y - 2, x - 5, y - 2); }
      if (!lit) { glow(c, 268, 72, 36, .3, '60,200,110'); rect(c, 248, 66, 40, 13, 'rgb(30,130,65)'); text(c, '비상구', 268, 73, 12, 'rgb(200,255,215)'); }
      if (lit) [50, 160, 270].forEach(x => { rect(c, x - 14, 4, 28, 3, 'rgb(255,240,200)'); glow(c, x, 60, 120, .35, '255,220,160'); });
      seed('S'); const d = pixels(c), p = d.data;
      for (let i = 0; i < p.length; i += 4) { const n = (rnd() - .5) * 14; p[i] += n; p[i + 1] += n; p[i + 2] += n; }
      c.putImageData(d, 0, 0);
    }, false);
  }

  return {
    scene: (cam, time) => make(`${cam}-${time}`, c => SCENES[cam](c, time)),
    zoom: key => ZOOMS[key] ? make('Z' + key, ZOOMS[key]) : null,
    hasZoom: key => !!ZOOMS[key],
    shelter,
    _person: person, // 테스트용
  };
})();
