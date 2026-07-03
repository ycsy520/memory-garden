/**
 * GardenStimuli 单元测试
 * 验证素材集的完整性和 lure 支持
 */
import { describe, it, expect } from 'vitest';
import {
  getAllStimuli,
  getStimulusById,
  getSimilarStimuli,
  getSimilarityGroups,
} from '../stimuli/GardenStimuli.js';

describe('GardenStimuli', () => {
  it('应包含 12 个 MVP 素材', () => {
    const stimuli = getAllStimuli();
    expect(stimuli).toHaveLength(12);
  });

  it('每个素材应包含必要字段', () => {
    const stimuli = getAllStimuli();
    stimuli.forEach((s) => {
      expect(s.id).toBeDefined();
      expect(s.label).toBeDefined();
      expect(s.display).toBeDefined();
      expect(s.type).toBe('emoji');
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
    expect(rose.display).toBe('🌹');
  });

  it('getStimulusById 对不存在的 ID 应返回 undefined', () => {
    expect(getStimulusById('nonexistent')).toBeUndefined();
  });

  it('getSimilarStimuli 应返回同组但不同 ID 的素材', () => {
    const similar = getSimilarStimuli('rose');
    expect(similar.length).toBeGreaterThan(0);
    similar.forEach((s) => {
      expect(s.id).not.toBe('rose');
      expect(s.similarityGroup).toBe('flower-red');
    });
  });

  it('getSimilarStimuli 对不存在的素材应返回空数组', () => {
    expect(getSimilarStimuli('nonexistent')).toHaveLength(0);
  });

  it('getSimilarityGroups 应返回所有相似组', () => {
    const groups = getSimilarityGroups();
    expect(groups.length).toBeGreaterThan(0);
    expect(groups).toContain('flower-red');
    expect(groups).toContain('leaf-green');
  });
});
