/**
 * GameLoop 单元测试 — rAF 帧级游戏循环
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import GameLoop from '../GameLoop';

describe('GameLoop', () => {
  let loop;

  beforeEach(() => {
    loop = new GameLoop({
      onTick: vi.fn(),
      onPause: vi.fn(),
      onResume: vi.fn(),
    });
    // Mock requestAnimationFrame
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      return setTimeout(() => cb(performance.now()), 16);
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      clearTimeout(id);
    });
  });

  afterEach(() => {
    if (loop.running) loop.stop();
    vi.restoreAllMocks();
  });

  describe('start', () => {
    it('应该设置 running 为 true', () => {
      loop.start();
      expect(loop.running).toBe(true);
    });

    it('应该设置 timeScale 为 1', () => {
      loop.start();
      expect(loop.timeScale).toBe(1);
    });

    it('不应该重复启动', () => {
      loop.start();
      const rafId = loop.rafId;
      loop.start();
      expect(loop.rafId).toBe(rafId);
    });
  });

  describe('stop', () => {
    it('应该设置 running 为 false', () => {
      loop.start();
      loop.stop();
      expect(loop.running).toBe(false);
    });

    it('应该清空 rafId', () => {
      loop.start();
      loop.stop();
      expect(loop.rafId).toBeNull();
    });
  });

  describe('pause', () => {
    it('应该设置 timeScale 为 0', () => {
      loop.start();
      loop.pause('test');
      expect(loop.timeScale).toBe(0);
    });

    it('应该触发 onPause 回调', () => {
      loop.start();
      loop.pause('test');
      expect(loop.onPause).toHaveBeenCalledWith('test');
    });

    it('未启动时不应触发暂停', () => {
      loop.pause('test');
      expect(loop.onPause).not.toHaveBeenCalled();
    });
  });

  describe('resume', () => {
    it('应该设置 timeScale 为 1', () => {
      loop.start();
      loop.pause('test');
      loop.resume();
      expect(loop.timeScale).toBe(1);
    });

    it('应该触发 onResume 回调', () => {
      loop.start();
      loop.pause('test');
      loop.resume();
      expect(loop.onResume).toHaveBeenCalled();
    });
  });

  describe('大 delta gap 检测', () => {
    it('rawDelta > 3000ms 时应自动暂停', () => {
      loop.start();
      // 模拟大间隔帧
      loop.lastFrameTime = performance.now() - 5000;
      loop.tick(performance.now());
      expect(loop.timeScale).toBe(0);
      expect(loop.onPause).toHaveBeenCalledWith('large-frame-gap');
    });
  });
});
