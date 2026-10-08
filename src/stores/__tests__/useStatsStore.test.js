import { describe, expect, it, vi } from 'vitest';
import { buildStatsSnapshot, ensureSessionId } from '../useStatsStore';

describe('useStatsStore helpers', () => {
  /**
   * 为测试场景创建最小 session 数据。
   * @param {Partial<any>} overrides
   * @returns {any}
   */
  function createSession(overrides = {}) {
    return {
      id: 'session-1',
      modeId: 'walk',
      difficulty: 1,
      score: 10,
      startedAt: 1,
      ...overrides,
    };
  }

  it('会为缺失 id 的 session 补齐稳定主键', () => {
    const uuidSpy = vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('uuid-test-1');
    const result = ensureSessionId(createSession({ id: undefined }));

    expect(result.id).toBe('uuid-test-1');
    uuidSpy.mockRestore();
  });

  it('会从 sessions 重建 bestScores、perModeCounts 和 perNCounts', () => {
    const snapshot = buildStatsSnapshot([
      createSession({ id: 'a', modeId: 'walk', difficulty: 1, score: 8, startedAt: 100 }),
      createSession({ id: 'b', modeId: 'walk', difficulty: 1, score: 12, startedAt: 200 }),
      createSession({ id: 'c', modeId: 'dual', difficulty: 2, score: 6, startedAt: 300 }),
    ], 2);

    expect(snapshot.bestScores).toEqual({
      walk: 12,
      dual: 6,
    });
    expect(snapshot.perModeCounts).toEqual({
      walk: 2,
      dual: 1,
    });
    expect(snapshot.perNCounts).toEqual({
      1: 2,
      2: 1,
    });
    expect(snapshot.warmupSessionsUsed).toBe(2);
  });
});

