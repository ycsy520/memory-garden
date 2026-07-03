/**
 * PhaseMachine 单元测试 — 四阶段状态机
 */
import { describe, it, expect, beforeEach } from 'vitest';
import PhaseMachine from '../PhaseMachine';

const defaultConfig = {
  fadeIn: 300,
  visible: 2500,
  fadeOut: 300,
  gap: 1000,
};

describe('PhaseMachine', () => {
  let pm;

  beforeEach(() => {
    pm = new PhaseMachine(defaultConfig);
  });

  describe('初始状态', () => {
    it('应该从 idle 阶段开始', () => {
      expect(pm.current()).toBe('idle');
    });

    it('idle 阶段不应有反应窗口', () => {
      expect(pm.isResponseWindow()).toBe(false);
    });
  });

  describe('startTrial', () => {
    it('应该进入 fadeIn 阶段', () => {
      pm.startTrial();
      expect(pm.current()).toBe('fadeIn');
    });
  });

  /**
   * 辅助函数：逐帧模拟推进（GameLoop 每帧 ~16ms delta）
   * PhaseMachine.advance 每次只处理一个阶段切换，
   * 这是正确的设计 — rAF 驱动下 delta 永远 < 100ms
   */
  function advanceThrough(phaseMachine, durationMs, frameSize = 16) {
    let remaining = durationMs;
    while (remaining > 0) {
      const delta = Math.min(frameSize, remaining);
      phaseMachine.advance(delta);
      remaining -= delta;
      // 如果进入 idle（trial 结束），停止
      if (phaseMachine.current() === 'idle') break;
    }
  }

  describe('四阶段推进', () => {
    it('fadeIn → visible', () => {
      pm.startTrial();
      advanceThrough(pm, 300);
      expect(pm.current()).toBe('visible');
    });

    it('visible → fadeOut（非等待模式，自动推进）', () => {
      pm.startTrial();
      advanceThrough(pm, 300);
      expect(pm.current()).toBe('visible');
      advanceThrough(pm, 2500);
      expect(pm.current()).toBe('fadeOut');
    });

    it('fadeOut → gap', () => {
      pm.startTrial();
      advanceThrough(pm, 300);
      advanceThrough(pm, 2500);
      advanceThrough(pm, 300);
      expect(pm.current()).toBe('gap');
    });

    it('gap → idle → 触发 onTrialEnd', () => {
      let ended = false;
      pm.onTrialEnd = () => { ended = true; };
      pm.startTrial();
      advanceThrough(pm, 300);
      advanceThrough(pm, 2500);
      advanceThrough(pm, 300);
      advanceThrough(pm, 1000);
      expect(pm.current()).toBe('idle');
      expect(ended).toBe(true);
    });
  });

  describe('waitingForInput', () => {
    it('等待输入模式下 visible 不自动推进', () => {
      pm.setWaitingForInput(true);
      pm.startTrial();
      advanceThrough(pm, 300); // fadeIn complete, now visible
      expect(pm.current()).toBe('visible');
      advanceThrough(pm, 99999); // 即使过了很久也不推进
      expect(pm.current()).toBe('visible');
    });

    it('proceed 手动推进', () => {
      pm.setWaitingForInput(true);
      pm.startTrial();
      advanceThrough(pm, 300);
      expect(pm.current()).toBe('visible');
      pm.proceed();
      expect(pm.current()).toBe('fadeOut');
    });

    it('非等待模式下 proceed 无效', () => {
      pm.setWaitingForInput(false);
      pm.startTrial();
      advanceThrough(pm, 300);
      pm.proceed();
      expect(pm.current()).toBe('visible');
    });
  });

  describe('isResponseWindow', () => {
    it('visible 阶段是反应窗口', () => {
      pm.startTrial();
      advanceThrough(pm, 300);
      expect(pm.current()).toBe('visible');
      expect(pm.isResponseWindow()).toBe(true);
    });

    it('fadeOut 阶段也是反应窗口', () => {
      pm.startTrial();
      advanceThrough(pm, 300);
      advanceThrough(pm, 2500);
      expect(pm.current()).toBe('fadeOut');
      expect(pm.isResponseWindow()).toBe(true);
    });

    it('idle 和 gap 不是反应窗口', () => {
      expect(pm.isResponseWindow()).toBe(false);
    });
  });

  describe('progress', () => {
    it('应该返回当前阶段进度 (0-1)', () => {
      pm.startTrial();
      expect(pm.progress()).toBe(0);
      pm.advance(150); // halfway through fadeIn (small delta is fine)
      expect(pm.progress()).toBeCloseTo(0.5, 1);
    });
  });

  describe('onPhaseChange', () => {
    it('阶段切换时应触发回调', () => {
      const changes = [];
      pm.onPhaseChange = (oldP, newP) => changes.push([oldP, newP]);
      pm.startTrial();
      expect(changes.length).toBe(1);
      expect(changes[0]).toEqual(['idle', 'fadeIn']);
    });
  });

  describe('reset', () => {
    it('应该回到 idle', () => {
      pm.startTrial();
      advanceThrough(pm, 300);
      pm.reset();
      expect(pm.current()).toBe('idle');
      expect(pm.phaseAge).toBe(0);
    });
  });

  describe('updateConfig', () => {
    it('应该更新阶段时长', () => {
      pm.updateConfig({ fadeIn: 500, visible: 3000, fadeOut: 500, gap: 800 });
      pm.startTrial();
      advanceThrough(pm, 400); // not enough for 500ms fadeIn
      expect(pm.current()).toBe('fadeIn');
      advanceThrough(pm, 100);
      expect(pm.current()).toBe('visible');
    });
  });
});
