/**
 * GardenBackground v3 — 精准坐标版
 *
 * 骨肉相连：叶片/花头精准锚定茎干坐标
 * 黄金疏密比：左重右轻、中间留白（突出主按钮）
 * 三层视差：远景极淡 → 中景花枝 → 近景色块遮挡
 *
 * @version 3.0
 */
import { useEffect, useRef, useState } from 'react';
import './GardenBackground.css';

/**
 * 鼠标视差 Hook
 * 通过 CSS 变量 --garden-mx / --garden-my 驱动三层位移
 * 使用 requestAnimationFrame + 线性插值实现平滑跟随
 *
 * @param {React.RefObject} rootRef - 容器 ref
 */
function useGardenParallax(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;
    let frameId = null;
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    function updateTarget(e) {
      const rect = root.getBoundingClientRect();
      target.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      target.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      if (!frameId) frameId = requestAnimationFrame(tick);
    }
    function tick() {
      current.x += (target.x - current.x) * 0.05;
      current.y += (target.y - current.y) * 0.05;
      root.style.setProperty('--garden-mx', current.x.toFixed(3));
      root.style.setProperty('--garden-my', current.y.toFixed(3));
      if (Math.abs(target.x - current.x) > 0.001) frameId = requestAnimationFrame(tick);
      else frameId = null;
    }
    root.addEventListener('pointermove', updateTarget);
    return () => { cancelAnimationFrame(frameId); root.removeEventListener('pointermove', updateTarget); };
  }, [rootRef]);
}

/**
 * 紧凑屏幕检测 Hook
 * 在手机断点下切换为“完整可见优先”的 SVG 布局策略
 *
 * @returns {boolean} 是否处于手机窄屏布局
 */
function useCompactGardenLayout() {
  const [isCompactLayout, setIsCompactLayout] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(max-width: 640px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;

    const mediaQuery = window.matchMedia('(max-width: 640px)');
    const handleChange = (event) => setIsCompactLayout(event.matches);

    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isCompactLayout;
}

/**
 * 花园背景主组件
 * 三层 SVG：远景（极淡色块+线条）、中景（左侧簇+右侧延伸）、近景（遮挡色块+蝴蝶）
 */
export default function GardenBackground() {
  const rootRef = useRef(null);
  const isCompactLayout = useCompactGardenLayout();
  useGardenParallax(rootRef);

  const topAspectRatio = isCompactLayout ? 'xMidYMin meet' : 'xMidYMin slice';
  const backgroundAspectRatio = isCompactLayout ? 'xMidYMid meet' : 'xMidYMid slice';
  const foregroundAspectRatio = isCompactLayout ? 'xMidYMax meet' : 'xMidYMid slice';
  const layoutShift = isCompactLayout
    ? {
        canopyLeft: 42,
        canopyRight: -42,
        hangingLeft: 54,
        hangingLeftSoft: 42,
        hangingRight: -56,
        plantLeft: 84,
        plantRight: -88,
        grass: 28,
        blobLeft: 36,
        blobRight: -34,
        dustLeft: 30,
        dustRight: -26,
      }
    : {
        canopyLeft: 0,
        canopyRight: 0,
        hangingLeft: 0,
        hangingLeftSoft: 0,
        hangingRight: 0,
        plantLeft: 0,
        plantRight: 0,
        grass: 0,
        blobLeft: 0,
        blobRight: 0,
        dustLeft: 0,
        dustRight: 0,
      };

  return (
    <div
      ref={rootRef}
      className={`garden-bg${isCompactLayout ? ' garden-bg--compact' : ''}`}
      aria-hidden="true"
    >
      {/* 顶部垂落层：补足上半区留白，形成上下包裹感 */}
      <svg className="garden-svg top-layer" viewBox="0 0 1200 800" preserveAspectRatio={topAspectRatio}>
        <g className="parallax-item" style={{ '--depth': -0.03 }}>
          <g className="canopy-shadow">
            <path d="M-40 36 C150 6 258 40 356 108" className="canopy-line" />
            <path d="M1240 28 C1080 10 980 38 892 116" className="canopy-line canopy-line-soft" />
            <ellipse
              cx={202 + layoutShift.canopyLeft}
              cy="78"
              rx="62"
              ry="16"
              transform={`rotate(12 ${202 + layoutShift.canopyLeft} 78)`}
              className="canopy-leaf"
            />
            <ellipse
              cx={962 + layoutShift.canopyRight}
              cy="88"
              rx="56"
              ry="14"
              transform={`rotate(-10 ${962 + layoutShift.canopyRight} 88)`}
              className="canopy-leaf canopy-leaf-soft"
            />
          </g>

          <g transform={`translate(${layoutShift.hangingLeft} 0)`}>
            <g className="hanging-group hanging-left">
              <path d="M110 -40 C130 40 140 140 130 255" className="vine" />
              <path d="M165 -20 C185 70 182 150 172 220" className="vine-soft" />
              <ellipse cx="122" cy="88" rx="26" ry="10" transform="rotate(38 122 88)" className="vine-leaf" />
              <ellipse cx="142" cy="150" rx="22" ry="9" transform="rotate(-24 142 150)" className="vine-leaf-alt" />
              <ellipse cx="160" cy="208" rx="18" ry="8" transform="rotate(28 160 208)" className="vine-leaf" />
              <circle cx="128" cy="242" r="7" className="vine-bloom" />
              <circle cx="117" cy="232" r="5" className="vine-bloom-light" />
              <circle cx="140" cy="236" r="4" className="vine-bloom-light" />
            </g>
          </g>

          <g transform={`translate(${layoutShift.hangingLeftSoft} 0)`}>
            <g className="hanging-group hanging-left-soft">
              <path d="M255 -30 C270 35 278 108 270 188" className="vine-soft" />
              <ellipse cx="264" cy="76" rx="18" ry="7" transform="rotate(28 264 76)" className="vine-leaf-alt" />
              <ellipse cx="275" cy="126" rx="16" ry="6" transform="rotate(-26 275 126)" className="vine-leaf" />
              <circle cx="270" cy="188" r="4" className="vine-bloom-light" />
            </g>
          </g>

          <g transform={`translate(${layoutShift.hangingRight} 0)`}>
            <g className="hanging-group hanging-right">
              <path d="M1015 -28 C1005 38 1002 100 1008 172" className="vine-soft" />
              <ellipse cx="1008" cy="70" rx="17" ry="7" transform="rotate(-34 1008 70)" className="vine-leaf" />
              <ellipse cx="996" cy="128" rx="15" ry="6" transform="rotate(24 996 128)" className="vine-leaf-alt" />
              <circle cx="1008" cy="172" r="4" className="vine-bloom-light" />
            </g>
          </g>

          <g className="top-dust">
            <circle cx={458 + layoutShift.dustLeft} cy="86" r="3" className="dot-memory" />
            <circle cx={735 + layoutShift.dustRight} cy="62" r="2.5" className="dot-memory dot-memory-soft" />
          </g>
        </g>
      </svg>

      <div className="garden-top-haze" />
      <div className="garden-focus-glow" />

      {/* 远景层：极淡，增加空间深度 */}
      <svg className="garden-svg back-layer" viewBox="0 0 1200 800" preserveAspectRatio={backgroundAspectRatio}>
        <g className="parallax-item" style={{ '--depth': -0.02 }}>
           <path d="M100 800 Q150 400 50 100" className="line-soft" />
           <circle cx="50" cy="100" r="40" className="blob-soft" />
           <path d="M1000 800 Q900 500 1100 200" className="line-soft" />
           <circle cx="1100" cy="200" r="60" className="blob-soft" />
        </g>
      </svg>

      {/* 主花园层：优化了对齐和簇状分布 */}
      <svg className="garden-svg main-layer" viewBox="0 0 1200 800" preserveAspectRatio={foregroundAspectRatio}>
        <g className="parallax-item" style={{ '--depth': -0.06 }}>
          {/* 左侧簇：重心 */}
          <g transform={`translate(${layoutShift.plantLeft} 0)`}>
            <g className="plant-group plant-1">
              <path d="M200 850 C180 700 250 600 220 450" className="stem" />
              {/* 叶片精准对齐茎干坐标 */}
              <ellipse cx="205" cy="650" rx="45" ry="15" transform="rotate(-30 205 650)" className="leaf" />
              <ellipse cx="235" cy="580" rx="40" ry="12" transform="rotate(20 235 580)" className="leaf-alt" />
              {/* 顶端碎花簇 */}
              <circle cx="220" cy="450" r="12" className="flower-p" />
              <circle cx="205" cy="440" r="8" className="flower-p-light" />
              <circle cx="235" cy="445" r="9" className="flower-p-light" />
            </g>
          </g>

          {/* 右侧：延伸感 */}
          <g transform={`translate(${layoutShift.plantRight} 0)`}>
            <g className="plant-group plant-2">
              <path d="M950 850 C980 750 920 650 940 520" className="stem" />
              <ellipse cx="965" cy="680" rx="50" ry="18" transform="rotate(15 965 680)" className="leaf" />
              <circle cx="940" cy="520" r="14" className="flower-b" />
              <circle cx="925" cy="505" r="10" className="flower-b-light" />
            </g>
          </g>

          {/* 装饰性小草 */}
          <path d={`M${400 + layoutShift.grass} 850 Q${410 + layoutShift.grass} 780 ${390 + layoutShift.grass} 720`} className="stem-thin" />
          <circle cx={390 + layoutShift.grass} cy="720" r="6" className="dot-memory" />
        </g>
      </svg>

      {/* 近景层：大色块遮挡，增加沉浸感 */}
      <svg className="garden-svg front-layer" viewBox="0 0 1200 800" preserveAspectRatio={foregroundAspectRatio}>
        <g className="parallax-item" style={{ '--depth': -0.12 }}>
          <ellipse cx={50 + layoutShift.blobLeft} cy="800" rx="150" ry="60" className="foreground-blob" />
          <ellipse cx={1150 + layoutShift.blobRight} cy="780" rx="120" ry="50" className="foreground-blob" />
          {/* 漂浮的蝴蝶 */}
          <g className="butterfly">
             <ellipse cx="0" cy="0" rx="12" ry="6" transform="rotate(-30)" className="wing" />
             <ellipse cx="15" cy="-2" rx="12" ry="6" transform="rotate(20)" className="wing" />
          </g>
        </g>
      </svg>
    </div>
  );
}
