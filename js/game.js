const $ = id => document.getElementById(id);
const stage = $('stage');

// ---------- 화면 맞춤 (1280x800 고정 화면을 창 크기에 맞게) ----------
function fit(){ const s = Math.min(innerWidth / 1280, innerHeight / 800); stage.style.transform = `translate(-50%,-50%) scale(${s})`; }
addEventListener('resize', fit); fit();

// ---------- 노이즈 텍스처 ----------
(() => { const c = document.createElement('canvas'); c.width = c.height = 200; const x = c.getContext('2d'), d = x.createImageData(200, 200);
  for (let i = 0; i < d.data.length; i += 4){ const v = Math.random() * 255; d.data[i] = d.data[i+1] = d.data[i+2] = v; d.data[i+3] = 255; }
  x.putImageData(d, 0, 0); stage.style.setProperty('--noise', `url(${c.toDataURL()})`); })();

// ---------- 픽셀 아이콘 ----------
const BMP = {
  folder:['................','................','.aaaaa..........','.abbbba.........','.abbbbbaaaaaaaa.','.acccccccccccca.','.abbbbbbbbbbbba.','.abbbbbbbbbbbba.','.abbbbbbbbbbbba.','.abbbbbbbbbbbba.','.abbbbbbbbbbbba.','.abbbbbbbbbbbba.','.abbbbbbbbbbbba.','.aaaaaaaaaaaaaa.','................','................'],
  lock:['................','................','.aaaaa..........','.abbbba.........','.abbbbbaaaaaaaa.','.acccccccccccca.','.abbbbbbbbbbbba.','.abbbbbbbdddbba.','.abbbbbbbdadbba.','.abbbbbbdddddba.','.abbbbbbddaddba.','.abbbbbbdddddba.','.abbbbbbbbbbbba.','.aaaaaaaaaaaaaa.','................','................'],
  file:['................','..aaaaaaaaa.....','..acccccccaa....','..acccccccaca...','..acccccccaaaa..','..acccccccccca..','..acaaaaaaacca..','..acccccccccca..','..acaaaaaaaaca..','..acccccccccca..','..acaaaaaaacca..','..acccccccccca..','..acaaaaaaaaca..','..acccccccccca..','..aaaaaaaaaaaa..','................'],
  pc:['................','.aaaaaaaaaaaaaa.','.abbbbbbbbbbbba.','.abccccccccccba.','.abccccccccccba.','.abccccccccccba.','.abccccccccccba.','.abccccccccccba.','.abbbbbbbbbbbba.','.aaaaaaaaaaaaaa.','......abba......','......abba......','...aaaaaaaaaa...','...abbbbbbbba...','...aaaaaaaaaa...','................'],
  trash:['................','.....aaaaaa.....','..aaaaaaaaaaaa..','..abbbbbbbbbba..','..aaaaaaaaaaaa..','...abcbcbcbca...','...abcbcbcbca...','...abcbcbcbca...','...abcbcbcbca...','...abcbcbcbca...','...abcbcbcbca...','...abcbcbcbca...','...abcbcbcbca...','...aaaaaaaaaa...','................','................'],
  globe:['................','.....aaaaaa.....','...aabcbbcbaa...','..abbcbbbbcbba..','..aaaaaaaaaaaa..','.abbcbbbbbbcbba.','.abbcbbbbbbcbba.','.aaaaaaaaaaaaaa.','.abbcbbbbbbcbba.','.abbcbbbbbbcbba.','..aaaaaaaaaaaa..','..abbcbbbbcbba..','...aabcbbcbaa...','.....aaaaaa.....','................','................'],
  gear:['................','.......aa.......','...aa.abba.aa...','...abaabbaaba...','....abbbbbba....','..aabbbaabbbaa..','.abbbba..abbbba.','.abbbba..abbbba.','..aabbbaabbbaa..','....abbbbbba....','...abaabbaaba...','...aa.abba.aa...','.......aa.......','................','................','................'],
};
const PAL = { folder:{a:'#1a1608',b:'#8c7836',c:'#b9a158'}, lock:{a:'#1a1608',b:'#6b5c2a',c:'#8c7836',d:'#b8392c'},
  file:{a:'#16170f',b:'#7d8170',c:'#b9bca8'}, pc:{a:'#111',b:'#6b6e62',c:'#32493a'}, trash:{a:'#111',b:'#6b6e62',c:'#3d3f37'},
  globe:{a:'#111',b:'#3f5a63',c:'#7aa0a8'}, gear:{a:'#111',b:'#76796c',c:'#999'} };
const ICON = {};
for (const k in BMP){ const c = document.createElement('canvas'); c.width = c.height = 16; const x = c.getContext('2d');
  BMP[k].forEach((row, y) => [...row].forEach((ch, i) => { if (PAL[k][ch]){ x.fillStyle = PAL[k][ch]; x.fillRect(i, y, 1, 1); } }));
  ICON[k] = c.toDataURL(); }

// ---------- 소리 (WebAudio로 직접 합성) ----------
const SFX = (() => {
  let ctx, master, on = true;
  const init = () => { if (ctx) return; ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = on ? 1 : 0; master.connect(ctx.destination); };
  const noiseBuf = sec => { const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; };
  const tone = (f, dur, type = 'sine', vol = .05, when = 0) => { if (!ctx) return; const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + when;
    o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(g).connect(master); o.start(t); o.stop(t + dur); };
  return {
    init,
    toggle(){ on = !on; if (master) master.gain.value = on ? 1 : 0; return on; },
    hum(){ if (!ctx || this.humming) return; this.humming = true; const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 55; g.gain.value = .018; o.connect(g).connect(master); o.start();
      const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), ng = ctx.createGain(); n.buffer = noiseBuf(2); n.loop = true; f.type = 'lowpass'; f.frequency.value = 400; ng.gain.value = .02; n.connect(f).connect(ng).connect(master); n.start(); },
    static(dur = .25, vol = .07){ if (!ctx) return; const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), t = ctx.currentTime;
      n.buffer = noiseBuf(dur); f.type = 'highpass'; f.frequency.value = 1500; g.gain.setValueAtTime(vol, t); g.gain.linearRampToValueAtTime(0, t + dur); n.connect(f).connect(g).connect(master); n.start(); },
    click(){ tone(1400, .03, 'square', .02); },
    shutter(){ tone(2200, .02, 'square', .04); tone(900, .06, 'square', .03, .03); },
    buzz(){ tone(80, .5, 'sawtooth', .09); tone(83, .5, 'sawtooth', .07); },
    good(){ tone(523, .25, 'triangle', .06); tone(784, .4, 'triangle', .06, .14); },
    tick(){ tone(1000, .05, 'square', .015); },
    deny(){ tone(220, .12, 'square', .04); tone(160, .18, 'square', .04, .1); },
  };
})();

// ---------- 화면 전환 ----------
function show(id){ document.querySelectorAll('.screen').forEach(s => s.classList.toggle('hidden', s.id !== id)); }

// 타이틀
$('mSound').onclick = () => { $('mSound').textContent = '소리: ' + (SFX.toggle() ? '켜짐' : '꺼짐'); };
$('mStart').onclick = () => { SFX.init(); SFX.hum(); SFX.click(); briefing(); };

const BRIEF = `한빛시가 대피소용 비상전원장치 200대 구매를 요청했다.
입찰 업체는 윤슬파워, 영래에너지, 주혁볼트.
그런데 기준 미달인 <b>주혁볼트</b>가 낙찰 예정이다.

"한빛시 검토자료 <b>EV-2417</b>이 업체로 새어 나갔다"는 신고가 들어왔고,
한빛시가 그날 밤 CCTV와 관련 문서를 보내왔다.

계약 승인 회의는 <b>09:00</b>. 남은 시간은 <b>20분</b>.
서류와 CCTV 장면을 짝지어 의심 정황 3건을 보고하라.
정상 업무를 의심하면 30초를 잃는다.

<small>조작: CCTV 화면을 눌러 크게 보고 [캡처] / 서류는 끌어서 아래 패드로
패드에서 캡처 1장 + 서류 1장을 골라 빨간 버튼</small>`;

let typer;
function typeOut(el, str, speed, done){
  clearInterval(typer); let i = 0, fin = false;
  const end = () => { if (fin) return; fin = true; clearInterval(typer); el.innerHTML = str; done && done(); };
  typer = setInterval(() => {
    if (str[i] === '<') i = str.indexOf('>', i) + 1; else i++;
    el.innerHTML = str.slice(0, i); if (i % 3 === 0) SFX.tick();
    if (i >= str.length) end();
  }, speed);
  return end;
}
function briefing(){
  show('brief'); $('briefGo').classList.add('hidden');
  const skip = typeOut($('briefText'), BRIEF, 22, () => $('briefGo').classList.remove('hidden'));
  $('brief').onclick = e => { if (e.target.id !== 'briefGo') skip(); };
  $('briefGo').onclick = () => { SFX.click(); timeCard(); };
}
function timeCard(){
  show('card'); SFX.static(.5, .1);
  document.querySelectorAll('#card div:not(.noise)').forEach(d => { d.classList.remove('fadeIn'); void d.offsetWidth; d.classList.add('fadeIn'); });
  setTimeout(() => { SFX.static(.3); startGame(); }, 2800);
}

// ---------- 게임 상태 ----------
let S, timer;
function startGame(){
  S = {t:TOTAL, clues:{}, cctv:[], docs:[], selC:null, selD:null, unlocked:new Set(), wrong:{},
       time:TIMES[0], cam:null, zoom:false, view:{type:'desktop'}, hist:[], over:false};
  show('game'); renderAll();
  clearInterval(timer); timer = setInterval(tick, 1000);
}
const p2 = n => String(n).padStart(2, '0');
const TOTAL = 20 * 60; // 제한 시간(초). 회의는 09:00, 시작 시각은 거기서 역산
function tick(){
  if (S.over) return;
  S.t--; renderClock();
  if (S.t <= 30 && S.t > 0) SFX.tick();
  if (S.t === 300) { SFX.deny(); msg('08:55 AM', '회의까지 5분 남았습니다.', 'bad', 2400); }
  if (S.t === 60) { SFX.deny(); msg('08:59 AM', '회의까지 1분.', 'bad', 2400); }
  document.querySelectorAll('.feed .ts').forEach(e => { const n = (+e.dataset.s + 1) % 60; e.dataset.s = n; e.textContent = `D-1 ${S.time}:${p2(n)}`; });
  if (S.t <= 0) ending('timeout');
}
function penalty(){
  S.t = Math.max(0, S.t - 30); renderClock(); SFX.buzz();
  const g = $('game'), r = $('redflash');
  g.classList.remove('shake'); void g.offsetWidth; g.classList.add('shake');
  r.classList.add('on'); setTimeout(() => r.classList.remove('on'), 60);
  if (S.t <= 0) ending('timeout');
}
function renderClock(){
  const s = 9 * 3600 - S.t; // 09:00까지 남은 초 → 현재 시각
  $('clock').textContent = `${p2(Math.floor(s / 3600))}:${p2(Math.floor(s / 60) % 60)} AM`;
  $('remain').textContent = `남은 시간 ${p2(Math.floor(S.t / 60))}:${p2(S.t % 60)}`;
  $('remain').classList.toggle('low', S.t <= 60); $('clock').classList.toggle('low', S.t <= 60);
}

// ---------- 메시지/모달 ----------
let msgT;
function msg(big, small = '', cls = '', dur = 2600){
  const m = $('msg'); m.innerHTML = (big ? `<big>${big}</big>` : '') + small; m.className = 'show ' + cls;
  clearTimeout(msgT); msgT = setTimeout(() => m.className = '', dur);
}
function modal(html, cls = ''){ $('box').className = cls; $('box').innerHTML = html; $('ov').classList.remove('hidden'); }
function closeModal(){ $('ov').classList.add('hidden'); }
addEventListener('keydown', e => { if (e.key === 'Escape' && !$('ov').classList.contains('hidden')) closeModal(); });

function askPw(key, pw, hint, ok){
  modal(`<h2>잠긴 항목</h2><p>비밀번호 4자리를 입력하세요.</p>
    <input id="pw" maxlength="4" inputmode="numeric" autocomplete="off">
    <div id="pwMsg"></div>
    <div class="row"><button class="btn" id="pwC">취소</button><button class="btn hot" id="pwO">확인</button></div>`);
  const inp = $('pw'); inp.focus();
  const submit = () => {
    if (inp.value === pw){ S.unlocked.add(key); closeModal(); SFX.good(); msg('잠금 해제', '', 'ok', 1200); ok(); return; }
    S.wrong[key] = (S.wrong[key] || 0) + 1; SFX.deny();
    $('pwMsg').textContent = S.wrong[key] >= 3 ? `힌트: ${hint}` : `비밀번호가 틀렸습니다. (${S.wrong[key]}회)`;
    inp.value = ''; inp.focus();
  };
  $('pwO').onclick = submit; $('pwC').onclick = closeModal;
  inp.onkeydown = e => { if (e.key === 'Enter') submit(); };
}

// ---------- 모니터 1: 문서 ----------
function go(view){ SFX.click(); S.hist.push(S.view); S.view = view; renderLeft(); }
function back(){ SFX.click(); S.view = S.hist.pop() || {type:'desktop'}; renderLeft(); }
const isLocked = d => d.lock && !S.unlocked.has(d.id);
const fLocked = f => f.lock && !S.unlocked.has(f.id);

function openFolder(f){ if (fLocked(f)) return askPw(f.id, f.lock, f.hint, () => go({type:'folder', id:f.id})); go({type:'folder', id:f.id}); }
function openDoc(d){ if (isLocked(d)) return askPw(d.id, d.lock, d.hint, () => go({type:'doc', id:d.id})); go({type:'doc', id:d.id}); }

function renderLeft(){
  const v = S.view, bar = $('lbar'), body = $('left');
  const bk = v.type === 'desktop' ? '' : '<button class="btn" id="bk">◀ 뒤로</button>';
  body.scrollTop = 0;
  if (v.type === 'desktop'){
    bar.innerHTML = 'C:\\바탕화면';
    const deco = [['globe','크롬'],['pc','내 PC'],['trash','휴지통'],['gear','제어판']];
    body.innerHTML = `<div class="icons">${deco.map(([i, n]) => `<div class="icon deco"><img src="${ICON[i]}">${n}</div>`).join('')}
      <div class="icon" id="root"><img src="${ICON.folder}">한빛시 제출자료</div></div>`;
    body.querySelectorAll('.deco').forEach(e => e.onclick = () => { SFX.deny(); msg('', '조사와 관련 없는 항목입니다.', '', 1400); });
    $('root').onclick = () => go({type:'root'});
  } else if (v.type === 'root'){
    bar.innerHTML = `${bk} C:\\한빛시 제출자료`;
    body.innerHTML = `<div class="icons">${FOLDERS.map(f => `<div class="icon" data-f="${f.id}"><img src="${fLocked(f) ? ICON.lock : ICON.folder}">${f.id}_${f.name}</div>`).join('')}</div>`;
    body.querySelectorAll('[data-f]').forEach(e => e.onclick = () => openFolder(FOLDERS.find(f => f.id === e.dataset.f)));
  } else if (v.type === 'folder'){
    const f = FOLDERS.find(f => f.id === v.id);
    bar.innerHTML = `${bk} C:\\한빛시 제출자료\\${f.id}_${f.name}`;
    body.innerHTML = `<div class="list">${f.docs.map(d => `<div class="file" draggable="${!isLocked(d)}" data-d="${d.id}"><img src="${ICON.file}">${d.name}<span class="tag ${isLocked(d) ? 'lock' : ''}">${isLocked(d) ? '[잠김]' : S.docs.includes(d.id) ? '[패드에 있음]' : '끌어서 패드로'}</span></div>`).join('')}</div>`;
    body.querySelectorAll('[data-d]').forEach(e => {
      e.onclick = () => openDoc(DOCS[e.dataset.d]);
      e.ondragstart = ev => ev.dataTransfer.setData('text/plain', e.dataset.d);
    });
  } else {
    const d = DOCS[v.id];
    bar.innerHTML = `${bk} ${d.name}<span class="sp"></span><button class="btn hot" id="addDoc" draggable="true">패드에 담기 ▼</button>`;
    body.innerHTML = `<div class="paper">${d.body}</div>`;
    $('addDoc').onclick = () => addDoc(d.id);
    $('addDoc').ondragstart = ev => ev.dataTransfer.setData('text/plain', d.id);
  }
  if ($('bk')) $('bk').onclick = back;
}

// ---------- 모니터 2: CCTV ----------
const secs = cam => p2(parseInt(cam) * 13 % 60);
function feed(cam, big){
  const k = `${cam}-${S.time}`;
  const zoom = big && S.zoom ? `<img class="zoomImg" src="${CCTV.zoom(k)}"><span class="zoomTag">확대</span>` : '';
  return `<div class="feed ${big ? 'big' : ''}" data-c="${cam}"><img src="${CCTV.scene(cam, S.time)}">${zoom}<div class="noise"></div>
    <span class="lbl">CAM ${cam}</span><span class="ts" data-s="${+secs(cam)}">D-1 ${S.time}:${secs(cam)}</span><span class="loc">${CAMS[cam]}</span><span class="rec">REC</span></div>`;
}
function staticFx(){ const r = $('right'); SFX.static(); r.classList.add('static'); setTimeout(() => r.classList.remove('static'), 220); }
function renderRight(){
  const tape = `<div class="tape">${TIMES.map(t => `<button data-t="${t}" class="${t === S.time ? 'on' : ''}">${t}</button>`).join('')}</div>`;
  const body = $('right');
  if (!S.cam){
    $('rbar').innerHTML = `녹화 ◀◀ ${tape}<span class="sp"></span><span class="tip">화면을 눌러 크게</span>`;
    body.innerHTML = `<div class="grid4">${Object.keys(CAMS).map(c => feed(c, false)).join('')}</div>`;
    body.querySelectorAll('[data-c]').forEach(e => e.onclick = () => { S.cam = e.dataset.c; S.zoom = false; staticFx(); renderRight(); });
  } else {
    const k = `${S.cam}-${S.time}`, z = CCTV.hasZoom(k);
    $('rbar').innerHTML = `<button class="btn" id="cBack">◀ 4분할</button> ${tape}<span class="sp"></span>
      <button class="btn" id="cZoom" ${z ? '' : 'disabled'}>${S.zoom ? '확대 해제' : '확대'}</button><button class="btn hot" id="cCap">캡처</button>`;
    body.innerHTML = feed(S.cam, true) + `<div class="note2">${SCENE_NOTE[k] ? '관찰: ' + SCENE_NOTE[k] : ''}</div>`;
    $('cBack').onclick = () => { S.cam = null; S.zoom = false; staticFx(); renderRight(); };
    $('cZoom').onclick = () => { S.zoom = !S.zoom; SFX.click(); renderRight(); };
    $('cCap').onclick = capture;
  }
  $('rbar').querySelectorAll('[data-t]').forEach(b => b.onclick = () => { if (b.dataset.t === S.time) return; S.time = b.dataset.t; S.zoom = false; staticFx(); renderRight(); });
}

// ---------- 증거수집 패드 ----------
function capture(){
  const k = `${S.cam}-${S.time}`;
  if (S.cctv.includes(k)) return msg('', '이미 캡처한 장면입니다.', '', 1400);
  SFX.shutter(); S.cctv.push(k);
  const f = $('right').querySelector('.feed'); f.style.filter = 'brightness(3)'; setTimeout(() => f.style.filter = '', 90);
  renderPad();
}
function addDoc(id){
  const d = DOCS[id];
  if (!d) return;
  if (isLocked(d)){ SFX.deny(); return msg('', '잠긴 서류는 비밀번호를 풀어야 담을 수 있습니다.', 'bad', 1800); }
  if (S.docs.includes(id)) return msg('', '이미 패드에 있는 서류입니다.', '', 1400);
  SFX.click(); S.docs.push(id); renderPad(); if (S.view.type === 'folder') renderLeft();
}
const solved = () => Object.entries(PAIRS).filter(([, v]) => S.clues[v.c]).map(([k]) => k.split('|'));
function renderPad(){
  const sv = solved(), dC = sv.map(x => x[0]), dD = sv.map(x => x[1]);
  $('padCctv').innerHTML = S.cctv.length ? S.cctv.map(k => `<div class="card cc ${S.selC === k ? 'sel' : ''} ${dC.includes(k) ? 'done' : ''}" data-k="${k}">
      <img src="${CCTV.scene(...k.split('-'))}"><span>CAM${k.replace('-', ' ')}</span><span class="x" data-x="1">×</span></div>`).join('')
    : '<span class="empty">CCTV 화면을 크게 열고 [캡처]</span>';
  $('padDoc').innerHTML = S.docs.length ? S.docs.map(id => `<div class="card dc ${S.selD === id ? 'sel' : ''} ${dD.includes(id) ? 'done' : ''}" data-k="${id}">
      ${DOCS[id].name}<span class="x" data-x="1">×</span></div>`).join('')
    : '<span class="empty">서류를 끌어다 놓거나 [패드에 담기]</span>';
  const wire = (el, list, selKey) => el.querySelectorAll('.card').forEach(e => e.onclick = ev => {
    const k = e.dataset.k; SFX.click();
    if (ev.target.dataset.x){ S[list] = S[list].filter(x => x !== k); if (S[selKey] === k) S[selKey] = null; }
    else S[selKey] = S[selKey] === k ? null : k;
    renderPad(); if (list === 'docs' && S.view.type === 'folder') renderLeft();
  });
  wire($('padCctv'), 'cctv', 'selC'); wire($('padDoc'), 'docs', 'selD');
  $('accuseBtn').disabled = !(S.selC && S.selD);
  $('selInfo').innerHTML = S.selC && S.selD ? `CAM ${S.selC.replace('-', ' · ')}<br>+ ${DOCS[S.selD].name}` : '캡처 1장 + 서류 1장';
}
function accuse(){
  const k = `${S.selC}|${S.selD}`, p = PAIRS[k];
  if (p){
    if (S.clues[p.c]) msg('', '이미 해결한 단서입니다.', '', 1400);
    else { S.clues[p.c] = true; SFX.good();
      if (Object.keys(S.clues).length === 3) msg(`단서 ${p.c} 확보`, p.m + '<br><br>모든 단서를 찾았습니다. 오른쪽 위 [조사 보고서]를 작성하세요.', 'ok', 4500);
      else msg(`단서 ${p.c} 확보`, p.m, 'ok', 3200); }
  } else if (TRAPS[k]){ msg('판단 오류 −30초', TRAPS[k], 'bad', 3200); penalty(); }
  else { SFX.deny(); msg('', '사건과의 관련성이 부족합니다.', '', 1800); }
  S.selC = S.selD = null;
  renderPad(); renderClues();
}
function renderClues(){
  $('clues').innerHTML = [1, 2, 3].map(i => `<div class="clue ${S.clues[i] ? 'on' : ''}">단서 ${i} ${S.clues[i] ? CLUES[i] : '? ? ?'}</div>`).join('');
  $('reportBtn').disabled = Object.keys(S.clues).length < 3;
}

// ---------- 보고서 / 엔딩 ----------
function report(){
  SFX.click();
  modal(`<h2>조사 보고서</h2>
  <p>확인된 정황<br>1. 대외비 검토자료 무단 반출<br>2. 평가 결과 무단 수정 (PARK_DH)<br>3. 낙찰 예정 업체 직원에게 자료 전달</p>
  <p><b>조치 (하나를 고르시오)</b></p>
  <button class="choice" data-c="A">예정대로 계약을 승인한다</button>
  <button class="choice" data-c="B">계약을 보류하고 재심사하며, 관계 기관에 알린다</button>
  <button class="choice" data-c="C">관련자를 즉시 처벌한다</button>
  <div class="row"><button class="btn" id="rC">닫기</button></div>`, 'form');
  $('box').querySelectorAll('[data-c]').forEach(b => b.onclick = () => {
    const c = b.dataset.c;
    if (c === 'A'){ closeModal(); ending('fail'); }
    else if (c === 'B'){ closeModal(); ending('success'); }
    else { msg('권한 없음 −30초', '조사관은 조치를 건의할 수 있을 뿐, 처벌을 직접 결정할 수 없습니다.', 'bad', 3200); penalty(); }
  });
  $('rC').onclick = closeModal;
}
function ending(type){
  if (S.over) return;
  S.over = true; clearInterval(timer); closeModal();
  const E = {
    fail:['03:00 AM', '계약은 예정대로 승인되었다.\n몇 주 뒤 집중호우. 정전 5시간 30분째.\n대피소의 조명이 하나둘 꺼지기 시작한다.'],
    timeout:['09:00 AM', '조사를 끝내지 못한 채 회의가 시작되었고, 계약은 그대로 승인되었다.\n몇 주 뒤 새벽 3시, 대피소의 조명이 꺼진다.'],
  }[type];
  show('ending'); SFX.static(.6, .1);
  const img = $('endImg'), rain = $('rain'), again = $('again');
  again.classList.add('hidden'); $('endWin').classList.add('hidden'); $('endBig').textContent = ''; $('endBody').textContent = '';
  $('ending').querySelector('.endText').classList.toggle('long', type === 'success');
  $('ending').onclick = null;
  img.src = CCTV.shelter(true); img.style.opacity = ''; rain.classList.remove('hidden');
  if (type === 'success') return successEnding(img, rain, again);
  again.textContent = '다시 조사하기';
  const writeText = () => { $('endBig').textContent = E[0];
    typeOut($('endBody'), E[1].replace(/\n/g, '<br>'), 35, () => again.classList.remove('hidden')); };
  // 실패: 조명이 깜빡이다 꺼진다
  const seq = [500, 120, 90, 300, 80, 60, 700];
  let i = 0, t = 600;
  seq.forEach(d => { t += d; setTimeout(() => { i++; img.src = CCTV.shelter(i % 2 === 0); SFX.static(.05, .05); }, t); });
  setTimeout(() => { img.src = CCTV.shelter(false); SFX.buzz(); writeText(); }, t + 400);
}
// 성공 엔딩: 문단을 하나씩 찍고, 폭우 문단에서 불 켜진 대피소가 드러난다. 화면을 누르면 지금 문단을 바로 다 보여 준다.
const SUCCESS = [
  '계약은 보류되었고, 재심사가 시작되었다.\n사건은 감사부서와 수사기관으로 넘어갔다.',
  '재심사 결과, 주혁볼트의 낙찰 예정은 취소되었다.\n모든 기준을 충족한 윤슬파워가 새로 선정되었다.',
  '주혁볼트는 부정당업자로 지정되어\n공공입찰 참가가 제한되었다.\n김현우는 입찰방해 혐의로 수사를 받게 되었다.',
  '박도현은 직위에서 물러나 징계와 수사를 받게 되었다.',
  '대피소마다 기준에 맞는 비상전원장치 200대가 놓였다.',
  '몇 주 뒤, 기록적인 폭우로 도시 전체가 정전되었다.\n9시간이 지나도, 대피소의 불은 꺼지지 않았다.',
  '당신의 판단은 공정한 계약을 지켰고,\n재난 속 시민들의 불편을 최소화했습니다.',
];
function successEnding(img, rain, again){
  img.style.opacity = 0; rain.classList.add('hidden'); SFX.good();
  $('endBig').textContent = '계약 보류';
  let i = 0, skip;
  const next = () => {
    if (i >= SUCCESS.length){ $('endWin').classList.remove('hidden'); SFX.good();
      again.textContent = '게임 끝내기'; setTimeout(() => again.classList.remove('hidden'), 900); return; }
    if (i === 5){ img.style.opacity = ''; rain.classList.remove('hidden'); }   // 폭우 문단: 불 켜진 대피소
    const p = document.createElement('p'); if (i === SUCCESS.length - 1) p.className = 'verdict';
    $('endBody').appendChild(p);
    skip = typeOut(p, SUCCESS[i++].replace(/\n/g, '<br>'), 28, () => setTimeout(next, 500));
  };
  setTimeout(next, 900);
  $('ending').onclick = e => { if (e.target !== again && skip) skip(); };
}
$('again').onclick = () => { SFX.click(); show('title'); };

// ---------- 연결 ----------
function renderAll(){ renderClock(); renderClues(); renderLeft(); renderRight(); renderPad(); }
$('accuseBtn').onclick = accuse;
$('reportBtn').onclick = report;
const pad = $('pad');
pad.ondragover = e => { e.preventDefault(); pad.classList.add('over'); };
pad.ondragleave = () => pad.classList.remove('over');
pad.ondrop = e => { e.preventDefault(); pad.classList.remove('over'); addDoc(e.dataTransfer.getData('text/plain')); };

// 폰트가 로드된 뒤에 CCTV를 그려야 확대 화면 글자가 제대로 나온다
Promise.all(['12px Galmuri11', '12px Galmuri11B'].map(f => document.fonts.load(f))).then(() => { $('titleCam').src = CCTV.scene('01', '22:05'); });
