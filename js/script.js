(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const GROUND_Y = H - 60;
  const GRAVITY = 0.85;
  const MOVE_SPEED = 4.2;
  const JUMP_FORCE = -15;

  const menuOverlay = document.getElementById('menu-overlay');
  const endOverlay = document.getElementById('end-overlay');
  const endTitle = document.getElementById('end-title');
  const endSub = document.getElementById('end-sub');
  const roundBanner = document.getElementById('round-banner');
  const timerEl = document.getElementById('timer');

  const els = {
    p1health: document.getElementById('p1-health'),
    p2health: document.getElementById('p2-health'),
    p1hpnum: document.getElementById('p1-hp-num'),
    p2hpnum: document.getElementById('p2-hp-num'),
    p1rounds: document.getElementById('p1-rounds'),
    p2rounds: document.getElementById('p2-rounds'),
  };

  // build round pips (best of 3 -> 2 pips each)
  for (let i = 0; i < 2; i++) {
    const a = document.createElement('div'); a.className = 'pip'; els.p1rounds.appendChild(a);
    const b = document.createElement('div'); b.className = 'pip'; els.p2rounds.appendChild(b);
  }

  const keys = {};
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });

  function makeFighter(opts) {
    return {
      ...opts,
      w: 46, h: 96,
      vx: 0, vy: 0,
      onGround: true,
      facing: opts.facing,
      hp: 100,
      wins: 0,
      state: 'idle',      // idle, walk, jump, block, punch, kick, hit, ko
      attackTimer: 0,
      attackType: null,
      hitLanded: false,
      hitstun: 0,
      cooldown: 0,
      color: opts.color,
      colorDim: opts.colorDim,
      aiTimer: 0,
    };
  }

  let p1, p2, mode, running, paused, roundTime, roundActive, matchOver;

  function resetFighters() {
    p1 = makeFighter({ x: 220, y: GROUND_Y - 96, facing: 1, color: getVar('--p1'), colorDim: getVar('--p1-dim') });
    p2 = makeFighter({ x: 630, y: GROUND_Y - 96, facing: -1, color: getVar('--p2'), colorDim: getVar('--p2-dim') });
    p1.wins = 0; p2.wins = 0;
    updateRoundPips();
  }

  function resetRoundPositions() {
    p1.x = 220; p1.y = GROUND_Y - 96; p1.vx = 0; p1.vy = 0; p1.hp = 100; p1.state = 'idle'; p1.hitstun = 0; p1.attackTimer = 0; p1.cooldown = 0;
    p2.x = 630; p2.y = GROUND_Y - 96; p2.vx = 0; p2.vy = 0; p2.hp = 100; p2.state = 'idle'; p2.hitstun = 0; p2.attackTimer = 0; p2.cooldown = 0;
    roundTime = 60;
    roundActive = false;
    updateHealthBars();
  }

  function getVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function updateHealthBars() {
    els.p1health.style.width = Math.max(0, p1.hp) + '%';
    els.p2health.style.width = Math.max(0, p2.hp) + '%';
    els.p1hpnum.textContent = Math.max(0, Math.round(p1.hp));
    els.p2hpnum.textContent = Math.max(0, Math.round(p2.hp));
  }

  function updateRoundPips() {
    [...els.p1rounds.children].forEach((pip, i) => pip.classList.toggle('won', i < p1.wins));
    [...els.p2rounds.children].forEach((pip, i) => pip.classList.toggle('won', i < p2.wins));
  }

  function showBanner(text, ms) {
    roundBanner.textContent = text;
    roundBanner.classList.add('show');
    setTimeout(() => roundBanner.classList.remove('show'), ms || 900);
  }

  // ---------- Input handling per player ----------
  function handleInput(f, opp, scheme) {
    if (f.hitstun > 0 || f.state === 'ko') return;

    const left = keys[scheme.left];
    const right = keys[scheme.right];
    const up = keys[scheme.up];
    const down = keys[scheme.down];
    const punch = keys[scheme.punch];
    const kick = keys[scheme.kick];

    // face opponent automatically when not attacking
    if (f.attackTimer <= 0) {
      f.facing = (opp.x > f.x) ? 1 : -1;
    }

    const attacking = f.attackTimer > 0;
    const blocking = down && f.onGround && !attacking;

    f.state = blocking ? 'block' : f.state;

    if (!attacking && !blocking) {
      if (left) { f.vx = -MOVE_SPEED; f.state = 'walk'; }
      else if (right) { f.vx = MOVE_SPEED; f.state = 'walk'; }
      else { f.vx = 0; if (f.onGround) f.state = 'idle'; }

      if (up && f.onGround) {
        f.vy = JUMP_FORCE;
        f.onGround = false;
      }
    } else if (!attacking) {
      f.vx = 0;
    }

    if (!f.onGround) f.state = 'jump';

    if (f.cooldown <= 0 && !attacking && f.onGround) {
      if (punch) startAttack(f, 'punch');
      else if (kick) startAttack(f, 'kick');
    }
  }

  function startAttack(f, type) {
    f.attackType = type;
    f.attackTimer = type === 'punch' ? 18 : 26;
    f.state = type;
    f.hitLanded = false;
    f.cooldown = type === 'punch' ? 24 : 34;
  }

  // ---------- Simple AI ----------
  function handleAI(f, opp) {
    if (f.hitstun > 0 || f.state === 'ko') return;
    f.facing = (opp.x > f.x) ? 1 : -1;
    const dist = Math.abs(opp.x - f.x);
    const attacking = f.attackTimer > 0;

    f.aiTimer -= 1;

    if (!attacking) {
      if (dist > 90) {
        f.vx = f.facing * MOVE_SPEED * 0.85;
        f.state = 'walk';
      } else if (dist < 55) {
        f.vx = -f.facing * MOVE_SPEED * 0.5;
        f.state = 'walk';
      } else {
        f.vx = 0;
        if (f.onGround) f.state = 'idle';
      }

      // occasional block
      if (opp.attackTimer > 0 && dist < 80 && Math.random() < 0.06) {
        f.state = 'block';
        f.vx = 0;
      }

      if (dist < 75 && f.cooldown <= 0 && f.onGround && f.aiTimer <= 0) {
        if (Math.random() < 0.55) startAttack(f, 'punch');
        else startAttack(f, 'kick');
        f.aiTimer = 40 + Math.random() * 40;
      }

      if (dist < 40 && Math.random() < 0.01 && f.onGround) {
        f.vy = JUMP_FORCE * 0.8;
        f.onGround = false;
      }
    } else {
      f.vx = 0;
    }
    if (!f.onGround) f.state = 'jump';
  }

  // ---------- Physics ----------
  function physics(f) {
    if (f.attackTimer > 0) f.attackTimer--;
    if (f.cooldown > 0) f.cooldown--;
    if (f.hitstun > 0) { f.hitstun--; f.vx *= 0.85; }

    f.x += f.vx;
    f.vy += GRAVITY;
    f.y += f.vy;

    if (f.y >= GROUND_Y - f.h) {
      f.y = GROUND_Y - f.h;
      f.vy = 0;
      f.onGround = true;
    } else {
      f.onGround = false;
    }

    f.x = Math.max(20, Math.min(W - 20 - f.w, f.x));

    if (f.attackTimer <= 0 && f.state !== 'block' && f.hitstun <= 0 && f.onGround) {
      f.state = Math.abs(f.vx) > 0.3 ? 'walk' : 'idle';
    }
  }

  function getHitbox(f) {
    // active punch/kick window
    const type = f.attackType;
    const total = type === 'punch' ? 18 : 26;
    const elapsed = total - f.attackTimer;
    const activeStart = type === 'punch' ? 6 : 10;
    const activeEnd = type === 'punch' ? 12 : 18;
    if (elapsed < activeStart || elapsed > activeEnd) return null;

    const range = type === 'punch' ? 34 : 46;
    const dmg = type === 'punch' ? 6 : 10;
    const cx = f.facing === 1 ? f.x + f.w : f.x - range;
    return { x: cx, y: f.y + 20, w: range, h: 40, dmg, type };
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function resolveCombat(f, opp) {
    if (f.attackTimer <= 0 || f.hitLanded) return;
    const box = getHitbox(f);
    if (!box) return;
    const oppBox = { x: opp.x, y: opp.y, w: opp.w, h: opp.h };
    if (rectsOverlap(box, oppBox)) {
      f.hitLanded = true;
      const blocked = opp.state === 'block' && ((opp.facing === -1 && f.x > opp.x) || (opp.facing === 1 && f.x < opp.x));
      let dmg = box.dmg;
      if (blocked) {
        dmg = Math.round(dmg * 0.2);
        opp.vx = f.facing * 2;
      } else {
        opp.hitstun = box.type === 'punch' ? 10 : 16;
        opp.state = 'hit';
        opp.vx = f.facing * (box.type === 'punch' ? 3 : 5);
        if (!opp.onGround) opp.vy -= 2;
      }
      opp.hp = Math.max(0, opp.hp - dmg);
      updateHealthBars();
    }
  }

  // ---------- Drawing ----------
  function drawStage() {
    // background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#1c0f2b');
    grad.addColorStop(0.6, '#150a20');
    grad.addColorStop(1, '#0a0512');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // distant skyline blocks
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let i = 0; i < 10; i++) {
      const bw = 40 + (i % 3) * 20;
      const bh = 60 + (i * 37) % 120;
      ctx.fillRect(i * 95, GROUND_Y - bh - 40, bw, bh);
    }

    // neon horizon line
    ctx.strokeStyle = 'rgba(255,45,111,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y - 40);
    ctx.lineTo(W, GROUND_Y - 40);
    ctx.stroke();

    // ground
    ctx.fillStyle = '#050208';
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    ctx.strokeStyle = 'rgba(45,224,255,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(W, GROUND_Y);
    ctx.stroke();

    // ground grid perspective lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let i = -4; i <= 20; i++) {
      ctx.beginPath();
      ctx.moveTo(W / 2 + i * 60, GROUND_Y);
      ctx.lineTo(W / 2 + i * 140, H);
      ctx.stroke();
    }
  }

  function drawFighter(f) {
    ctx.save();
    const cx = f.x + f.w / 2;
    const cy = f.y + f.h;

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(cx, GROUND_Y + 6, 26, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    const bob = f.state === 'walk' ? Math.sin(Date.now() / 90) * 3 : 0;
    const crouch = f.state === 'block' ? 8 : 0;

    ctx.translate(f.x, f.y + bob + crouch);

    const bodyColor = f.hitstun > 0 ? '#ffffff' : f.color;
    const limbColor = f.colorDim;

    // legs
    ctx.fillStyle = limbColor;
    const legOffset = f.state === 'walk' ? Math.sin(Date.now() / 90) * 8 : 0;
    ctx.fillRect(10, f.h - 34 - crouch, 10, 34 + crouch - legOffset * 0);
    ctx.fillRect(f.w - 20, f.h - 34 - crouch, 10, 34 + crouch);

    // torso
    ctx.fillStyle = bodyColor;
    const torsoH = f.h - 34 - crouch;
    ctx.fillRect(6, 20, f.w - 12, torsoH - 20);

    // head
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(f.w / 2, 12, 13, 0, Math.PI * 2);
    ctx.fill();

    // eye (facing indicator)
    ctx.fillStyle = '#0a0512';
    ctx.beginPath();
    ctx.arc(f.w / 2 + f.facing * 5, 10, 2.4, 0, Math.PI * 2);
    ctx.fill();

    // arms
    ctx.fillStyle = limbColor;
    let armExtend = 0;
    if (f.state === 'punch' || f.state === 'kick') {
      const total = f.attackType === 'punch' ? 18 : 26;
      const progress = 1 - (f.attackTimer / total);
      armExtend = Math.sin(progress * Math.PI) * 26;
    }
    if (f.state === 'block') {
      ctx.fillRect(f.facing === 1 ? f.w - 10 : -4, 16, 14, 26);
    } else {
      // back arm
      ctx.fillRect(f.facing === 1 ? 0 : f.w - 12, 22, 12, 22);
      // front arm (extends on punch)
      ctx.fillRect(
        f.facing === 1 ? f.w - 8 : 8 - armExtend,
        24,
        12 + armExtend,
        10
      );
    }

    // kick leg extension
    if (f.state === 'kick') {
      const total = 26;
      const progress = 1 - (f.attackTimer / total);
      const ext = Math.sin(progress * Math.PI) * 30;
      ctx.fillStyle = bodyColor;
      ctx.fillRect(
        f.facing === 1 ? f.w - 14 : 14 - ext,
        f.h - 30 - crouch,
        14 + ext,
        12
      );
    }

    ctx.restore();
  }

  function drawHitFlash(f) {
    if (f.hitstun > 6) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(f.x + f.w / 2, f.y + f.h / 2, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function draw() {
    drawStage();
    // draw the one further back first for a bit of depth (both same depth here, order stable)
    drawFighter(p1);
    drawFighter(p2);
    drawHitFlash(p1);
    drawHitFlash(p2);

    if (paused && running) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', W / 2, H / 2);
      ctx.font = '14px monospace';
      ctx.fillText('press P to resume', W / 2, H / 2 + 30);
      ctx.restore();
    }
  }

  // ---------- Round / match flow ----------
  let lastTime = performance.now();
  let timeAccum = 0;

  function startRound() {
    resetRoundPositions();
    roundActive = true;
    showBanner('ROUND ' + (p1.wins + p2.wins + 1), 900);
    setTimeout(() => showBanner('FIGHT!', 700), 900);
  }

  function endRound(winner) {
    roundActive = false;
    if (winner === 'p1') p1.wins++;
    else if (winner === 'p2') p2.wins++;
    updateRoundPips();

    const label = winner === 'draw' ? 'DRAW' : (winner === 'p1' ? 'CRIMSON WINS' : 'CYAN WINS');
    showBanner(label, 1400);

    if (p1.wins >= 2 || p2.wins >= 2) {
      setTimeout(() => finishMatch(p1.wins >= 2 ? 'p1' : 'p2'), 1500);
    } else {
      setTimeout(startRound, 1600);
    }
  }

  function finishMatch(winner) {
    running = false;
    endOverlay.classList.remove('hidden');
    if (mode === 'ai') {
      endTitle.textContent = winner === 'p1' ? 'YOU WIN!' : 'CPU WINS';
      endSub.textContent = winner === 'p1'
        ? 'You took the match 2 rounds to ' + (winner === 'p1' ? p2.wins : p1.wins) + '.'
        : 'The CPU got the better of you this time. Run it back?';
    } else {
      endTitle.textContent = (winner === 'p1' ? 'CRIMSON' : 'CYAN') + ' WINS THE MATCH';
      endSub.textContent = 'Best of 3, final score ' + p1.wins + ' – ' + p2.wins + '.';
    }
  }

  function update(dt) {
    if (!roundActive) return;

    if (mode === 'ai') {
      handleInput(p1, p2, SCHEME_P1);
      handleAI(p2, p1);
    } else {
      handleInput(p1, p2, SCHEME_P1);
      handleInput(p2, p1, SCHEME_P2);
    }

    physics(p1);
    physics(p2);

    resolveCombat(p1, p2);
    resolveCombat(p2, p1);

    if (p1.hp <= 0 || p2.hp <= 0) {
      roundActive = false;
      if (p1.hp <= 0 && p2.hp <= 0) endRound('draw');
      else endRound(p1.hp <= 0 ? 'p2' : 'p1');
      return;
    }

    timeAccum += dt;
    if (timeAccum >= 1000) {
      timeAccum -= 1000;
      roundTime -= 1;
      timerEl.textContent = Math.max(0, roundTime);
      if (roundTime <= 0) {
        roundActive = false;
        if (p1.hp === p2.hp) endRound('draw');
        else endRound(p1.hp > p2.hp ? 'p1' : 'p2');
      }
    }
  }

  const SCHEME_P1 = { left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS', punch: 'KeyF', kick: 'KeyG' };
  const SCHEME_P2 = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', punch: 'KeyK', kick: 'KeyL' };

  function loop(now) {
    if (!running) return;
    const dt = Math.min(50, now - lastTime);
    lastTime = now;
    if (!paused) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyP' && running) {
      paused = !paused;
    }
  });

  function startGame(selectedMode) {
    mode = selectedMode;
    document.getElementById('p2-name').textContent = mode === 'ai' ? 'CPU · CYAN' : 'CYAN';
    resetFighters();
    menuOverlay.classList.add('hidden');
    endOverlay.classList.add('hidden');
    running = true;
    paused = false;
    matchOver = false;
    timerEl.textContent = '60';
    lastTime = performance.now();
    startRound();
    requestAnimationFrame(loop);
  }

  document.getElementById('btn-vs-ai').addEventListener('click', () => startGame('ai'));
  document.getElementById('btn-vs-p2').addEventListener('click', () => startGame('local'));
  document.getElementById('btn-rematch').addEventListener('click', () => startGame(mode));
  document.getElementById('btn-menu').addEventListener('click', () => {
    running = false;
    endOverlay.classList.add('hidden');
    menuOverlay.classList.remove('hidden');
    draw();
  });

  // idle preview draw on load
  p1 = makeFighter({ x: 220, y: GROUND_Y - 96, facing: 1, color: getVar('--p1'), colorDim: getVar('--p1-dim') });
  p2 = makeFighter({ x: 630, y: GROUND_Y - 96, facing: -1, color: getVar('--p2'), colorDim: getVar('--p2-dim') });
  draw();
})();
