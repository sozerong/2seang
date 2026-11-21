// 게임 시작 전 대화 (조사팀장 브리핑). 아래 대화창 + 그 위에 팀장 캐릭터.
// 줄 종류: {who, face, text} 대사 / {choice:[①, ②]} 내 선택지 / {narr, fx} 연출 / {cap} 화면 위 자막 / {easy:true} 쉬움 모드에서만
const FACE = { 진지: 'serious', 다급: 'urgent', 걱정: 'worried', 굳음: 'frozen', 기본: 'smile', 미소: 'smile' };
const STORY = [
  // 장면 1. 아침, 다급한 호출
  {cap: 'D-day 08:49 · 공정조달조사팀 사무실'},
  {who: '팀장', face: '다급', text: '왔구나. 급한 건이 하나 터졌어.'},
  {who: '팀장', face: '진지', text: '한빛시가 대피소용 비상전원장치 200대를 우리 조달청에 요청했던 거 알지?'},
  {choice: ['네, 입찰 공고 나갔던 건이죠.', '비상전원장치요?']},
  {who: '팀장', face: '걱정', text: '작년 집중호우 때 한빛시가 6시간 동안 정전됐던 거 기억하지? 몇몇 대피소는 비상전원이 먼저 바닥나서 불이 꺼졌어.'},
  {who: '팀장', face: '걱정', text: '깜깜한 데서 계단을 내려가다 넘어져 다친 어르신이 있었고, 아이들은 밤새 울었대.'},
  {who: '팀장', face: '굳음', text: '휴대전화도 충전을 못 해서, 가족과 연락이 끊긴 사람들은 빗속으로 찾으러 나가기까지 했고.'},
  {who: '팀장', face: '진지', text: '그래서 이번엔 "8시간 이상 전기를 버틸 것"이 필수 조건이야. 못 맞추면 무조건 탈락.'},
  // 장면 2. 이상한 낙찰
  {who: '팀장', face: '기본', text: '입찰엔 네 곳이 들어왔어. 태림에너지, 서영파워, 영래에너지, 그리고 주혁볼트.'},
  {narr: '서류 넘기는 소리.', fx: 'doc'},
  {who: '팀장', face: '굳음', text: '그런데 낙찰 예정 업체가 주혁볼트야.'},
  {choice: ['주혁볼트가 왜요?', '뭐가 문제인데요?']},
  {who: '팀장', face: '굳음', text: '주혁볼트 장치는 5시간 30분밖에 못 버텨. 안전성 검증자료도 일부 안 냈고. 원래는 기준 미달이야.'},
  {who: '팀장', face: '진지', text: '그런데 오늘 올라온 계약검토보고서엔 네 곳 모두 "적합"이라고 적혀 있어.'},
  // 장면 3. 익명 신고
  {narr: '띵. 메신저 알림음. 팀장이 모니터를 돌려 보여 준다.', fx: 'ding'},
  {who: '팀장', face: '진지', text: '그리고 어젯밤 익명 신고가 들어왔어.'},
  {who: '팀장', face: '진지', text: '"한빛시 검토자료 EV-2417이 업체 쪽으로 새어 나갔다."'},
  {choice: ['EV-2417이 뭔데요?', '업체라면… 설마 주혁볼트요?']},
  {who: '팀장', face: '기본', text: 'EV-2417은 한빛시가 만든 규격 적합성 검토서 번호야. 업체마다 적합인지 부적합인지 판정해 둔 문서지.'},
  {who: '팀장', face: '걱정', text: '그게 주혁볼트 업체로 새어 나가고, 하룻밤 사이에 판정이 바뀌었다면… 그냥 넘어갈 일이 아니지.'},
  {who: '팀장', face: '기본', text: '그래서 한빛시에 자료를 요청했고, 그날 밤 CCTV랑 관련 문서가 방금 도착했어.'},
  // 장면 4. 남은 시간 10분
  {narr: '시계 초침 소리. 벽시계가 08:50을 가리킨다.', fx: 'clock', cap: 'D-day 08:50'},
  {who: '팀장', face: '다급', text: '문제는 시간이야. 계약 승인 회의가 09:00야. 남은 시간은 딱 10분.'},
  {choice: ['10분이요?!', '회의를 미룰 수는 없나요?']},
  {who: '팀장', face: '굳음', text: '증거 없이는 못 미뤄. 회의에서 승인되면 그 장치 200대가 그대로 대피소 12곳에 들어가.'},
  {who: '팀장', face: '걱정', text: '최대 2,400명이 머물 곳이야. 정전되고 주혁볼트의 비상전원장치가 작동된다면 5시간 30분 뒤엔 다 깜깜해지겠지.'},
  // 장면 5. 해야 할 일
  {who: '팀장', face: '진지', text: '그러니까 네가 할 일은 이거야. 의심 정황 3건을 찾아서 나한테 보고해 줘.'},
  {who: '팀장', face: '기본', text: '방법은 간단해. 시간대별로 CCTV에서 수상한 장면을 캡처하고, 그 장면을 뒷받침하는 서류 한 장을 짝지어서 올리면 돼. 둘이 딱 맞아야 증거가 되는 거야.'},
  {who: '팀장', face: '굳음', text: '조심할 것도 있어. 그날 밤 한빛시청엔 승인받고 정상적으로 일한 사람들도 있었거든.'},
  {who: '팀장', face: '굳음', text: '정상 업무를 의심하면 30초가 깎여. 확실할 때만 보고해.'},
  {who: '팀장', face: '기본', text: '잠긴 폴더도 있을 거야. 비밀번호는 다른 서류나 CCTV 속에 숨어 있을 테니 잘 살펴봐.'},
  // 장면 6. 출발
  {choice: ['어디서부터 보면 될까요?', '알겠습니다. 바로 시작할게요.']},
  {who: '팀장', face: '미소', text: '신고접수 폴더부터 열어 봐. 한빛시가 보낸 회신이 들어 있어.'},
  {who: '팀장', face: '미소', text: '막히면 바탕화면 [메신저]로 연락해. 힌트 줄게.', easy: true},
  {who: '팀장', face: '진지', text: '대피소 불이 켜져 있을지는 네 손에 달렸어. 부탁한다.'},
];

const Story = (() => {
  let lines, i, skipType, typing, done;
  const el = id => document.getElementById(id);

  function start(onDone){
    done = onDone; lines = STORY.filter(l => !l.easy || MODE === 'easy'); i = -1;
    el('stCap').textContent = ''; el('stDoc').classList.add('hidden'); el('stChar').classList.add('hidden');
    show('story'); next();
  }
  function finish(){ clearInterval(typer); typing = false; SFX.click(); done(); }

  function say(name, text, cls = ''){
    el('stName').textContent = name; el('stName').classList.toggle('hidden', !name);
    el('stBox').className = cls; el('stChoices').innerHTML = ''; el('stNext').classList.add('hidden');
    typing = true;
    skipType = typeOut(el('stText'), text, 26, () => { typing = false; el('stNext').classList.remove('hidden'); });
  }

  function next(){
    if (typing) return skipType();                                       // 글자가 찍히는 중이면 한 번에 다 보여 주기
    if (el('stChoices').childElementCount) return;                         // 선택지는 버튼으로만 넘어감
    i++;
    if (i >= lines.length) return finish();
    const l = lines[i];
    if (l.cap !== undefined) el('stCap').textContent = l.cap;
    if (l.cap !== undefined && !l.who && !l.narr && !l.choice) return next(); // 자막만 있는 줄
    el('stDoc').classList.toggle('hidden', l.fx !== 'doc');
    if (l.who){
      const c = el('stChar'); c.src = `img/chief-${FACE[l.face] || 'smile'}.webp`; c.classList.remove('hidden', 'dim');
      c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
      say(l.who, l.text);
    } else if (l.narr){
      el('stChar').classList.add('dim');
      if (l.fx === 'ding') SFX.good();
      if (l.fx === 'doc') SFX.static(.15, .05);
      if (l.fx === 'clock') [0, 1, 2, 3].forEach(k => setTimeout(SFX.tick, k * 450));
      say('', l.narr, 'narr');
    } else if (l.choice){
      el('stName').textContent = '나'; el('stName').classList.remove('hidden');
      el('stBox').className = 'choose'; el('stText').textContent = ''; el('stNext').classList.add('hidden');
      el('stChoices').innerHTML = l.choice.map((t, k) => `<button class="stOpt" data-k="${k}">${'①②'[k]} ${t}</button>`).join('');
      el('stChoices').querySelectorAll('button').forEach(b => b.onclick = e => {
        e.stopPropagation(); SFX.click(); el('stChoices').innerHTML = '';
        say('나', l.choice[+b.dataset.k], 'me');                          // 고른 말을 내 대사로 보여 주고, 다음 클릭에 이어감
      });
    }
  }

  el('story').onclick = e => { if (!e.target.closest('#stSkip')) next(); };
  el('stSkip').onclick = e => { e.stopPropagation(); finish(); };
  addEventListener('keydown', e => {
    if (el('story').classList.contains('hidden')) return;
    if (e.key === ' ' || e.key === 'Enter'){ e.preventDefault(); next(); }
    if (e.key === 'Escape') finish();
  });
  return { start };
})();
