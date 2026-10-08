/**
 * GardenStimuli 单元测试
 * 验证精灵图素材集（单一池 31 个）的完整性和 lure 支持
 */
import { describe, it, expect } from 'vitest';
import {
  getAllStimuli,
  getStimulusById,
  getSimilarStimuli,
  getSimilarityGroups,
} from '../stimuli/GardenStimuli.js';

describe('GardenStimuli', () => {
  it('应包含 31 个精灵图素材', () => {
    const stimuli = getAllStimuli();
    expect(stimuli).toHaveLength(31);
  });

  it('每个素材应包含必要字段，display 为精灵图格子索引', () => {
    const stimuli = getAllStimuli();
    stimuli.forEach((s, index) => {
      expect(s.id).toBeDefined();
      expect(s.label).toBeDefined();
      expect(s.display).toBe(index);
      expect(s.type).toBe('sprite');
      expect(s.category).toBeDefined();
      expect(s.similarityGroup).toBeDefined();
      expect(typeof s.suitableForChildren).toBe('boolean');
      expect(typeof s.suitableForOlderAdults).toBe('boolean');
    });
  });

  it('getStimulusById 应返回正确素材', () => {
    const rose = getStimulusById('rose');
    expect(rose).toBeDefined();
    expect(rose.label).toBe('玫瑰');
    expect(rose.display).toBe(30);
  });

  it('getStimulusById 对不存在的 ID 应返回 undefined', () => {
    expect(getStimulusById('nonexistent')).toBeUndefined();
  });

  it('getSimilarStimuli 应返回同组但不同 ID 的素材', () => {
    const similar = getSimilarStimuli('rose');
    expect(similar.length).toBeGreaterThan(0);
    similar.forEach((s) => {
      expect(s.id).not.toBe('rose');
      expect(s.similarityGroup).toBe('pink-flower');
    });
  });

  it('getSimilarStimuli 对不存在的素材应返回空数组', () => {
    expect(getSimilarStimuli('nonexistent')).toHaveLength(0);
  });

  it('getSimilarityGroups 应返回所有相似组', () => {
    const groups = getSimilarityGroups();
    expect(groups.length).toBeGreaterThan(0);
    expect(groups).toContain('pink-flower');
    expect(groups).toContain('green-leaf');
  });
});
