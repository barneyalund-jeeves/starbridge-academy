(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const hudRank = document.getElementById("hudRank");
  const hudScore = document.getElementById("hudScore");
  const hudCombo = document.getElementById("hudCombo");
  const hudJade = document.getElementById("hudJade");
  const pauseBtn = document.getElementById("pauseBtn");
  const soundBtn = document.getElementById("soundBtn");
  const mapBtn = document.getElementById("mapBtn");
  const touchButtons = {
    ArrowLeft: document.getElementById("touchLeft"),
    ArrowRight: document.getElementById("touchRight"),
    ArrowUp: document.getElementById("touchUp"),
    ArrowDown: document.getElementById("touchDown"),
    Space: document.getElementById("touchScan")
  };

  const STORE = "starbridge.academy.v1";
  const bg = new Image();
  bg.src = "assets/starbridge-bg.png";

  const settings = {
    player: "Matthew",
    subject: "all",
    difficulty: "cadet",
    session: "standard",
    music: true,
    sfx: true,
    calmMotion: false,
    musicVolume: 0.34
  };

  const save = normalizeSave(loadSave());
  const state = {
    screen: "menu",
    width: 1280,
    height: 720,
    dpr: 1,
    time: 0,
    last: performance.now(),
    keys: new Set(),
    score: 0,
    combo: 0,
    jade: 0,
    rank: "Cadet",
    sectorIndex: 0,
    missionDeck: [],
    asked: {},
    solvedGates: {},
    unlocked: {},
    visitedSectors: {},
    activeQuestion: null,
    paused: false,
    scanCooldown: 0,
    shield: 0,
    boost: 0,
    message: "",
    messageTimer: 0,
    particles: [],
    stars: [],
    drones: [],
    orbs: [],
    gates: [],
    relics: [],
    secretBuffer: "",
    bossRushRemaining: 0
  };

  const ship = {
    x: 190,
    y: 360,
    vx: 0,
    vy: 0,
    r: 24,
    angle: 0,
    trail: []
  };

  const sectors = [
    {
      id: "observatory",
      name: "Observatory Dock",
      subtitle: "Warm-up constellations",
      tint: ["#06101f", "#123b68", "#6ff5c5", "#ffd66e"],
      subjects: ["math", "science", "language"],
      gateCount: 3,
      drones: 4,
      orbs: 20,
      goal: 3
    },
    {
      id: "fraction-falls",
      name: "Fraction Falls",
      subtitle: "Currents of equivalent parts",
      tint: ["#081722", "#0d5e78", "#8ecbff", "#fff3a8"],
      subjects: ["math"],
      gateCount: 4,
      drones: 6,
      orbs: 24,
      goal: 4
    },
    {
      id: "jade-market",
      name: "Jade Market",
      subtitle: "Words, characters, and clever trades",
      tint: ["#101927", "#194a3e", "#6ff5c5", "#ff7ea8"],
      subjects: ["language", "mandarin"],
      gateCount: 4,
      drones: 5,
      orbs: 26,
      goal: 4
    },
    {
      id: "storm-lab",
      name: "Storm Lab",
      subtitle: "Matter, energy, and weather",
      tint: ["#100f22", "#263a78", "#a992ff", "#8ecbff"],
      subjects: ["science"],
      gateCount: 4,
      drones: 7,
      orbs: 28,
      goal: 4
    },
    {
      id: "atlas-ruins",
      name: "Atlas Ruins",
      subtitle: "Maps, government, and early America",
      tint: ["#1d1421", "#55412c", "#ffd66e", "#6ff5c5"],
      subjects: ["social"],
      gateCount: 5,
      drones: 8,
      orbs: 30,
      goal: 5
    },
    {
      id: "dragon-bridge",
      name: "Dragon Bridge",
      subtitle: "Final mastery trial",
      tint: ["#090817", "#531f42", "#ff7ea8", "#ffd66e"],
      subjects: ["math", "science", "language", "social", "mandarin"],
      gateCount: 7,
      drones: 10,
      orbs: 36,
      goal: 7
    }
  ];

  const questions = [
    q("math", "Fractions", "Which fraction is equivalent to 3/4?", ["6/8", "4/6", "8/10", "9/16"], 0, "Multiply the top and bottom by the same number."),
    q("math", "Fractions", "What is 2/5 + 1/10?", ["1/2", "3/15", "3/10", "2/15"], 0, "2/5 is 4/10, and 4/10 + 1/10 = 5/10."),
    q("math", "Fractions", "Which is greatest?", ["0.72", "7/10", "0.069", "2/3"], 0, "Compare them as decimals: 0.72, 0.70, 0.069, 0.666..."),
    q("math", "Decimals", "8.4 × 10 equals...", ["84", "0.84", "840", "18.4"], 0, "Multiplying by 10 moves the decimal one place right."),
    q("math", "Decimals", "What is 3.6 ÷ 0.6?", ["6", "0.6", "60", "2.16"], 0, "36 tenths divided by 6 tenths is 6."),
    q("math", "Volume", "A box is 5 cm by 4 cm by 3 cm. What is its volume?", ["60 cubic cm", "12 cubic cm", "47 cubic cm", "20 cubic cm"], 0, "Volume = length × width × height."),
    q("math", "Geometry", "A triangle's angles add to...", ["180 degrees", "90 degrees", "270 degrees", "360 degrees"], 0, "Every triangle has 180 degrees total."),
    q("math", "Powers", "10^3 means...", ["1,000", "30", "300", "10/3"], 0, "10 × 10 × 10 = 1,000."),
    q("math", "Measurement", "How many millimeters are in 3 centimeters?", ["30", "300", "3,000", "0.3"], 0, "There are 10 millimeters in 1 centimeter."),
    q("math", "Order of Operations", "What is 6 + 4 × 3?", ["18", "30", "24", "42"], 0, "Multiply before adding."),
    q("math", "Fractions", "What is 1/3 of 24?", ["8", "6", "12", "21"], 0, "Divide 24 into 3 equal groups."),
    q("math", "Coordinate Plane", "The point (4, 2) is 4 units...", ["right and 2 up", "up and 2 right", "left and 2 down", "down and 2 left"], 0, "The first number is x; the second is y."),
    q("science", "Matter", "Which change is most likely chemical?", ["Burning paper", "Melting ice", "Cutting cloth", "Breaking glass"], 0, "Burning creates new substances."),
    q("science", "Matter", "Water vapor turning into liquid water is called...", ["condensation", "evaporation", "precipitation", "erosion"], 0, "Gas cooling into liquid is condensation."),
    q("science", "Earth Systems", "The force that pulls objects toward Earth is...", ["gravity", "friction", "magnetism", "photosynthesis"], 0, "Gravity pulls mass toward mass."),
    q("science", "Space", "Why do we have day and night?", ["Earth rotates", "The Moon blocks the Sun", "Earth changes size", "Clouds cover space"], 0, "Earth spins once about every 24 hours."),
    q("science", "Food Webs", "A producer in a food web is usually...", ["a plant", "a hawk", "a mushroom", "a rock"], 0, "Plants make food using sunlight."),
    q("science", "Energy", "A stretched rubber band stores...", ["potential energy", "thermal energy only", "sound energy", "chemical energy only"], 0, "Stored energy is potential energy."),
    q("science", "Forces", "A push or pull is a...", ["force", "cell", "trait", "mineral"], 0, "Forces change motion."),
    q("science", "Life Science", "Inherited traits are passed from...", ["parents to offspring", "weather to plants", "rocks to soil", "books to readers"], 0, "Genes carry inherited traits."),
    q("science", "Earth", "Weathering means...", ["breaking rock into smaller pieces", "moving clouds north", "measuring temperature", "growing crystals instantly"], 0, "Erosion moves pieces; weathering breaks them."),
    q("science", "Engineering", "A fair test changes...", ["one variable", "every variable", "no observations", "the answer key"], 0, "A fair experiment changes one thing at a time."),
    q("language", "Vocabulary", "What does analyze mean?", ["study closely", "guess randomly", "hide carefully", "repeat loudly"], 0, "To analyze is to examine parts and meaning."),
    q("language", "Vocabulary", "Which word means the opposite of scarce?", ["plentiful", "rare", "limited", "missing"], 0, "Plentiful means there is a lot."),
    q("language", "Vocabulary", "A synonym for reluctant is...", ["unwilling", "excited", "speedy", "ancient"], 0, "Reluctant means not wanting to do something."),
    q("language", "Grammar", "Which sentence uses their correctly?", ["Their books are on the table.", "Their going to the park.", "Look over their!", "Their is a storm."], 0, "Their shows ownership."),
    q("language", "Reading", "The main idea is...", ["what a text is mostly about", "the first word", "the longest sentence", "a tiny detail"], 0, "Details support the main idea."),
    q("language", "Roots", "The prefix pre- means...", ["before", "again", "not", "under"], 0, "Preview means to view before."),
    q("language", "Writing", "A strong opinion essay should include...", ["reasons and evidence", "only jokes", "no conclusion", "random facts"], 0, "Evidence supports the opinion."),
    q("language", "Vocabulary", "What does infer mean?", ["figure out from clues", "copy exactly", "speak louder", "erase a mistake"], 0, "Readers infer by using evidence and what they know."),
    q("social", "Geography", "Latitude lines measure distance north or south of the...", ["Equator", "Prime Meridian", "Pacific Ocean", "North Pole"], 0, "Latitude is measured from the Equator."),
    q("social", "Geography", "A map scale helps you find...", ["real distance", "temperature", "population only", "wind speed"], 0, "Scale connects map distance to real distance."),
    q("social", "Civics", "The three branches of U.S. government are legislative, executive, and...", ["judicial", "military", "national", "regional"], 0, "The judicial branch includes courts."),
    q("social", "History", "The Declaration of Independence announced...", ["the colonies' break from Britain", "the end of the Civil War", "the purchase of Alaska", "the first moon landing"], 0, "It was adopted in 1776."),
    q("social", "Economics", "Supply is...", ["how much is available", "how badly people want something", "a kind of tax", "a map symbol"], 0, "Demand is how much people want it."),
    q("social", "Geography", "Which is a renewable resource?", ["wind", "coal", "oil", "natural gas"], 0, "Wind can be replenished naturally."),
    q("social", "Civics", "A citizen's responsibility can include...", ["voting when old enough", "ignoring laws", "hiding from jury duty", "never learning history"], 0, "Good citizens participate and follow laws."),
    q("social", "History", "Primary sources are created...", ["by people who witnessed an event", "only by textbook companies", "after all opinions are removed", "by guessing"], 0, "Letters, photos, and diaries can be primary sources."),
    q("mandarin", "中文", "What does 星 mean?", ["star", "water", "book", "mountain"], 0, "星 is xing: star."),
    q("mandarin", "中文", "What does 学 mean?", ["learn/study", "eat", "run", "red"], 0, "学 appears in 学校, school."),
    q("mandarin", "中文", "Which character means water?", ["水", "火", "木", "口"], 0, "水 is shui: water."),
    q("mandarin", "中文", "中文 usually means...", ["Chinese language", "math problem", "science lab", "north star"], 0, "中 + 文 refers to Chinese writing/language."),
    q("mandarin", "中文", "What does 朋友 mean?", ["friend", "teacher", "planet", "fraction"], 0, "朋友 is pengyou: friend."),
    q("mandarin", "中文", "Which pinyin matches 你好?", ["ni hao", "xue sheng", "xing xing", "shui huo"], 0, "你好 means hello."),
    q("mandarin", "中文", "What does 老师 mean?", ["teacher", "student", "bridge", "energy"], 0, "老师 is laoshi: teacher."),
    q("mandarin", "中文", "Which character means fire?", ["火", "水", "天", "书"], 0, "火 is huo: fire.")
  ];

  const achievements = [
    { id: "firstGate", name: "Gate Opener", test: () => solvedCount() >= 1 },
    { id: "combo5", name: "Five-Star Combo", test: () => save.bestCombo >= 5 },
    { id: "jade50", name: "Jade Collector", test: () => save.totalJade >= 50 },
    { id: "mandarin5", name: "中文 Spark", test: () => (save.subjectCorrect.mandarin || 0) >= 5 },
    { id: "allSectors", name: "Bridge Walker", test: () => Object.keys(save.visitedSectors).length >= sectors.length },
    { id: "dragon", name: "Dragon Whisperer", test: () => save.secrets.dragon }
  ];

  const audio = {
    ctx: null,
    master: null,
    musicGain: null,
    sfxGain: null,
    step: 0,
    timer: null,
    started: false
  };

  function q(subject, topic, prompt, answers, correct, fact) {
    return { subject, topic, prompt, answers, correct, fact };
  }

  function normalizeSave(raw) {
    return {
      player: raw.player || "Matthew",
      score: raw.score || 0,
      jade: raw.jade || 0,
      totalJade: raw.totalJade || 0,
      sectorIndex: raw.sectorIndex || 0,
      unlocked: raw.unlocked || { observatory: true },
      solvedGates: raw.solvedGates || {},
      visitedSectors: raw.visitedSectors || {},
      subjectCorrect: raw.subjectCorrect || {},
      subjectAsked: raw.subjectAsked || {},
      bestCombo: raw.bestCombo || 0,
      badges: raw.badges || {},
      secrets: raw.secrets || {},
      sessions: raw.sessions || []
    };
  }

  function loadSave() {
    try {
      return JSON.parse(localStorage.getItem(STORE) || "{}");
    } catch {
      return {};
    }
  }

  function persist() {
    localStorage.setItem(STORE, JSON.stringify(save));
  }

  function resize() {
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.width = Math.max(320, window.innerWidth);
    state.height = Math.max(480, window.innerHeight);
    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  }

  function boot() {
    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", (event) => state.keys.delete(event.code));
    pauseBtn.addEventListener("click", togglePause);
    soundBtn.addEventListener("click", toggleSound);
    mapBtn.addEventListener("click", showMap);
    Object.entries(touchButtons).forEach(([code, button]) => {
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        if (code === "Space") scan();
        state.keys.add(code);
        startAudio();
      });
      button.addEventListener("pointerup", () => state.keys.delete(code));
      button.addEventListener("pointerleave", () => state.keys.delete(code));
    });
    seedStars();
    showMenu();
    requestAnimationFrame(loop);
  }

  function seedStars() {
    state.stars = Array.from({ length: 170 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      z: 0.25 + Math.random() * 1.8,
      twinkle: Math.random() * Math.PI * 2,
      hue: i % 5 === 0 ? "#ffe6a3" : i % 7 === 0 ? "#9de7ff" : "#ffffff"
    }));
  }

  function onKeyDown(event) {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(event.code)) {
      event.preventDefault();
      state.keys.add(event.code);
      startAudio();
    }
    if (event.code === "Space") scan();
    if (event.code === "Escape") {
      if (state.screen === "play") togglePause();
      else showMenu();
    }
    state.secretBuffer = (state.secretBuffer + event.key.toLowerCase()).slice(-16);
    if (state.secretBuffer.includes("dragon")) unlockSecret("dragon", "Dragon mode unlocked: the final bridge noticed you.");
    if (state.secretBuffer.includes("laoshi")) unlockSecret("teacher", "Teacher's key found: extra hints are brighter now.");
  }

  function showMenu() {
    state.screen = "menu";
    overlay.classList.remove("hidden");
    overlay.innerHTML = document.getElementById("menuTemplate").innerHTML;
    const playerName = document.getElementById("playerName");
    const subjectSelect = document.getElementById("subjectSelect");
    const difficultySelect = document.getElementById("difficultySelect");
    const sessionSelect = document.getElementById("sessionSelect");
    const musicToggle = document.getElementById("musicToggle");
    const sfxToggle = document.getElementById("sfxToggle");
    const motionToggle = document.getElementById("motionToggle");
    const musicVolume = document.getElementById("musicVolume");
    playerName.value = save.player || settings.player;
    subjectSelect.value = settings.subject;
    difficultySelect.value = settings.difficulty;
    sessionSelect.value = settings.session;
    musicToggle.checked = settings.music;
    sfxToggle.checked = settings.sfx;
    motionToggle.checked = settings.calmMotion;
    musicVolume.value = settings.musicVolume;
    document.getElementById("startBtn").addEventListener("click", () => {
      settings.player = playerName.value.trim() || "Matthew";
      settings.subject = subjectSelect.value;
      settings.difficulty = difficultySelect.value;
      settings.session = sessionSelect.value;
      settings.music = musicToggle.checked;
      settings.sfx = sfxToggle.checked;
      settings.calmMotion = motionToggle.checked;
      settings.musicVolume = Number(musicVolume.value);
      save.player = settings.player;
      startNewRun();
    });
    document.getElementById("continueBtn").addEventListener("click", continueRun);
    document.getElementById("codexBtn").addEventListener("click", showCodex);
    document.getElementById("dashboardBtn").addEventListener("click", showDashboard);
    [musicToggle, sfxToggle, motionToggle, musicVolume].forEach((input) => {
      input.addEventListener("input", () => {
        settings.music = musicToggle.checked;
        settings.sfx = sfxToggle.checked;
        settings.calmMotion = motionToggle.checked;
        settings.musicVolume = Number(musicVolume.value);
        updateAudioLevels();
      });
    });
    updateHud();
  }

  function startNewRun() {
    startAudio();
    state.score = 0;
    state.combo = 0;
    state.jade = 0;
    state.sectorIndex = 0;
    state.solvedGates = {};
    state.asked = {};
    state.bossRushRemaining = settings.session === "boss" ? 12 : 0;
    save.unlocked.observatory = true;
    setupSector(0);
    showToast(`Welcome, ${settings.player}. First mission: light the Observatory Dock.`);
    playSfx("launch");
  }

  function continueRun() {
    startAudio();
    state.score = save.score || 0;
    state.jade = save.jade || 0;
    state.combo = 0;
    state.sectorIndex = Math.min(save.sectorIndex || 0, sectors.length - 1);
    state.solvedGates = { ...save.solvedGates };
    setupSector(state.sectorIndex);
    showToast("Progress restored. The Academy kept your chart warm.");
  }

  function setupSector(index) {
    const sector = sectors[index];
    state.screen = "play";
    overlay.classList.add("hidden");
    state.paused = false;
    state.scanCooldown = 0;
    ship.x = state.width * 0.18;
    ship.y = state.height * 0.5;
    ship.vx = 0;
    ship.vy = 0;
    ship.trail = [];
    state.visitedSectors[sector.id] = true;
    save.visitedSectors[sector.id] = true;
    save.sectorIndex = index;
    state.gates = makeGates(sector);
    state.orbs = makeOrbs(sector);
    state.drones = makeDrones(sector);
    state.relics = makeRelics(sector);
    state.particles = [];
    state.missionDeck = buildDeck(sector);
    persist();
    updateHud();
  }

  function makeGates(sector) {
    return Array.from({ length: sector.gateCount }, (_, i) => {
      const angle = (i / sector.gateCount) * Math.PI * 2 + 0.25;
      const radius = Math.min(state.width, state.height) * (0.23 + (i % 2) * 0.1);
      return {
        id: `${sector.id}-${i}`,
        x: state.width * 0.52 + Math.cos(angle) * radius,
        y: state.height * 0.52 + Math.sin(angle) * radius * 0.72,
        r: 34,
        spin: Math.random() * Math.PI,
        solved: Boolean(state.solvedGates[`${sector.id}-${i}`] || save.solvedGates[`${sector.id}-${i}`])
      };
    });
  }

  function makeOrbs(sector) {
    return Array.from({ length: sector.orbs }, (_, i) => ({
      x: 80 + Math.random() * (state.width - 160),
      y: 120 + Math.random() * (state.height - 220),
      r: 7 + (i % 5 === 0 ? 5 : 0),
      pulse: Math.random() * Math.PI * 2,
      value: i % 5 === 0 ? 3 : 1,
      taken: false
    }));
  }

  function makeDrones(sector) {
    return Array.from({ length: sector.drones }, (_, i) => ({
      x: 140 + Math.random() * (state.width - 280),
      y: 140 + Math.random() * (state.height - 260),
      r: 18 + (i % 3) * 3,
      a: Math.random() * Math.PI * 2,
      speed: 0.45 + Math.random() * 0.55,
      mood: i % 2 ? "orbit" : "sweep",
      hit: 0
    }));
  }

  function makeRelics(sector) {
    return [
      {
        id: `${sector.id}-relic`,
        x: state.width * (0.82 + Math.random() * 0.08),
        y: state.height * (0.2 + Math.random() * 0.55),
        r: 18,
        taken: Boolean(save.secrets[`${sector.id}-relic`])
      }
    ];
  }

  function buildDeck(sector) {
    let pool = questions.filter((item) => {
      const subjectAllowed = settings.subject === "all" ||
        (settings.subject === "math" && item.subject === "math") ||
        (settings.subject === "science" && item.subject === "science") ||
        (settings.subject === "language" && ["language", "mandarin"].includes(item.subject)) ||
        (settings.subject === "social" && item.subject === "social");
      return subjectAllowed && sector.subjects.includes(item.subject);
    });
    if (!pool.length) pool = questions.filter((item) => sector.subjects.includes(item.subject));
    if (!pool.length) pool = questions;
    return shuffle(pool).slice(0, settings.session === "short" ? 10 : 20);
  }

  function loop(now) {
    const dt = Math.min(0.033, (now - state.last) / 1000 || 0);
    state.last = now;
    state.time += dt;
    if (state.screen === "play" && !state.paused && !state.activeQuestion) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function update(dt) {
    const accel = state.boost > 0 ? 760 : 560;
    const drag = 0.88;
    if (state.keys.has("ArrowLeft")) ship.vx -= accel * dt;
    if (state.keys.has("ArrowRight")) ship.vx += accel * dt;
    if (state.keys.has("ArrowUp")) ship.vy -= accel * dt;
    if (state.keys.has("ArrowDown")) ship.vy += accel * dt;
    ship.vx *= Math.pow(drag, dt * 60);
    ship.vy *= Math.pow(drag, dt * 60);
    ship.x = clamp(ship.x + ship.vx * dt, 40, state.width - 40);
    ship.y = clamp(ship.y + ship.vy * dt, 92, state.height - 84);
    ship.angle = Math.atan2(ship.vy, ship.vx || 1);
    ship.trail.unshift({ x: ship.x, y: ship.y, a: ship.angle, life: 1 });
    ship.trail = ship.trail.slice(0, settings.calmMotion ? 8 : 18);
    ship.trail.forEach((t) => t.life -= dt * 2.4);
    state.scanCooldown = Math.max(0, state.scanCooldown - dt);
    state.shield = Math.max(0, state.shield - dt);
    state.boost = Math.max(0, state.boost - dt);
    state.messageTimer = Math.max(0, state.messageTimer - dt);
    updateDrones(dt);
    updateParticles(dt);
    collectOrbs();
    collideGates();
    collideRelics();
    checkSectorComplete();
    updateHud();
  }

  function updateDrones(dt) {
    const sector = sectors[state.sectorIndex];
    state.drones.forEach((drone, i) => {
      drone.a += dt * drone.speed * (drone.mood === "orbit" ? 1.4 : 0.9);
      const wave = Math.sin(state.time * drone.speed + i);
      if (drone.mood === "orbit") {
        drone.x += Math.cos(drone.a) * 42 * dt;
        drone.y += Math.sin(drone.a * 1.3) * 34 * dt;
      } else {
        drone.x += Math.cos(drone.a) * 78 * dt;
        drone.y += wave * 54 * dt;
      }
      if (drone.x < 40 || drone.x > state.width - 40) drone.a = Math.PI - drone.a;
      if (drone.y < 104 || drone.y > state.height - 80) drone.a = -drone.a;
      drone.x = clamp(drone.x, 40, state.width - 40);
      drone.y = clamp(drone.y, 104, state.height - 80);
      drone.hit = Math.max(0, drone.hit - dt);
      if (dist(ship, drone) < ship.r + drone.r && state.shield <= 0) {
        state.combo = 0;
        state.shield = 1.7;
        ship.vx += (ship.x - drone.x) * 5.8;
        ship.vy += (ship.y - drone.y) * 5.8;
        playSfx("bump");
        showToast(`${sector.name} drone tagged you. Solve a quick repair puzzle.`);
        askQuestion("repair");
      }
    });
  }

  function updateParticles(dt) {
    state.particles.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.spin += dt * p.twist;
    });
    state.particles = state.particles.filter((p) => p.life > 0);
  }

  function collectOrbs() {
    state.orbs.forEach((orb) => {
      if (!orb.taken && dist(ship, orb) < ship.r + orb.r + 4) {
        orb.taken = true;
        state.jade += orb.value;
        state.score += orb.value * 8;
        save.jade = state.jade;
        save.totalJade += orb.value;
        burst(orb.x, orb.y, orb.value > 1 ? "#ffd66e" : "#6ff5c5", 12);
        playSfx("orb");
      }
    });
  }

  function collideGates() {
    state.gates.forEach((gate) => {
      if (!gate.solved && dist(ship, gate) < ship.r + gate.r) {
        askQuestion("gate", gate);
      }
    });
  }

  function collideRelics() {
    state.relics.forEach((relic) => {
      if (!relic.taken && dist(ship, relic) < ship.r + relic.r) {
        relic.taken = true;
        save.secrets[relic.id] = true;
        state.score += 75;
        save.score = Math.max(save.score, state.score);
        burst(relic.x, relic.y, "#ff7ea8", 28);
        playSfx("secret");
        showToast(secretLine());
        persist();
      }
    });
  }

  function scan() {
    if (state.screen !== "play" || state.activeQuestion || state.scanCooldown > 0) return;
    state.scanCooldown = 1.1;
    state.boost = 0.9;
    state.shield = Math.max(state.shield, 0.7);
    burst(ship.x + Math.cos(ship.angle) * 32, ship.y + Math.sin(ship.angle) * 32, "#8ecbff", 18);
    playSfx("scan");
    state.drones.forEach((drone) => {
      if (dist(ship, drone) < 150) {
        drone.hit = 1;
        drone.x += (drone.x - ship.x) * 0.08;
        drone.y += (drone.y - ship.y) * 0.08;
      }
    });
  }

  function askQuestion(reason, gate = null) {
    if (state.activeQuestion) return;
    const question = drawQuestion(reason);
    state.activeQuestion = { question, gate, reason, started: performance.now() };
    state.screen = "question";
    overlay.classList.remove("hidden");
    const answers = question.answers.map((answer, index) => ({ answer, index }));
    const mixed = shuffle(answers);
    overlay.innerHTML = `
      <section class="panel question-panel">
        <div class="question-meta">
          <span>${escapeHtml(question.topic)} · ${escapeHtml(labelSubject(question.subject))}</span>
          <span>${reason === "gate" ? "Puzzle Gate" : "Repair"} · Combo ${state.combo}</span>
        </div>
        <div class="prompt">${escapeHtml(question.prompt)}</div>
        ${question.subject === "mandarin" ? '<p class="subprompt">Tiny Mandarin boost: read the Simplified Chinese first, then choose the meaning.</p>' : ""}
        <div class="answer-grid">
          ${mixed.map((item, i) => `<button type="button" data-index="${item.index}" data-choice="${i + 1}">${escapeHtml(item.answer)}</button>`).join("")}
        </div>
        <p class="feedback" id="feedback"></p>
      </section>
    `;
    overlay.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => answerQuestion(Number(button.dataset.index)));
    });
    playSfx("question");
  }

  function drawQuestion(reason) {
    if (state.bossRushRemaining > 0) {
      state.bossRushRemaining -= 1;
      return shuffle(questions)[0];
    }
    if (!state.missionDeck.length) state.missionDeck = buildDeck(sectors[state.sectorIndex]);
    const preferred = state.missionDeck.find((item) => !state.asked[item.prompt]) || state.missionDeck[0];
    state.asked[preferred.prompt] = true;
    if (reason === "repair" && Math.random() < 0.35) {
      return shuffle(questions.filter((item) => item.subject === "math" || item.subject === "science"))[0] || preferred;
    }
    return preferred;
  }

  function answerQuestion(index) {
    const active = state.activeQuestion;
    if (!active) return;
    const { question, gate } = active;
    const feedback = document.getElementById("feedback");
    save.subjectAsked[question.subject] = (save.subjectAsked[question.subject] || 0) + 1;
    if (index === question.correct) {
      state.combo += 1;
      state.score += 100 + state.combo * 18 + (question.subject === "mandarin" ? 35 : 0);
      save.score = Math.max(save.score, state.score);
      save.bestCombo = Math.max(save.bestCombo, state.combo);
      save.subjectCorrect[question.subject] = (save.subjectCorrect[question.subject] || 0) + 1;
      if (gate) {
        gate.solved = true;
        state.solvedGates[gate.id] = true;
        save.solvedGates[gate.id] = true;
        burst(gate.x, gate.y, "#ffd66e", 36);
      } else {
        state.shield = Math.max(state.shield, 1.2);
      }
      feedback.textContent = `Correct. ${question.fact}`;
      playSfx("correct");
      updateBadges();
      persist();
      setTimeout(() => closeQuestion(true), 650);
    } else {
      state.combo = 0;
      state.score = Math.max(0, state.score - 25);
      feedback.textContent = `Not quite. ${question.fact}`;
      overlay.querySelector(".question-panel").classList.add("shake");
      playSfx("wrong");
      persist();
      setTimeout(() => closeQuestion(false), 1150);
    }
  }

  function closeQuestion(correct) {
    state.activeQuestion = null;
    state.screen = "play";
    overlay.classList.add("hidden");
    if (correct) {
      ship.vx += 190;
      state.shield = Math.max(state.shield, 1.4);
    } else {
      ship.x = clamp(ship.x - 75, 50, state.width - 50);
      state.shield = Math.max(state.shield, 2.2);
    }
    updateHud();
  }

  function checkSectorComplete() {
    const sector = sectors[state.sectorIndex];
    const solved = state.gates.filter((gate) => gate.solved).length;
    if (solved >= sector.goal && !state.unlocked[sector.id]) {
      state.unlocked[sector.id] = true;
      const next = sectors[state.sectorIndex + 1];
      state.score += 250;
      if (next) {
        save.unlocked[next.id] = true;
        showSectorComplete(next);
      } else {
        showVictory();
      }
      persist();
    }
  }

  function showSectorComplete(next) {
    state.paused = true;
    state.screen = "sector";
    overlay.classList.remove("hidden");
    overlay.innerHTML = `
      <section class="panel">
        <p class="eyebrow">Sector cleared</p>
        <h2>${escapeHtml(sectors[state.sectorIndex].name)} is online</h2>
        <p class="tagline">Next bridge: ${escapeHtml(next.name)}. ${escapeHtml(next.subtitle)}.</p>
        <div class="badge-row">
          <span class="badge">XP ${state.score}</span>
          <span class="badge">Jade ${state.jade}</span>
          <span class="badge">Combo ${state.combo}</span>
        </div>
        <div class="button-row" style="margin-top: 20px">
          <button id="nextSector" class="primary" type="button">Open ${escapeHtml(next.name)}</button>
          <button id="menuBack" type="button">Menu</button>
        </div>
      </section>
    `;
    document.getElementById("nextSector").addEventListener("click", () => {
      state.sectorIndex += 1;
      setupSector(state.sectorIndex);
      playSfx("launch");
    });
    document.getElementById("menuBack").addEventListener("click", showMenu);
    playSfx("sector");
  }

  function showVictory() {
    state.paused = true;
    state.screen = "victory";
    const session = {
      at: new Date().toISOString(),
      score: state.score,
      jade: state.jade,
      combo: state.combo,
      sectors: Object.keys(save.visitedSectors).length
    };
    save.sessions.unshift(session);
    save.sessions = save.sessions.slice(0, 12);
    persist();
    overlay.classList.remove("hidden");
    overlay.innerHTML = `
      <section class="panel">
        <p class="eyebrow">Bridge complete</p>
        <h2>Starbridge Academy is lit.</h2>
        <p class="tagline">${escapeHtml(settings.player)} connected every sector and earned the rank of Star Captain.</p>
        <div class="mission-grid">
          <div class="stat-card"><strong>${state.score}</strong><span>XP this run</span></div>
          <div class="stat-card"><strong>${state.jade}</strong><span>Jade stars</span></div>
          <div class="stat-card"><strong>${state.combo}</strong><span>Final combo</span></div>
        </div>
        <div class="button-row" style="margin-top: 20px">
          <button id="againBtn" class="primary" type="button">New Quest</button>
          <button id="dashBtn" type="button">Parent View</button>
        </div>
      </section>
    `;
    document.getElementById("againBtn").addEventListener("click", showMenu);
    document.getElementById("dashBtn").addEventListener("click", showDashboard);
    playSfx("victory");
  }

  function showMap() {
    if (state.screen === "question") return;
    state.paused = true;
    overlay.classList.remove("hidden");
    overlay.innerHTML = `
      <section class="panel">
        <p class="eyebrow">Mission Map</p>
        <h2>Starbridge Sectors</h2>
        <div class="mission-grid">
          ${sectors.map((sector, index) => {
            const locked = !save.unlocked[sector.id] && index !== 0;
            const solved = Object.keys(save.solvedGates).filter((id) => id.startsWith(`${sector.id}-`)).length;
            return `<div class="mission-card">
              <strong>${locked ? "Locked" : escapeHtml(sector.name)}</strong>
              <span>${escapeHtml(sector.subtitle)}<br>${solved}/${sector.goal} gates lit</span>
            </div>`;
          }).join("")}
        </div>
        <div class="button-row" style="margin-top: 20px">
          <button id="resumeBtn" class="primary" type="button">Resume</button>
          <button id="menuBtn" type="button">Menu</button>
        </div>
      </section>
    `;
    document.getElementById("resumeBtn").addEventListener("click", resumePlay);
    document.getElementById("menuBtn").addEventListener("click", showMenu);
  }

  function showCodex() {
    overlay.classList.remove("hidden");
    state.screen = "codex";
    const subjectRows = ["math", "science", "language", "social", "mandarin"].map((subject) => {
      const asked = save.subjectAsked[subject] || 0;
      const correct = save.subjectCorrect[subject] || 0;
      const pct = asked ? Math.round((correct / asked) * 100) : 0;
      return `<div class="codex-card"><strong>${escapeHtml(labelSubject(subject))}</strong><span>${correct}/${asked} correct · ${pct}% mastery</span></div>`;
    }).join("");
    overlay.innerHTML = `
      <section class="panel">
        <p class="eyebrow">Cadet Codex</p>
        <h2>What Matthew is practicing</h2>
        <div class="codex-grid">${subjectRows}</div>
        <h3 style="margin-top: 20px">Badges</h3>
        <div class="badge-row">
          ${achievements.map((a) => `<span class="badge">${save.badges[a.id] ? "★" : "☆"} ${escapeHtml(a.name)}</span>`).join("")}
        </div>
        <p class="small-note" style="margin-top: 18px">Easter eggs are hidden in relics, typed words, and unusually suspicious stars.</p>
        <div class="button-row" style="margin-top: 20px">
          <button id="codexBack" class="primary" type="button">Back</button>
        </div>
      </section>
    `;
    document.getElementById("codexBack").addEventListener("click", showMenu);
  }

  function showDashboard() {
    state.screen = "dashboard";
    overlay.classList.remove("hidden");
    const rows = ["math", "science", "language", "social", "mandarin"].map((subject) => {
      const asked = save.subjectAsked[subject] || 0;
      const correct = save.subjectCorrect[subject] || 0;
      return `<div class="stat-card"><strong>${escapeHtml(labelSubject(subject))}</strong><span>${correct}/${asked} correct</span></div>`;
    }).join("");
    overlay.innerHTML = `
      <section class="panel">
        <p class="eyebrow">Parent View</p>
        <h2>Progress snapshot</h2>
        <div class="mission-grid">
          <div class="stat-card"><strong>${save.score || 0}</strong><span>Best XP</span></div>
          <div class="stat-card"><strong>${save.totalJade || 0}</strong><span>Total jade collected</span></div>
          <div class="stat-card"><strong>${save.bestCombo || 0}</strong><span>Best combo</span></div>
          <div class="stat-card"><strong>${Object.keys(save.badges).length}</strong><span>Badges earned</span></div>
        </div>
        <h3 style="margin-top: 20px">Subject accuracy</h3>
        <div class="mission-grid">${rows}</div>
        <div class="button-row" style="margin-top: 20px">
          <button id="exportBtn" type="button">Export CSV</button>
          <button id="resetBtn" type="button">Reset Progress</button>
          <button id="dashBack" class="primary" type="button">Back</button>
        </div>
      </section>
    `;
    document.getElementById("dashBack").addEventListener("click", showMenu);
    document.getElementById("resetBtn").addEventListener("click", () => {
      if (confirm("Reset Starbridge Academy progress?")) {
        localStorage.removeItem(STORE);
        location.reload();
      }
    });
    document.getElementById("exportBtn").addEventListener("click", exportCsv);
  }

  function exportCsv() {
    const lines = [["subject", "correct", "asked"]];
    ["math", "science", "language", "social", "mandarin"].forEach((subject) => {
      lines.push([subject, save.subjectCorrect[subject] || 0, save.subjectAsked[subject] || 0]);
    });
    lines.push(["best_score", save.score || 0, ""]);
    lines.push(["total_jade", save.totalJade || 0, ""]);
    lines.push(["best_combo", save.bestCombo || 0, ""]);
    const csv = lines.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "starbridge-progress.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function togglePause() {
    if (!["play", "paused"].includes(state.screen)) return;
    state.paused = !state.paused;
    if (state.paused) {
      state.screen = "paused";
      overlay.classList.remove("hidden");
      overlay.innerHTML = `
        <section class="panel">
          <p class="eyebrow">Paused</p>
          <h2>Sky Skiff holding position</h2>
          <div class="button-row">
            <button id="resumeBtn" class="primary" type="button">Resume</button>
            <button id="mapPauseBtn" type="button">Map</button>
            <button id="menuPauseBtn" type="button">Menu</button>
          </div>
        </section>
      `;
      document.getElementById("resumeBtn").addEventListener("click", resumePlay);
      document.getElementById("mapPauseBtn").addEventListener("click", showMap);
      document.getElementById("menuPauseBtn").addEventListener("click", showMenu);
    } else {
      resumePlay();
    }
  }

  function resumePlay() {
    state.screen = "play";
    state.paused = false;
    overlay.classList.add("hidden");
  }

  function toggleSound() {
    settings.music = !settings.music;
    settings.sfx = settings.music;
    soundBtn.textContent = settings.music ? "♪" : "×";
    soundBtn.setAttribute("aria-label", settings.music ? "Music and sound on" : "Music and sound off");
    if (settings.music) startAudio();
    updateAudioLevels();
  }

  function updateHud() {
    state.rank = rankFor(state.score);
    hudRank.textContent = state.rank;
    hudScore.textContent = `${state.score} XP`;
    hudCombo.textContent = `${state.combo} combo`;
    hudJade.textContent = `${state.jade} jade`;
  }

  function draw() {
    const sector = sectors[state.sectorIndex] || sectors[0];
    drawBackground(sector);
    if (state.screen !== "menu") {
      drawOrbs();
      drawRelics();
      drawGates();
      drawDrones();
      drawParticles();
      drawShip();
      drawSectorLabel(sector);
    }
    if (state.messageTimer > 0) drawToast();
  }

  function drawBackground(sector) {
    const w = state.width;
    const h = state.height;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, sector.tint[0]);
    g.addColorStop(0.5, sector.tint[1]);
    g.addColorStop(1, "#02050b");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    if (bg.complete && bg.naturalWidth) {
      const scale = Math.max(w / bg.naturalWidth, h / bg.naturalHeight);
      const bw = bg.naturalWidth * scale;
      const bh = bg.naturalHeight * scale;
      const drift = settings.calmMotion ? 0 : Math.sin(state.time * 0.035) * 20;
      ctx.globalAlpha = 0.72;
      ctx.drawImage(bg, (w - bw) / 2 + drift, (h - bh) / 2, bw, bh);
      ctx.globalAlpha = 1;
    }

    drawNebula(sector);
    state.stars.forEach((star) => {
      const px = (star.x * w + state.time * star.z * 8) % w;
      const py = star.y * h;
      const twinkle = 0.42 + Math.sin(state.time * 2 + star.twinkle) * 0.24;
      ctx.globalAlpha = clamp(twinkle, 0.18, 0.9);
      ctx.fillStyle = star.hue;
      ctx.fillRect(px, py, star.z, star.z);
    });
    ctx.globalAlpha = 1;

    ctx.fillStyle = "rgba(0, 0, 0, 0.36)";
    ctx.fillRect(0, 0, w, 82);
    const bottom = ctx.createLinearGradient(0, h - 160, 0, h);
    bottom.addColorStop(0, "rgba(0,0,0,0)");
    bottom.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = bottom;
    ctx.fillRect(0, h - 160, w, 160);
  }

  function drawNebula(sector) {
    const w = state.width;
    const h = state.height;
    const blobs = [
      [w * 0.16, h * 0.26, 240, sector.tint[2]],
      [w * 0.76, h * 0.22, 210, sector.tint[3]],
      [w * 0.62, h * 0.76, 260, "#8ecbff"]
    ];
    blobs.forEach(([x, y, r, color], i) => {
      const pulse = settings.calmMotion ? 0 : Math.sin(state.time * 0.5 + i) * 18;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r + pulse);
      grad.addColorStop(0, `${color}44`);
      grad.addColorStop(0.45, `${color}18`);
      grad.addColorStop(1, `${color}00`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r + pulse, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawShip() {
    ship.trail.forEach((t, i) => {
      if (t.life <= 0) return;
      ctx.save();
      ctx.globalAlpha = t.life * 0.35;
      ctx.translate(t.x, t.y);
      ctx.rotate(t.a);
      ctx.fillStyle = i % 2 ? "#6ff5c5" : "#8ecbff";
      ctx.beginPath();
      ctx.ellipse(-20 - i * 1.2, 0, 18, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    const shieldAlpha = state.shield > 0 ? 0.25 + Math.sin(state.time * 18) * 0.08 : 0;
    if (shieldAlpha > 0) {
      ctx.globalAlpha = shieldAlpha;
      ctx.strokeStyle = "#6ff5c5";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = "#f8fbff";
    ctx.strokeStyle = "#10243b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.lineTo(-20, -18);
    ctx.lineTo(-10, 0);
    ctx.lineTo(-20, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffd66e";
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6ff5c5";
    ctx.beginPath();
    ctx.moveTo(-22, -11);
    ctx.lineTo(-38, 0);
    ctx.lineTo(-22, 11);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawGates() {
    state.gates.forEach((gate) => {
      gate.spin += 0.01;
      ctx.save();
      ctx.translate(gate.x, gate.y);
      ctx.rotate(gate.spin);
      ctx.strokeStyle = gate.solved ? "#6ff5c5" : "#ffd66e";
      ctx.lineWidth = gate.solved ? 5 : 3;
      ctx.shadowColor = gate.solved ? "#6ff5c5" : "#ffd66e";
      ctx.shadowBlur = gate.solved ? 24 : 12;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.roundRect(-gate.r + i * 9, -gate.r + i * 9, (gate.r - i * 9) * 2, (gate.r - i * 9) * 2, 8);
        ctx.stroke();
      }
      ctx.rotate(-gate.spin * 2);
      ctx.fillStyle = gate.solved ? "#6ff5c5" : "#fff3a8";
      ctx.font = "900 18px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(gate.solved ? "✓" : "?", 0, 0);
      ctx.restore();
    });
  }

  function drawOrbs() {
    state.orbs.forEach((orb) => {
      if (orb.taken) return;
      const pulse = Math.sin(state.time * 3 + orb.pulse) * 2;
      ctx.save();
      ctx.translate(orb.x, orb.y);
      ctx.shadowColor = orb.value > 1 ? "#ffd66e" : "#6ff5c5";
      ctx.shadowBlur = 18;
      ctx.fillStyle = orb.value > 1 ? "#ffd66e" : "#6ff5c5";
      ctx.beginPath();
      ctx.arc(0, 0, orb.r + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.arc(-3, -3, Math.max(2, orb.r * 0.34), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawRelics() {
    state.relics.forEach((relic) => {
      if (relic.taken) return;
      ctx.save();
      ctx.translate(relic.x, relic.y);
      ctx.rotate(state.time * 0.8);
      ctx.shadowColor = "#ff7ea8";
      ctx.shadowBlur = 24;
      ctx.fillStyle = "#ff7ea8";
      ctx.beginPath();
      for (let i = 0; i < 10; i += 1) {
        const r = i % 2 ? 9 : relic.r;
        const a = (i / 10) * Math.PI * 2;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
  }

  function drawDrones() {
    state.drones.forEach((drone, i) => {
      ctx.save();
      ctx.translate(drone.x, drone.y);
      ctx.rotate(drone.a);
      ctx.globalAlpha = state.shield > 0 && dist(ship, drone) < ship.r + drone.r + 8 ? 0.55 : 1;
      ctx.shadowColor = drone.hit > 0 ? "#ffd66e" : "#ff7ea8";
      ctx.shadowBlur = drone.hit > 0 ? 22 : 12;
      ctx.fillStyle = i % 3 === 0 ? "#ff7ea8" : "#a992ff";
      ctx.beginPath();
      ctx.roundRect(-drone.r, -drone.r * 0.72, drone.r * 2, drone.r * 1.44, 8);
      ctx.fill();
      ctx.fillStyle = "#07111f";
      ctx.beginPath();
      ctx.arc(drone.r * 0.35, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#f8fbff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-drone.r * 0.8, -drone.r);
      ctx.lineTo(-drone.r * 1.4, -drone.r * 1.45);
      ctx.moveTo(-drone.r * 0.8, drone.r);
      ctx.lineTo(-drone.r * 1.4, drone.r * 1.45);
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawParticles() {
    state.particles.forEach((p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin);
      ctx.globalAlpha = clamp(p.life, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });
    ctx.globalAlpha = 1;
  }

  function drawSectorLabel(sector) {
    ctx.save();
    const mobileControls = window.matchMedia("(max-width: 760px)").matches ? 92 : 0;
    const baseY = state.height - 76 - mobileControls;
    ctx.fillStyle = "rgba(4, 12, 22, 0.48)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(16, baseY, 310, 54, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f8fbff";
    ctx.font = "900 18px system-ui";
    ctx.fillText(sector.name, 32, baseY + 24);
    ctx.fillStyle = "#b7c7d9";
    ctx.font = "700 12px system-ui";
    ctx.fillText(sector.subtitle, 32, baseY + 44);
    ctx.restore();
  }

  function drawToast() {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "850 16px system-ui";
    const lines = wrapCanvasText(state.message, Math.min(520, state.width - 72));
    const textWidth = Math.max(...lines.map((line) => ctx.measureText(line).width));
    const width = Math.min(state.width - 40, textWidth + 42);
    const height = 24 + lines.length * 22;
    const x = state.width / 2 - width / 2;
    const mobileControls = window.matchMedia("(max-width: 760px)").matches ? 82 : 0;
    const y = state.height - 132 - mobileControls - (lines.length - 1) * 11;
    ctx.fillStyle = "rgba(5, 12, 21, 0.84)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f8fbff";
    lines.forEach((line, i) => ctx.fillText(line, state.width / 2, y + 26 + i * 22));
    ctx.restore();
  }

  function wrapCanvasText(text, maxWidth) {
    const words = String(text).split(" ");
    const lines = [];
    let line = "";
    words.forEach((word) => {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width <= maxWidth || !line) {
        line = next;
      } else {
        lines.push(line);
        line = word;
      }
    });
    if (line) lines.push(line);
    return lines.slice(0, 3);
  }

  function burst(x, y, color, count) {
    if (settings.calmMotion) count = Math.ceil(count * 0.45);
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 180;
      state.particles.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        size: 3 + Math.random() * 7,
        color,
        life: 0.45 + Math.random() * 0.7,
        spin: Math.random() * Math.PI,
        twist: -4 + Math.random() * 8
      });
    }
  }

  function showToast(message) {
    state.message = message;
    state.messageTimer = 3.2;
  }

  function updateBadges() {
    achievements.forEach((achievement) => {
      if (!save.badges[achievement.id] && achievement.test()) {
        save.badges[achievement.id] = new Date().toISOString();
        showToast(`Badge earned: ${achievement.name}`);
      }
    });
  }

  function unlockSecret(id, message) {
    if (save.secrets[id]) return;
    save.secrets[id] = true;
    state.score += 150;
    save.score = Math.max(save.score, state.score);
    updateBadges();
    persist();
    showToast(message);
    playSfx("secret");
  }

  function secretLine() {
    const lines = [
      "Relic found: the jade star hums in Mandarin.",
      "Secret chart found: one bridge is older than the Academy.",
      "Hidden note: type DRAGON sometime. Apparently that matters.",
      "Relic found: a tiny teacher stamp says 老师 approved."
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }

  function solvedCount() {
    return Object.keys(save.solvedGates).length;
  }

  function rankFor(score) {
    if (score >= 6000) return "Star Captain";
    if (score >= 3600) return "Navigator";
    if (score >= 1800) return "Pathfinder";
    if (score >= 750) return "Pilot";
    return "Cadet";
  }

  function labelSubject(subject) {
    return {
      math: "Math",
      science: "Science",
      language: "Vocabulary",
      social: "History/Geo",
      mandarin: "Mandarin"
    }[subject] || subject;
  }

  function startAudio() {
    if (audio.started) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audio.ctx = new AudioContext();
    audio.master = audio.ctx.createGain();
    audio.musicGain = audio.ctx.createGain();
    audio.sfxGain = audio.ctx.createGain();
    audio.musicGain.connect(audio.master);
    audio.sfxGain.connect(audio.master);
    audio.master.connect(audio.ctx.destination);
    audio.started = true;
    updateAudioLevels();
    audio.timer = setInterval(playMusicStep, 260);
  }

  function updateAudioLevels() {
    if (!audio.started) return;
    audio.musicGain.gain.value = settings.music ? settings.musicVolume : 0;
    audio.sfxGain.gain.value = settings.sfx ? 0.55 : 0;
    audio.master.gain.value = 0.82;
  }

  function playMusicStep() {
    if (!audio.started || !settings.music || state.screen === "menu") return;
    const chords = [
      [196, 246.94, 329.63],
      [174.61, 220, 293.66],
      [164.81, 207.65, 261.63],
      [220, 277.18, 349.23]
    ];
    const chord = chords[Math.floor(audio.step / 8) % chords.length];
    const note = chord[audio.step % chord.length] * (audio.step % 7 === 0 ? 2 : 1);
    tone(note, 0.08, "triangle", audio.musicGain, 0.09);
    if (audio.step % 4 === 0) tone(chord[0] / 2, 0.16, "sine", audio.musicGain, 0.12);
    if (audio.step % 8 === 2) noise(0.035, audio.musicGain, 0.035);
    audio.step += 1;
  }

  function playSfx(kind) {
    if (!audio.started || !settings.sfx) return;
    const map = {
      orb: [880, 0.045, "sine", 0.12],
      correct: [660, 0.11, "triangle", 0.18],
      wrong: [130, 0.18, "sawtooth", 0.1],
      bump: [90, 0.12, "square", 0.12],
      launch: [330, 0.18, "triangle", 0.16],
      scan: [520, 0.09, "sine", 0.12],
      question: [392, 0.07, "triangle", 0.08],
      sector: [523.25, 0.2, "triangle", 0.18],
      victory: [783.99, 0.28, "sine", 0.2],
      secret: [1046.5, 0.18, "triangle", 0.16]
    };
    const [freq, dur, type, gain] = map[kind] || map.orb;
    tone(freq, dur, type, audio.sfxGain, gain);
    if (kind === "correct" || kind === "victory") {
      setTimeout(() => tone(freq * 1.5, dur, type, audio.sfxGain, gain * 0.8), 80);
    }
    if (kind === "secret") {
      setTimeout(() => tone(freq * 1.25, dur, type, audio.sfxGain, gain * 0.8), 70);
      setTimeout(() => tone(freq * 1.5, dur, type, audio.sfxGain, gain * 0.65), 140);
    }
  }

  function tone(freq, duration, type, dest, gainValue) {
    const t = audio.ctx.currentTime;
    const osc = audio.ctx.createOscillator();
    const gain = audio.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(gainValue, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + duration + 0.03);
  }

  function noise(duration, dest, gainValue) {
    const bufferSize = Math.floor(audio.ctx.sampleRate * duration);
    const buffer = audio.ctx.createBuffer(1, bufferSize, audio.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) data[i] = Math.random() * 2 - 1;
    const source = audio.ctx.createBufferSource();
    const gain = audio.ctx.createGain();
    gain.gain.value = gainValue;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(dest);
    source.start();
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function roundRect(x, y, w, h, r) {
      const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
      this.moveTo(x + radius, y);
      this.arcTo(x + w, y, x + w, y + h, radius);
      this.arcTo(x + w, y + h, x, y + h, radius);
      this.arcTo(x, y + h, x, y, radius);
      this.arcTo(x, y, x + w, y, radius);
      return this;
    };
  }

  boot();
})();
