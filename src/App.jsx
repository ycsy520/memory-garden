import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw, Trophy, Sprout, Wind, Volume2, VolumeX, BookOpen, ArrowRight, Heart, Sun, CloudFog, Medal, Smartphone, Monitor, Globe } from 'lucide-react';

// --- 素材配置：世界名花 ---
const FLOWER_POOL = ['🌹', '🌻', '🌷', '🌼', '🌸', '🌺', '🪷', '🏵️'];

// --- 多语言配置 ---
const TRANSLATIONS = {
  'zh-CN': {
    title: '记忆小花园',
    subtitle: '一段找回遗忘时光的旅程',
    startBtn: '推开花园的门',
    dedication: '献给最亲爱的奶奶',
    deviceSupport: { mobile: '手机', pc: '电脑', tablet: '平板' },
    guide: {
      steps: [
        { title: '花园起了雾', text: '奶奶，我们的花园里最近起了一些雾，有些花儿看不清了。不过没关系，我们慢慢来。', sub: '放松心情，深呼吸...' },
        { title: '记住这朵花', text: '花儿会一朵接一朵地盛开。请您仔细看着它们可爱的样子。', sub: '每一朵花都会停留一会儿' },
        { title: '寻找记忆的影子', text: '如果看到这朵花，和"之前"的那朵一模一样...', sub: '那就是记忆回来了！' },
        { title: '按下按钮', text: '当您发现花朵重复出现时，就轻轻按下这个“似曾相识”的按钮。', sub: '如果错过了也没关系，我们只是在散步。' }
      ],
      prev: '上一步',
      next: '下一步',
      done: '明白了'
    },
    menu: {
      weather: '今天天气真好',
      prompt: '准备好去哪里了吗？',
      startWalk: '开始散步',
      levels: [
        { label: '初晨 (简单)', desc: '和 刚刚那朵 一样吗？' },
        { label: '午后 (进阶)', desc: '和 上上朵 一样吗？' },
        { label: '暮色 (挑战)', desc: '寻找 更早之前 的花' }
      ],
      encounter: '次相遇',
      highScore: '最高'
    },
    game: {
      back: '返回',
      memoryFragment: '记忆碎片',
      waiting: '...',
      matched: '想起来了!',
      button: '似曾相识',
      warmup: '请先记住这朵花...',
      question: '这朵花之前出现过吗？'
    },
    finished: {
      newRecord: '新纪录!',
      title: '散步结束啦',
      desc: '您今天让花园变得非常美丽。',
      awakened: '成功唤醒',
      count: '次记忆',
      again: '再走一回'
    }
  },
  'zh-TW': {
    title: '記憶小花園',
    subtitle: '一段找回遺忘時光的旅程',
    startBtn: '推開花園的門',
    dedication: '獻給最親愛的奶奶',
    deviceSupport: { mobile: '手機', pc: '電腦', tablet: '平板' },
    guide: {
      steps: [
        { title: '花園起了霧', text: '奶奶，我們的花園裡最近起了一些霧，有些花兒看不清了。不過沒關係，我們慢慢來。', sub: '放鬆心情，深呼吸...' },
        { title: '記住這朵花', text: '花兒會一朵接一朵地盛開。請您仔細看著它們可愛的樣子。', sub: '每一朵花都會停留一會兒' },
        { title: '尋找記憶的影子', text: '如果看到這朵花，和"之前"的那朵一模一樣...', sub: '那就是記憶回來了！' },
        { title: '按下按鈕', text: '當您發現花朵重複出現時，就輕輕按下這個「似曾相識」的按鈕。', sub: '如果錯過了也沒關係，我們只是在散步。' }
      ],
      prev: '上一步',
      next: '下一步',
      done: '明白了'
    },
    menu: {
      weather: '今天天氣真好',
      prompt: '準備好去哪裡了嗎？',
      startWalk: '開始散步',
      levels: [
        { label: '初晨 (簡單)', desc: '和 剛剛那朵 一樣嗎？' },
        { label: '午後 (進階)', desc: '和 上上朵 一樣嗎？' },
        { label: '暮色 (挑戰)', desc: '尋找 更早之前 的花' }
      ],
      encounter: '次相遇',
      highScore: '最高'
    },
    game: {
      back: '返回',
      memoryFragment: '記憶碎片',
      waiting: '...',
      matched: '想起來了!',
      button: '似曾相識',
      warmup: '請先記住這朵花...',
      question: '這朵花之前出現過嗎？'
    },
    finished: {
      newRecord: '新紀錄!',
      title: '散步結束啦',
      desc: '您今天讓花園變得非常美麗。',
      awakened: '成功喚醒',
      count: '次記憶',
      again: '再走一回'
    }
  },
  'en-US': {
    title: 'Memory Garden',
    subtitle: 'A journey to reclaim forgotten moments',
    startBtn: 'Enter the Garden',
    dedication: 'Dedicated to dearest Grandma',
    deviceSupport: { mobile: 'Mobile', pc: 'PC', tablet: 'Tablet' },
    guide: {
      steps: [
        { title: 'The Garden is Misty', text: 'Grandma, the garden is a bit foggy lately. Some flowers are hard to see, but don\'t worry, let\'s take it slow.', sub: 'Relax and breathe...' },
        { title: 'Watch the Flowers', text: 'Flowers will bloom one by one. Please watch them carefully.', sub: 'Each flower stays for a moment' },
        { title: 'Find the Echo', text: 'If you see a flower that is the EXACT SAME as the one before...', sub: 'That is a memory returning!' },
        { title: 'Press the Button', text: 'When you spot a repeating flower, gently press the "Déjà vu" button.', sub: 'It\'s okay if you miss one, we are just strolling.' }
      ],
      prev: 'Back',
      next: 'Next',
      done: 'Got it'
    },
    menu: {
      weather: 'Lovely weather today',
      prompt: 'Where shall we go?',
      startWalk: 'Start Stroll',
      levels: [
        { label: 'Morning (Easy)', desc: 'Same as the PREVIOUS one?' },
        { label: 'Afternoon (Medium)', desc: 'Same as 2 flowers ago?' },
        { label: 'Twilight (Hard)', desc: 'Looking for deeper memories' }
      ],
      encounter: 'Encounters',
      highScore: 'Best'
    },
    game: {
      back: 'Back',
      memoryFragment: 'Memory',
      waiting: '...',
      matched: 'I remember!',
      button: 'Déjà vu',
      warmup: 'Remember this flower...',
      question: 'Have we seen this before?'
    },
    finished: {
      newRecord: 'New Record!',
      title: 'Stroll Finished',
      desc: 'You made the garden beautiful today.',
      awakened: 'Awakened',
      count: 'Memories',
      again: 'Walk Again'
    }
  }
};

// --- 游戏基础配置 (数值部分) ---
const BASE_GAME_CONFIG = {
  levels: [
    { n: 1, speed: 3500, totalTurns: 15 }, 
    { n: 2, speed: 3200, totalTurns: 20 }, 
    { n: 3, speed: 3000, totalTurns: 25 }, 
  ],
};

// --- 音频引擎 ---
const AudioEngine = {
  ctx: null,
  bgmNodes: [],
  isMuted: false,

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  playChime() {
    if (this.isMuted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const freqs = [523.25, 587.33, 659.25, 783.99, 880.00];
    const freq = freqs[Math.floor(Math.random() * freqs.length)];
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq / 2, this.ctx.currentTime + 1.5);
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 1.5);
  },

  playWood() {
    if (this.isMuted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  },

  startAmbience() {
    if (this.isMuted || !this.ctx || this.bgmNodes.length > 0) return;
    let lastOut = 0; 
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; 
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1;
    const gain = this.ctx.createGain();
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.02;
    gain.gain.value = 0.03;
    noise.connect(filter);
    filter.connect(gain);
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    gain.connect(this.ctx.destination);
    noise.start();
    lfo.start();
    this.bgmNodes = [noise, lfo, gain, lfoGain];
  },

  stopAmbience() {
    this.bgmNodes.forEach(node => {
      try { node.stop ? node.stop() : node.disconnect(); } catch(e) {}
    });
    this.bgmNodes = [];
  },
  
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) this.stopAmbience();
    else this.startAmbience();
    return this.isMuted;
  }
};

const App = () => {
  const [gameState, setGameState] = useState('intro'); 
  const [levelIndex, setLevelIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [showStimulus, setShowStimulus] = useState(false);
  const [userAnswered, setUserAnswered] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [highScores, setHighScores] = useState({}); 
  const [isNewRecord, setIsNewRecord] = useState(false); 
  const [guideStep, setGuideStep] = useState(0);
  const [lang, setLang] = useState('zh-CN'); // 默认语言

  const turnTimerRef = useRef(null);
  const nextTurnTimerRef = useRef(null);

  // 获取当前语言的文本包
  const t = TRANSLATIONS[lang];
  // 组合游戏配置与语言包
  const currentLevelConfig = BASE_GAME_CONFIG.levels[levelIndex];
  
  // --- Effects ---
  useEffect(() => {
    // 1. 设置 PWA Meta Tags
    const metaTags = [
      { name: 'theme-color', content: '#F2F0E9' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' }
    ];
    metaTags.forEach(tagData => {
      let tag = document.querySelector(`meta[name="${tagData.name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.name = tagData.name;
        document.head.appendChild(tag);
      }
      tag.content = tagData.content;
    });

    // 2. 加载本地存储
    const savedScores = localStorage.getItem('memory-garden-scores');
    if (savedScores) {
      try { setHighScores(JSON.parse(savedScores)); } catch (e) {}
    }
    const savedLang = localStorage.getItem('memory-garden-lang');
    if (savedLang && TRANSLATIONS[savedLang]) {
      setLang(savedLang);
    }
  }, []);

  const switchLanguage = () => {
    const langs = ['zh-CN', 'zh-TW', 'en-US'];
    const nextIndex = (langs.indexOf(lang) + 1) % langs.length;
    const nextLang = langs[nextIndex];
    setLang(nextLang);
    localStorage.setItem('memory-garden-lang', nextLang);
  };

  const handleInteraction = () => {
    AudioEngine.init();
    AudioEngine.resume();
  };

  const stopGame = () => {
    clearTimeout(turnTimerRef.current);
    clearTimeout(nextTurnTimerRef.current);
    setGameState('menu');
  };

  const startGame = () => {
    handleInteraction();
    if (!isMuted) AudioEngine.startAmbience();
    clearTimeout(turnTimerRef.current);
    clearTimeout(nextTurnTimerRef.current);

    setHistory([]);
    setCurrentTurn(0);
    setScore(0);
    setGameState('playing');
    setFeedback(null);
    setUserAnswered(false);
    setIsNewRecord(false);
    
    startTurn(0, []); 
  };

  const startTurn = (turnIndex, currentHistory) => {
    // 每次从配置中读取，确保是最新的
    const config = BASE_GAME_CONFIG.levels[levelIndex];

    if (turnIndex >= config.totalTurns) {
      endGame();
      return;
    }

    const n = config.n;
    let newFlower;
    if (currentHistory.length >= n && Math.random() < 0.4) { 
      newFlower = currentHistory[currentHistory.length - n];
    } else {
      newFlower = FLOWER_POOL[Math.floor(Math.random() * FLOWER_POOL.length)];
    }

    const newHistory = [...currentHistory, newFlower];
    setHistory(newHistory);
    
    setShowStimulus(true);
    setUserAnswered(false);
    setFeedback(null);

    turnTimerRef.current = setTimeout(() => {
        setShowStimulus(false);
        nextTurnTimerRef.current = setTimeout(() => {
           setCurrentTurn(prev => prev + 1);
           startTurn(turnIndex + 1, newHistory);
        }, 1000); 
    }, config.speed);
  };

  const handleMatch = () => {
    const n = currentLevelConfig.n;
    if (history.length <= n) return; 

    if (userAnswered || !showStimulus) return;
    
    handleInteraction();
    setUserAnswered(true);
    
    const currentIndex = history.length - 1;
    if (currentIndex >= n) {
      const currentItem = history[currentIndex];
      const targetItem = history[currentIndex - n];
      if (currentItem === targetItem) {
        setScore(prev => prev + 1);
        setFeedback('correct');
        AudioEngine.playChime();
      } else {
        setFeedback('wrong');
        AudioEngine.playWood();
      }
    } else {
      setFeedback('wrong');
      AudioEngine.playWood();
    }
  };

  const endGame = () => {
    clearTimeout(turnTimerRef.current);
    clearTimeout(nextTurnTimerRef.current);
    AudioEngine.stopAmbience();

    setScore(currentScore => {
        const currentBest = highScores[levelIndex] || 0;
        if (currentScore > currentBest) {
            const newHighScores = { ...highScores, [levelIndex]: currentScore };
            setHighScores(newHighScores);
            localStorage.setItem('memory-garden-scores', JSON.stringify(newHighScores));
            setIsNewRecord(true);
        }
        return currentScore;
    });

    setGameState('finished');
  };

  const toggleMute = () => {
    const muted = AudioEngine.toggleMute();
    setIsMuted(muted);
  };

  useEffect(() => {
    return () => {
      clearTimeout(turnTimerRef.current);
      clearTimeout(nextTurnTimerRef.current);
      AudioEngine.stopAmbience();
    };
  }, []);

  // --- Screens ---

  const IntroScreen = () => (
    <div className="flex flex-col items-center justify-center h-full w-full relative overflow-hidden animate-fade-in px-4">
      {/* 语言切换按钮 */}
      <button 
        onClick={switchLanguage}
        className="absolute top-6 right-6 z-20 bg-white/50 backdrop-blur-md p-2 rounded-full text-stone-600 hover:bg-white transition-all flex items-center gap-2 px-4 shadow-sm"
      >
        <Globe size={18} />
        <span className="text-sm font-medium">{lang === 'zh-CN' ? '简体' : lang === 'zh-TW' ? '繁體' : 'EN'}</span>
      </button>

      <div className="absolute top-10 right-10 opacity-30 animate-pulse-slow pointer-events-none"><CloudFog size={80} className="text-stone-400" /></div>
      <div className="absolute bottom-20 left-10 opacity-20 animate-float pointer-events-none"><Wind size={60} className="text-green-300" /></div>

      <div className="z-10 text-center flex flex-col items-center max-w-md w-full">
        <div className="mb-6 relative">
           <div className="w-40 h-40 sm:w-48 sm:h-48 bg-gradient-to-tr from-green-100 to-yellow-50 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.8)] animate-breathe-slow relative">
              <span className="text-8xl sm:text-9xl filter drop-shadow-sm transform -translate-y-2">🌻</span>
              <div className="absolute inset-0 animate-spin-slow opacity-60">
                 <div className="absolute top-0 left-1/2 w-3 h-3 bg-yellow-300 rounded-full blur-[2px]"></div>
                 <div className="absolute bottom-4 right-8 w-2 h-2 bg-green-300 rounded-full blur-[1px]"></div>
              </div>
           </div>
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-serif text-stone-700 font-bold mb-3 tracking-widest text-shadow">{t.title}</h1>
        <p className="text-stone-500 font-light text-lg sm:text-xl mb-10 tracking-wider">
          {t.subtitle}
        </p>

        <button 
          onClick={() => { handleInteraction(); setGameState('guide'); }}
          className="group relative bg-[#8FA895] text-white text-lg sm:text-xl py-4 px-12 sm:px-16 rounded-full shadow-xl transition-all duration-300 hover:bg-[#7D9683] hover:scale-105 active:scale-95 flex items-center gap-3 overflow-hidden w-full sm:w-auto justify-center"
        >
          <span className="relative z-10 font-serif">{t.startBtn}</span>
          <ArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform" />
          <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
        </button>

        {/* 设备支持提示 */}
        <div className="mt-8 flex gap-4 text-stone-400 opacity-60 text-xs">
            <span className="flex items-center gap-1"><Smartphone size={12}/> {t.deviceSupport.mobile}</span>
            <span className="flex items-center gap-1"><Monitor size={12}/> {t.deviceSupport.pc}</span>
            <span className="flex items-center gap-1"><Heart size={12}/> {t.deviceSupport.tablet}</span>
        </div>
      </div>
      
      {/* 底部版权和联系方式 */}
      <div className="absolute bottom-4 w-full flex flex-col items-center gap-1 text-stone-400 font-light">
         <div className="text-sm">{t.dedication}</div>
         <div className="text-[10px] opacity-60 font-sans">© Memory Garden | ycsy520@gmail.com</div>
      </div>
    </div>
  );

  const GuideScreen = () => {
    // 动态获取当前语言的引导文案
    const guideIcons = [
      <CloudFog size={64} className="text-stone-300" />,
      <div className="flex gap-4 items-center"><span className="text-6xl animate-pulse">🌹</span></div>,
      <div className="flex gap-2 items-center bg-white/50 p-4 rounded-xl border border-stone-200"><span className="text-4xl opacity-50 grayscale">🌹</span><ArrowRight size={20} className="text-stone-400"/><span className="text-5xl border-2 border-green-400 rounded-lg p-1 bg-white">🌹</span></div>,
      <div className="bg-[#8FA895] text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-lg"><BookOpen size={24} /> {t.game.button}</div>
    ];

    const steps = t.guide.steps;

    const nextStep = () => {
      if (guideStep < steps.length - 1) {
        setGuideStep(prev => prev + 1);
      } else {
        setGameState('menu');
      }
    };

    const prevStep = () => {
      if (guideStep > 0) setGuideStep(prev => prev - 1);
    };

    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-6 animate-fade-in bg-white/40 backdrop-blur-sm">
        <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-xl max-w-sm w-full min-h-[420px] flex flex-col items-center text-center relative border-4 border-white">
          <div className="flex gap-2 mb-6 sm:mb-8">
            {steps.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === guideStep ? 'bg-green-500 w-6' : 'bg-stone-200'}`}></div>
            ))}
          </div>

          <div className="flex-1 flex flex-col items-center justify-center w-full space-y-6">
            <div className="h-24 flex items-center justify-center transition-all duration-500 transform hover:scale-110">
              {guideIcons[guideStep]}
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-stone-700 mb-3 font-serif">{steps[guideStep].title}</h2>
              <p className="text-stone-600 text-lg leading-relaxed">{steps[guideStep].text}</p>
            </div>
            
            <p className="text-green-600/70 text-sm font-medium bg-green-50 px-3 py-1 rounded-full">
              {steps[guideStep].sub}
            </p>
          </div>

          <div className="w-full flex justify-between mt-8 pt-6 border-t border-stone-100">
             <button 
               onClick={prevStep}
               className={`text-stone-400 px-4 py-2 hover:text-stone-600 transition-colors ${guideStep === 0 ? 'opacity-0 pointer-events-none' : ''}`}
             >
               {t.guide.prev}
             </button>
             <button 
               onClick={nextStep}
               className="bg-stone-700 text-white px-6 sm:px-8 py-3 rounded-full hover:bg-stone-600 transition-all shadow-md active:scale-95 flex items-center gap-2"
             >
               {guideStep === steps.length - 1 ? t.guide.done : t.guide.next} 
               {guideStep < steps.length - 1 && <ArrowRight size={16} />}
             </button>
          </div>
        </div>
      </div>
    );
  };

  const MenuScreen = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-6 animate-fade-in p-6 w-full">
      <div className="text-center mb-4">
        <div className="bg-white/60 inline-flex items-center gap-2 px-4 py-2 rounded-full text-stone-500 text-sm mb-2 shadow-sm">
           <Sun size={14} className="text-orange-400"/> {t.menu.weather}
        </div>
        <h2 className="text-3xl font-serif text-stone-700">{t.menu.prompt}</h2>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {BASE_GAME_CONFIG.levels.map((level, idx) => (
          <button
            key={level.n}
            onClick={() => { handleInteraction(); setLevelIndex(idx); }}
            className={`w-full p-5 rounded-2xl text-left transition-all duration-300 relative overflow-hidden group border-2 ${
              levelIndex === idx 
                ? 'bg-white border-[#8FA895] shadow-lg scale-105 ring-4 ring-[#8FA895]/10' 
                : 'bg-white/40 border-transparent hover:bg-white/70'
            }`}
          >
            <div className="flex justify-between items-center pl-2">
              <div>
                <h3 className={`font-bold text-xl mb-1 ${levelIndex === idx ? 'text-stone-800' : 'text-stone-500'}`}>
                  {t.menu.levels[idx].label}
                </h3>
                <p className="text-stone-400 font-light text-sm sm:text-base">{t.menu.levels[idx].desc}</p>
                <div className="flex items-center gap-4 mt-2">
                    <div className="text-xs text-stone-400 flex items-center gap-1">
                      <Wind size={12}/> {level.totalTurns} {t.menu.encounter}
                    </div>
                    {highScores[idx] !== undefined && (
                        <div className="text-xs text-amber-500 flex items-center gap-1 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
                          <Trophy size={10}/> {t.menu.highScore}: {highScores[idx]}
                        </div>
                    )}
                </div>
              </div>
              {levelIndex === idx && <Sprout className="text-green-500 animate-bounce-gentle flex-shrink-0" size={24} />}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={startGame}
        className="mt-6 bg-gradient-to-r from-[#8FA895] to-[#7D9683] text-white text-xl py-4 px-20 rounded-full shadow-xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 font-serif w-full sm:w-auto justify-center"
      >
        <Wind className="animate-pulse" size={20} /> {t.menu.startWalk}
      </button>
    </div>
  );

  const GameScreen = () => {
    const isMatched = feedback === 'correct';
    const isWrong = feedback === 'wrong';
    const isWarmupPhase = history.length <= currentLevelConfig.n;
    const progress = ((currentTurn) / currentLevelConfig.totalTurns) * 100;
    // 获取当前难度的标签
    const currentLabel = t.menu.levels[levelIndex].label.split(' ')[0];

    return (
      <div className="flex flex-col h-full relative">
        <div className="flex justify-between items-center p-6 z-20">
          <button onClick={stopGame} className="text-stone-400 hover:text-stone-600 text-sm bg-white/50 px-3 py-1 rounded-full touch-manipulation">
             ← {t.game.back}
          </button>
          <div className="flex flex-col items-center">
            <span className="text-stone-600 font-serif font-bold text-lg">{currentLabel}</span>
          </div>
          <button onClick={toggleMute} className="p-2 rounded-full bg-white/50 text-stone-500 hover:bg-white transition-colors touch-manipulation">
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>

        <div className="absolute top-0 left-0 w-full h-2 bg-stone-200/50">
           <div className="h-full bg-[#8FA895] transition-all duration-1000 ease-linear rounded-r-full" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          <div className="relative mb-8 sm:mb-12">
            <div className={`
                w-56 h-72 sm:w-64 sm:h-80 bg-white p-4 pb-12 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-sm transform transition-all duration-700 ease-out flex flex-col items-center justify-center border-8 border-white
                ${showStimulus ? 'translate-y-0 opacity-100 rotate-1' : 'translate-y-4 opacity-50 rotate-0 grayscale'}
                ${isMatched ? 'ring-4 ring-green-200 scale-105' : ''}
                ${isWrong ? 'ring-4 ring-red-100' : ''}
            `}>
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-24 h-6 bg-yellow-100/80 rotate-2 shadow-sm z-20"></div>

              {!showStimulus && (
                <div className="absolute inset-4 bg-stone-100/90 z-20 backdrop-blur-sm flex items-center justify-center">
                   <div className="flex gap-1">
                     <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce"></div>
                     <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce delay-75"></div>
                     <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce delay-150"></div>
                   </div>
                </div>
              )}

              <div className="flex-1 flex items-center justify-center w-full bg-stone-50/50 inner-shadow rounded-sm overflow-hidden relative">
                 {showStimulus && (
                   <span className="text-8xl sm:text-9xl animate-bloom filter drop-shadow-md select-none">
                     {history[history.length - 1]}
                   </span>
                 )}
                 <div className="absolute inset-0 opacity-10 pointer-events-none bg-stone-900/5"></div>
              </div>
              
              <div className="h-6 w-full mt-4 flex items-center justify-center">
                <span className="font-handwriting text-stone-400 text-base sm:text-lg">
                   {showStimulus ? t.game.memoryFragment : t.game.waiting}
                </span>
              </div>

              {isMatched && (
                <div className="absolute -top-8 -right-8 bg-white text-green-600 px-4 sm:px-5 py-2 rounded-full shadow-xl flex items-center gap-2 animate-bounce-gentle border-2 border-green-50 z-30 whitespace-nowrap">
                  <Sparkles size={18} className="fill-current" /> {t.game.matched}
                </div>
              )}
            </div>
          </div>

          <div className="w-full px-6 sm:px-8 max-w-md pb-8">
            <button
              onClick={handleMatch}
              disabled={!showStimulus || userAnswered || isWarmupPhase}
              className={`
                group w-full py-5 sm:py-6 rounded-[2rem] font-serif text-xl sm:text-2xl tracking-wider transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden shadow-xl touch-manipulation
                ${
                  !showStimulus || userAnswered || isWarmupPhase
                  ? 'bg-stone-200 text-stone-400 cursor-default shadow-none'
                  : 'bg-[#8FA895] hover:bg-[#7D9683] active:bg-[#6c8271] text-white hover:-translate-y-1 active:translate-y-0 active:scale-98'
                }
              `}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Heart className={`${showStimulus && !userAnswered && !isWarmupPhase ? 'animate-pulse fill-white/20' : ''}`} size={24} />
              <span>{t.game.button}</span>
            </button>
            
            <p className="text-center mt-4 sm:mt-6 text-stone-400 text-sm sm:text-base h-6 font-light transition-opacity duration-300">
              {showStimulus && !userAnswered && (
                 isWarmupPhase 
                 ? t.game.warmup 
                 : t.game.question
              )}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const FinishedScreen = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-8 animate-fade-in p-8 text-center bg-white/40 backdrop-blur-sm">
        <div className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-2xl max-w-sm w-full border-4 border-white relative">
          
          {isNewRecord && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-400 text-white px-6 py-2 rounded-full font-bold shadow-lg animate-bounce whitespace-nowrap flex items-center gap-2">
                <Medal size={20} className="fill-current"/> {t.finished.newRecord}
            </div>
          )}

          <Trophy className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-[#8FA895] mb-6 opacity-80" />
          
          <h2 className="text-2xl sm:text-3xl font-serif text-stone-700 mb-4">{t.finished.title}</h2>
          <p className="text-stone-500 font-light mb-8 text-base sm:text-lg">{t.finished.desc}</p>
          
          <div className="bg-stone-50 p-6 rounded-2xl mb-8">
             <div className="text-sm text-stone-400 mb-1">{t.finished.awakened}</div>
             <div className="text-4xl font-bold text-stone-700">{score} <span className="text-lg font-normal text-stone-400">{t.finished.count}</span></div>
          </div>

          <button
            onClick={() => {
                AudioEngine.stopAmbience();
                setGameState('menu');
            }}
            className="w-full bg-stone-700 hover:bg-stone-800 text-white py-4 rounded-full font-serif text-lg transition-all flex items-center justify-center gap-2 shadow-lg touch-manipulation"
          >
            <RefreshCw size={20} />
            {t.finished.again}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen h-[100dvh] bg-[#F2F0E9] font-sans text-stone-800 overflow-hidden relative selection:bg-[#C8D6CD] selection:text-white touch-action-manipulation">
      {/* 动态背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F7F5EF] to-[#E6E2D6] z-0"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#E8F1EB] rounded-full blur-[100px] opacity-60 pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#F7E8D5] rounded-full blur-[80px] opacity-40 pointer-events-none"></div>
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

      <div className="relative z-10 h-full max-w-lg mx-auto shadow-2xl sm:border-x sm:border-stone-200/20 bg-white/30 backdrop-blur-[2px] transition-all duration-300">
        {gameState === 'intro' && <IntroScreen />}
        {gameState === 'guide' && <GuideScreen />}
        {gameState === 'menu' && <MenuScreen />}
        {gameState === 'playing' && <GameScreen />}
        {gameState === 'finished' && <FinishedScreen />}
      </div>

      <style>{`
        @keyframes bloom {
          0% { transform: scale(0.5) rotate(-10deg); opacity: 0; }
          60% { transform: scale(1.1) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        .animate-bloom { animation: bloom 0.9s cubic-bezier(0.34, 1.56, 0.64, 1); }
        
        @keyframes breathe-slow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-breathe-slow { animation: breathe-slow 5s ease-in-out infinite; }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }

        .font-serif { font-family: 'Georgia', 'Songti SC', 'STSong', serif; }
        .font-handwriting { font-family: 'Courier New', monospace; }
        .text-shadow { text-shadow: 2px 2px 4px rgba(0,0,0,0.1); }
        .inner-shadow { box-shadow: inset 0 2px 10px rgba(0,0,0,0.05); }
        .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        @keyframes bounce-gentle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .animate-bounce-gentle { animation: bounce-gentle 2s ease-in-out infinite; }

        .touch-manipulation {
            touch-action: manipulation;
        }
      `}</style>
    </div>
  );
};

export default App;