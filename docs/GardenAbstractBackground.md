# **一、视觉方向**

## **1. 核心风格**

建议定义为：

```text
极简后现代记忆花园
```

关键词：

```text
线条
色块
抽象花
几何叶片
轻微错位
留白
低饱和色
慢动画
非写实
纸面感
```

它不是“画一片真实花园”，而是“像一本旧日记里画出来的花园符号”。

你可以参考这种视觉语言：

- 花不是完整花朵，而是几个圆点和一条弯线；
- 草不是草丛，而是几条高低不同的竖线；
- 蝴蝶不是具体昆虫，而是两个不对称椭圆；
- 露珠是半透明圆点；
- 小路是几块不规则色块；
- 风是几条很淡的曲线；
- 记忆感来自图形的错位、透明、重复和轻微漂移。

---

## **二、最终效果建议**

首页背景不要铺满复杂图案，而是分成三个视觉区域：

```text
上方：大量留白，承载标题和按钮
中部：几条淡色曲线、少量漂浮圆点
底部：抽象花草线条与色块组成的花园边界
```

视觉上像这样：

```text
┌──────────────────────────────┐
│                              │
│        今天去花园散步吗？       │
│                              │
│      ○        〜       ◦       │
│           ︵        ○          │
│                              │
│    │     ╱│       ○─○          │
│  ●─│   ╱  │   ◯    │     ◒     │
│  │ │  │   │  ╱│╲   │    ╱│     │
│▁▂▃▁▂▁▃▂▁▁▂▃▁▂▁▃▁▂▁│
└──────────────────────────────┘
```

重点不是丰富，而是“安静、轻微、有生命”。

---

## **三、技术方案总览**

### **推荐实现**

```text
React 组件
+ 一个内联 SVG
+ 少量 CSS 动画
+ CSS 变量控制视差
+ 不使用图片
+ 不使用 canvas
+ 不使用 Three.js
+ 不使用 Framer Motion
```

组件命名：

```text
GardenAbstractBackground
```

目录建议：

```text
src/
  components/
    garden/
      GardenAbstractBackground/
        GardenAbstractBackground.jsx
        GardenAbstractBackground.css
        useAbstractParallax.js
```

---

## **四、为什么纯 SVG 更适合你**

| 维度 | 纯 SVG 方案 | 图片分层方案 |
|---|---|---|
| 视觉一致性 | 高，完全可控 | 依赖素材风格 |
| 包体积 | 很小 | 图片会变大 |
| 响应式 | 天然缩放 | 需要多尺寸图片 |
| 动画 | 可以单独控制每条线 | 图片内部不可控 |
| 后现代感 | 强 | 容易变插画风 |
| 维护成本 | 低 | 需要切图、压缩、适配 |
| 性能 | 好 | 透明图片多会 overdraw |
| 叙事联动 | 容易改颜色/显示 | 要准备多套图片 |

结论：**首页背景第一版强烈建议纯 SVG。**

---

## **五、视觉元素系统**

### **1. 抽象花**

用最简单的几何图形表示：

```text
花茎：path 曲线
花心：circle
花瓣：几个 circle / ellipse
```

例如：

```svg
<g class="flower flowerA">
  <path d="M120 520 C118 470, 130 430, 122 390" />
  <circle cx="122" cy="386" r="7" />
  <circle cx="112" cy="380" r="8" />
  <circle cx="132" cy="378" r="8" />
  <circle cx="121" cy="368" r="8" />
</g>
```

### **2. 抽象叶子**

```svg
<path d="M210 520 C220 480, 250 455, 280 450" />
<ellipse cx="250" cy="465" rx="18" ry="7" transform="rotate(-25 250 465)" />
```

### **3. 抽象草**

```svg
<path d="M40 560 C45 520, 42 490, 50 460" />
<path d="M70 560 C68 525, 80 500, 86 470" />
```

### **4. 露珠 / 记忆点**

```svg
<circle class="memoryDot" cx="360" cy="280" r="4" />
<circle class="memoryDot small" cx="520" cy="230" r="2" />
```

### **5. 风线**

```svg
<path class="windLine" d="M180 260 C240 230, 310 250, 360 220" />
```

### **6. 小路色块**

底部用不规则圆角矩形或 path：

```svg
<path class="stone stoneA" d="M80 570 C95 555, 125 555, 140 570 C130 590, 95 592, 80 570Z" />
```

---

## **六、颜色系统**

后现代但温暖，建议不要用太真实的绿色大草地。用低饱和的色块。

```css
:root {
  --garden-bg: #fbf7ec;
  --garden-ink: #263528;
  --garden-line: rgba(38, 53, 40, 0.42);
  --garden-line-soft: rgba(38, 53, 40, 0.18);

  --garden-green: #8fae7b;
  --garden-green-dark: #5f7d57;
  --garden-yellow: #f1c96b;
  --garden-pink: #e78aa4;
  --garden-blue: #9bb8d3;
  --garden-purple: #c6a4d8;
  --garden-cream: #fff7dd;
  --garden-stone: #d7cfb8;
}
```

整体原则：

- 背景米白；
- 线条深绿灰；
- 花朵只用 3 到 5 个颜色；
- 透明度较低；
- 不做强烈渐变；
- 不做鲜艳卡通色。

---

## **七、动画原则**

动画只做三类：

| 动画 | 幅度 | 目的 |
|---|---:|---|
| 线条轻摆 | 1° 到 2° | 像风 |
| 圆点漂浮 | 4px 到 8px | 像记忆浮动 |
| 鼠标视差 | 最大 8px 到 16px | 轻微空间感 |

不要做：

- 大量粒子；
- 快速飞舞；
- 闪烁；
- 花瓣爆炸；
- 复杂路径运动；
- 真实 3D。

---

## **八、组件实现**

### **1. `useAbstractParallax.js`**

这个版本比之前更简单，只更新 SVG 容器 CSS 变量。

```js
import { useEffect, useRef } from 'react';

export function useAbstractParallax(ref, disabled = false) {
  const frameRef = useRef(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;

    const updateTarget = (event) => {
      const rect = el.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

      targetRef.current.x = Math.max(-1, Math.min(1, x));
      targetRef.current.y = Math.max(-1, Math.min(1, y));

      if (!frameRef.current) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    const tick = () => {
      const current = currentRef.current;
      const target = targetRef.current;

      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;

      el.style.setProperty('--mx', current.x.toFixed(3));
      el.style.setProperty('--my', current.y.toFixed(3));

      if (
        Math.abs(target.x - current.x) > 0.002 ||
        Math.abs(target.y - current.y) > 0.002
      ) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        frameRef.current = null;
      }
    };

    const reset = () => {
      targetRef.current.x = 0;
      targetRef.current.y = 0;

      if (!frameRef.current) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    el.addEventListener('pointermove', updateTarget, { passive: true });
    el.addEventListener('pointerleave', reset, { passive: true });

    return () => {
      el.removeEventListener('pointermove', updateTarget);
      el.removeEventListener('pointerleave', reset);

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [ref, disabled]);
}
```

---

### **2. `GardenAbstractBackground.jsx`**

```jsx
import { useRef } from 'react';
import { useAbstractParallax } from './useAbstractParallax';
import './GardenAbstractBackground.css';

export function GardenAbstractBackground({
  reducedMotion = false,
  variant = 'morning'
}) {
  const rootRef = useRef(null);

  useAbstractParallax(rootRef, reducedMotion);

  return (
    <div
      ref={rootRef}
      className="gardenAbstractBg"
      data-variant={variant}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      aria-hidden="true"
    >
      <svg
        className="gardenAbstractSvg"
        viewBox="0 0 1200 720"
        preserveAspectRatio="xMidYMid slice"
        role="img"
      >
        <rect width="1200" height="720" className="bgBase" />

        {/* 远处色块 */}
        <g className="layer layerBack">
          <circle className="softBlob blobA" cx="230" cy="180" r="90" />
          <circle className="softBlob blobB" cx="960" cy="160" r="120" />
          <path className="windLine" d="M160 260 C260 210, 330 275, 430 230" />
          <path className="windLine windLineTwo" d="M700 250 C780 220, 860 255, 960 218" />
        </g>

        {/* 记忆点 */}
        <g className="layer layerDots">
          <circle className="memoryDot dotA" cx="330" cy="240" r="5" />
          <circle className="memoryDot dotB" cx="520" cy="180" r="3" />
          <circle className="memoryDot dotC" cx="850" cy="260" r="4" />
          <circle className="memoryDot dotD" cx="1010" cy="330" r="3" />
        </g>

        {/* 中景抽象花草 */}
        <g className="layer layerMid gardenLines">
          <g className="plant plantA">
            <path d="M180 660 C176 585, 205 520, 190 450" />
            <ellipse cx="176" cy="545" rx="34" ry="9" />
            <ellipse cx="202" cy="505" rx="30" ry="8" />
            <circle className="flowerPink" cx="190" cy="440" r="9" />
            <circle className="flowerPink pale" cx="176" cy="438" r="8" />
            <circle className="flowerPink pale" cx="204" cy="438" r="8" />
            <circle className="flowerYellow" cx="190" cy="440" r="4" />
          </g>

          <g className="plant plantB">
            <path d="M380 670 C390 610, 375 540, 410 470" />
            <path d="M410 470 C438 448, 470 452, 494 470" />
            <circle className="flowerBlue" cx="494" cy="470" r="9" />
            <circle className="flowerBlue" cx="470" cy="458" r="7" />
            <circle className="flowerBlue" cx="442" cy="462" r="8" />
          </g>

          <g className="plant plantC">
            <path d="M640 670 C635 610, 668 565, 650 500" />
            <circle className="flowerYellow" cx="650" cy="494" r="10" />
            <circle className="flowerPink" cx="636" cy="492" r="8" />
            <circle className="flowerPurple" cx="664" cy="492" r="8" />
          </g>

          <g className="plant plantD">
            <path d="M880 675 C890 610, 850 555, 870 485" />
            <circle className="flowerPink" cx="870" cy="485" r="8" />
            <circle className="flowerPink" cx="890" cy="498" r="7" />
            <circle className="flowerPink" cx="852" cy="505" r="6" />
          </g>
        </g>

        {/* 底部小路 / 色块 */}
        <g className="layer layerStones">
          <path className="stone stoneA" d="M80 680 C100 658, 145 658, 165 680 C145 704, 104 704, 80 680Z" />
          <path className="stone stoneB" d="M220 690 C245 672, 290 670, 310 690 C290 710, 240 710, 220 690Z" />
          <path className="stone stoneC" d="M760 684 C785 662, 835 662, 850 686 C830 708, 785 705, 760 684Z" />
          <path className="stone stoneD" d="M930 690 C950 670, 995 670, 1016 690 C994 713, 950 710, 930 690Z" />
        </g>

        {/* 前景极简草线 */}
        <g className="layer layerFront gardenLines">
          <path className="grass grassA" d="M40 720 C50 660, 44 610, 72 560" />
          <path className="grass grassB" d="M96 720 C90 650, 120 620, 130 550" />
          <path className="grass grassC" d="M1080 720 C1074 650, 1090 610, 1120 560" />
          <path className="grass grassD" d="M1140 720 C1130 660, 1160 620, 1170 570" />
        </g>

        {/* 抽象蝴蝶 */}
        <g className="layer layerLife butterfly">
          <ellipse cx="265" cy="350" rx="15" ry="8" transform="rotate(-25 265 350)" />
          <ellipse cx="292" cy="348" rx="15" ry="8" transform="rotate(25 292 348)" />
          <path d="M278 350 C282 358, 284 365, 286 372" />
        </g>
      </svg>
    </div>
  );
}
```

这个 SVG 故意保持简单。后续你可以继续加 2-3 个抽象植物组，但第一版不要超过 80 个 SVG 节点。

---

## **九、CSS 实现**

```css
.gardenAbstractBg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: auto;
  background: #fbf7ec;

  --mx: 0;
  --my: 0;
}

.gardenAbstractSvg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.bgBase {
  fill: #fbf7ec;
}

.layer {
  transform-box: fill-box;
  transform-origin: center;
  will-change: transform;
}

.layerBack {
  transform: translate3d(
    calc(var(--mx) * -5px),
    calc(var(--my) * -3px),
    0
  );
}

.layerDots {
  transform: translate3d(
    calc(var(--mx) * -9px),
    calc(var(--my) * -6px),
    0
  );
}

.layerMid {
  transform: translate3d(
    calc(var(--mx) * -13px),
    calc(var(--my) * -8px),
    0
  );
}

.layerStones {
  transform: translate3d(
    calc(var(--mx) * -8px),
    calc(var(--my) * -3px),
    0
  );
}

.layerFront {
  transform: translate3d(
    calc(var(--mx) * -18px),
    calc(var(--my) * -9px),
    0
  );
}

.layerLife {
  transform: translate3d(
    calc(var(--mx) * -16px),
    calc(var(--my) * -12px),
    0
  );
}
```

---

## **十、线条与色块样式**

```css
.gardenLines path {
  fill: none;
  stroke: rgba(38, 53, 40, 0.55);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.gardenLines ellipse {
  fill: rgba(143, 174, 123, 0.36);
  stroke: rgba(38, 53, 40, 0.42);
  stroke-width: 2;
}

.softBlob {
  fill: rgba(143, 174, 123, 0.1);
}

.blobA {
  fill: rgba(231, 138, 164, 0.12);
}

.blobB {
  fill: rgba(155, 184, 211, 0.13);
}

.windLine {
  fill: none;
  stroke: rgba(38, 53, 40, 0.12);
  stroke-width: 2;
  stroke-linecap: round;
}

.windLineTwo {
  stroke: rgba(38, 53, 40, 0.09);
}

.memoryDot {
  fill: rgba(95, 125, 87, 0.24);
}

.dotA {
  animation: dotFloat 8s ease-in-out infinite;
}

.dotB {
  animation: dotFloat 10s ease-in-out infinite reverse;
}

.dotC {
  animation: dotFloat 9s ease-in-out infinite;
}

.dotD {
  animation: dotFloat 11s ease-in-out infinite reverse;
}

.flowerPink {
  fill: #e78aa4;
}

.flowerPink.pale {
  fill: rgba(231, 138, 164, 0.72);
}

.flowerYellow {
  fill: #f1c96b;
}

.flowerBlue {
  fill: #9bb8d3;
}

.flowerPurple {
  fill: #c6a4d8;
}

.stone {
  fill: rgba(215, 207, 184, 0.72);
  stroke: rgba(38, 53, 40, 0.18);
  stroke-width: 2;
}
```

---

## **十一、动效样式**

```css
.plant {
  transform-box: fill-box;
  transform-origin: bottom center;
  animation: plantSway 7s ease-in-out infinite;
}

.plantB {
  animation-duration: 8.4s;
  animation-delay: -1.8s;
}

.plantC {
  animation-duration: 6.8s;
  animation-delay: -3.2s;
}

.plantD {
  animation-duration: 9s;
  animation-delay: -2.4s;
}

@keyframes plantSway {
  0%, 100% {
    transform: rotate(-0.8deg) translateY(0);
  }
  50% {
    transform: rotate(1deg) translateY(-2px);
  }
}

@keyframes dotFloat {
  0%, 100% {
    transform: translateY(0);
    opacity: 0.45;
  }
  50% {
    transform: translateY(-8px);
    opacity: 0.75;
  }
}

.butterfly {
  fill: rgba(38, 53, 40, 0.45);
  stroke: rgba(38, 53, 40, 0.5);
  stroke-width: 1.5;
  animation: butterflyDrift 16s ease-in-out infinite;
}

@keyframes butterflyDrift {
  0%, 100% {
    transform: translate3d(
      calc(var(--mx) * -16px),
      calc(var(--my) * -12px),
      0
    ) rotate(-4deg);
  }
  50% {
    transform: translate3d(
      calc(var(--mx) * -16px + 18px),
      calc(var(--my) * -12px - 10px),
      0
    ) rotate(5deg);
  }
}
```

注意这里 `.butterfly` 本身既承担视差又承担动画，会覆盖 `.layerLife` 的 transform。因为它本身就是 `layer layerLife butterfly`，CSS 后面的 `.butterfly` 会覆盖前面 `.layerLife`。上面 `butterflyDrift` 已经把视差计算写进去了，所以没问题。

如果你想更干净，可以拆成：

```svg
<g className="layer layerLife">
  <g className="butterfly">...</g>
</g>
```

这样 `.layerLife` 负责视差，`.butterfly` 负责自身漂移。

更推荐拆开。

---

## **十二、减少动效**

```css
@media (prefers-reduced-motion: reduce) {
  .plant,
  .memoryDot,
  .butterfly {
    animation: none !important;
  }

  .layerBack,
  .layerDots,
  .layerMid,
  .layerStones,
  .layerFront,
  .layerLife {
    transform: none !important;
  }
}

.gardenAbstractBg[data-reduced-motion="true"] .plant,
.gardenAbstractBg[data-reduced-motion="true"] .memoryDot,
.gardenAbstractBg[data-reduced-motion="true"] .butterfly {
  animation: none !important;
}

.gardenAbstractBg[data-reduced-motion="true"] .layer {
  transform: none !important;
}
```

---

## **十三、响应式布局**

### **1. 桌面**

SVG `viewBox="0 0 1200 720"`，底部花园占 30% 左右高度。

### **2. 手机**

手机上底部花园可以更高一点，但不要挡按钮。

```css
@media (max-width: 768px) {
  .gardenAbstractSvg {
    width: 150%;
    left: -25%;
  }

  .layerBack {
    opacity: 0.7;
  }

  .windLine {
    opacity: 0.6;
  }
}

@media (max-width: 420px) {
  .gardenAbstractSvg {
    width: 185%;
    left: -42%;
  }

  .softBlob {
    opacity: 0.7;
  }

  .butterfly {
    display: none;
  }
}
```

不过更干净的方式是用 SVG preserveAspectRatio 控制。第一版用 CSS 放大即可。

---

## **十四、与首页内容结合**

首页不要让文字直接压在复杂线条上。建议文字卡片更极简：

```css
.homePage {
  position: relative;
  min-height: 100dvh;
  overflow: hidden;
  background: #fbf7ec;
}

.homeContent {
  position: relative;
  z-index: 2;
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.homeHero {
  width: min(560px, calc(100vw - 40px));
  text-align: center;
  padding: 32px 28px;
  border: 1px solid rgba(38, 53, 40, 0.08);
  border-radius: 28px;
  background: rgba(251, 247, 236, 0.72);
  backdrop-filter: blur(10px);
}

.homeHero h1 {
  margin: 0;
  font-size: clamp(34px, 6vw, 68px);
  line-height: 1.05;
  color: #263528;
  letter-spacing: -0.04em;
}

.homeHero p {
  max-width: 380px;
  margin: 16px auto 0;
  font-size: clamp(16px, 2vw, 19px);
  line-height: 1.8;
  color: rgba(38, 53, 40, 0.72);
}
```

这个和抽象 SVG 背景会比较搭。

---

## **十五、可选：随机生成抽象花园**

如果你想更“后现代”，可以不手写所有 SVG，而是用数组生成一组植物。

### **数据配置**

```js
const plants = [
  { x: 120, h: 180, color: 'pink', tilt: -8 },
  { x: 260, h: 230, color: 'blue', tilt: 4 },
  { x: 440, h: 160, color: 'yellow', tilt: -3 },
  { x: 680, h: 210, color: 'purple', tilt: 5 },
  { x: 930, h: 190, color: 'pink', tilt: -5 }
];
```

### **渲染**

```jsx
{plants.map((p) => (
  <g
    key={p.x}
    className="plant generatedPlant"
    transform={`translate(${p.x} 0) rotate(${p.tilt} ${p.x} 660)`}
  >
    <path d={`M0 660 C${p.tilt} ${660 - p.h / 2}, ${-p.tilt} ${660 - p.h}, 0 ${660 - p.h}`} />
    <circle className={`flower-${p.color}`} cx="0" cy={660 - p.h} r="8" />
    <circle className={`flower-${p.color}`} cx="-12" cy={660 - p.h + 4} r="7" />
    <circle className={`flower-${p.color}`} cx="12" cy={660 - p.h + 4} r="7" />
  </g>
))}
```

不过第一版我建议先手写 SVG。手写更可控，也更容易做构图。

---

## **十六、叙事联动的极简实现**

以后可以把叙事解锁映射到抽象元素颜色。

例如：

| 收藏品 | 未解锁 | 已解锁 |
|---|---|---|
| 小花盆 | 灰色小矩形 | 米色花盆 + 小芽 |
| 蝴蝶 | 淡线稿 | 深色抽象蝴蝶 |
| 萤火虫 | 不显示 | 两三个微光圆点 |
| 风车 | 线条十字 | 彩色色块风车 |
| 小石头 | 底部淡色块 | 更明显小路色块 |

技术上不需要换图片，只需要 class：

```jsx
<g className={`butterfly ${unlocked.includes('butterfly') ? 'unlocked' : 'locked'}`}>
```

CSS：

```css
.butterfly.locked {
  opacity: 0.16;
  filter: grayscale(1);
}

.butterfly.unlocked {
  opacity: 0.68;
}
```

---

## **十七、实施任务清单**

### **P0：极简静态 SVG 背景**

目标：先完成视觉方向。

任务：

1. 新建 `GardenAbstractBackground.jsx`；
2. 新建 `GardenAbstractBackground.css`；
3. 手写一版 SVG 花园；
4. 接入首页；
5. 保证按钮和文字层级正确。

验收：

```text
首页有抽象花园气质
没有图片依赖
无动画也成立
手机不遮挡按钮
```

---

### **P1：轻微动效**

任务：

1. 添加植物轻摆；
2. 添加记忆点漂浮；
3. 添加一只抽象蝴蝶；
4. 添加 reduced-motion 降级。

验收：

```text
动画非常轻
不晕
不抢注意力
减少动效后静止
```

---

### **P2：鼠标视差**

任务：

1. 添加 `useAbstractParallax`；
2. CSS 变量 `--mx`、`--my`；
3. 不同 layer 不同位移；
4. pointerleave 回中。

验收：

```text
桌面移动鼠标有轻微空间感
最大位移不超过 18px
React 不频繁重渲染
```

---

### **P3：叙事联动**

任务：

1. 接入 `useAchievementStore`；
2. 根据解锁状态改变元素透明度；
3. 解锁蝴蝶后显示更明显的蝴蝶；
4. 解锁萤火虫后在暮色主题显示圆点微光。

验收：

```text
叙事状态能改变首页背景
未解锁不暴露完整故事
背景仍保持极简
```

---

## **十八、风险控制**

| 风险 | 控制方式 |
|---|---|
| SVG 太复杂影响性能 | 控制在 100 个节点以内 |
| 后现代过头，看不出花园 | 保留花、叶、草、蝴蝶的基本识别符号 |
| 动效干扰老人 | 默认慢动画，支持 reduced motion |
| 首页文字不清楚 | 中央内容加米白半透明卡片 |
| 手机构图被裁坏 | 使用 viewBox + 移动端放大居中 |
| 颜色太杂 | 限制 5 个主色 |

---

## **十九、最终推荐效果**

你要的不是“漂亮插画”，而是一个有记忆感的图形系统。

最终首页应该像：

```text
一本旧花园日记的封面
上面有几条线
几块色
几朵不像花但又像花的花
鼠标轻轻动时
它们像想起什么一样晃一下
```
