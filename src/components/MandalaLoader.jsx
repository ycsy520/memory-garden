/**
 * MandalaLoader — 花园过渡动画组件
 *
 * 用于散步模式刺激项之间的 gap 阶段，替换平淡的 "..."
 * 纯 SVG + CSS 动画，无 JS 运行时开销
 *
 * 设计规格：
 * - 8 瓣花瓣 + 2 层圆环 + 中心点
 * - 呼吸缩放（2.4s）+ 慢速旋转（12s）
 * - 颜色继承父元素（currentColor）
 * - 支持 prefers-reduced-motion
 *
 * @param {Object} props
 * @param {number} [props.size=40] - 显示尺寸（px）
 * @param {string} [props.color] - 颜色，默认继承 currentColor
 * @param {string} [props.className] - 额外 CSS 类名
 */
import { useTranslation } from 'react-i18next';

export default function MandalaLoader({ size = 40, color, className = '' }) {
  const { t } = useTranslation();
  const petalPath = 'M50 20 C56 28 56 38 50 44 C44 38 44 28 50 20';

  return (
    <span
      className={`mandala-loader ${className}`}
      role="status"
      aria-label={t('mandala.loading')}
      style={color ? { color } : undefined}
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <g className="mandala-breathe">
          <g className="mandala-spin">
            {/* 外环 */}
            <circle className="mandala-ring" cx="50" cy="50" r="30" />
            {/* 内环 */}
            <circle className="mandala-ring mandala-ring-soft" cx="50" cy="50" r="20" />
            {/* 花瓣 */}
            <g className="mandala-petals">
              {Array.from({ length: 8 }).map((_, i) => (
                <path
                  key={i}
                  d={petalPath}
                  transform={`rotate(${i * 45} 50 50)`}
                />
              ))}
            </g>
            {/* 中心点 */}
            <circle className="mandala-center" cx="50" cy="50" r="4" />
          </g>
        </g>
      </svg>
    </span>
  );
}
