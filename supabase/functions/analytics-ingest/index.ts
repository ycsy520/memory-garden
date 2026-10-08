import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * 生成统一 JSON 响应
 * @param {Record<string, unknown>} payload
 * @param {number} status
 * @param {Record<string, string>} extraHeaders
 * @returns {Response}
 */
function jsonResponse(
  payload: Record<string, unknown>,
  status = 200,
  extraHeaders: Record<string, string> = {}
) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  })
}

/**
 * 根据 Origin 生成 CORS 头
 * @param {Request} req
 * @returns {Record<string, string>}
 */
function corsHeaders(req: Request) {
  const origin = req.headers.get('Origin') ?? ''
  const allowList = new Set<string>([
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ])
  const allowOrigin = allowList.has(origin) ? origin : '*'

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  }
}

/**
 * 判断给定值是否为普通对象
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

/**
 * 将未知输入安全转为字符串
 * @param {unknown} value
 * @returns {string|null}
 */
function asString(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : null
}

/**
 * 将未知输入安全转为整数
 * @param {unknown} value
 * @returns {number|null}
 */
function asInt(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const intValue = Math.trunc(value)
  return intValue
}

/**
 * 将未知输入安全转为布尔值
 * @param {unknown} value
 * @returns {boolean|null}
 */
function asBool(value: unknown) {
  return typeof value === 'boolean' ? value : null
}

/**
 * 将未知输入安全转为 0~1 浮点数（accuracy 等）
 * @param {unknown} value
 * @returns {number|null}
 */
function asUnitNumber(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  if (value < 0 || value > 1) return null
  return value
}

/**
 * 将未知输入安全转为 ISO 时间字符串（timestamptz 入库）
 * @param {unknown} value
 * @returns {string|null}
 */
function asIsoTime(value: unknown) {
  const s = asString(value)
  if (!s) return null
  const t = Date.parse(s)
  if (Number.isNaN(t)) return null
  return new Date(t).toISOString()
}

/**
 * 校验并裁剪 attempt payload，仅保留白名单字段
 * @param {Record<string, unknown>} raw
 * @returns {{ ok: true, row: Record<string, unknown> } | { ok: false, error: string }}
 */
function sanitizeAttempt(raw: Record<string, unknown>) {
  const sessionId = asString(raw.sessionId)
  const modeId = asString(raw.modeId)
  const rhythmId = asString(raw.rhythmId)
  const platform = asString(raw.platform)
  const appVersion = asString(raw.appVersion)
  const locale = asString(raw.locale) ?? 'zh-CN'

  const difficultyN = asInt(raw.difficultyN)
  const timed = asBool(raw.timed) ?? false
  const timeLimitS = asInt(raw.timeLimitS) ?? 0

  const startedAt = asIsoTime(raw.startedAt)
  const endedAt = raw.endedAt === null ? null : asIsoTime(raw.endedAt)

  const endedReason = asString(raw.endedReason)
  const durationMs = raw.durationMs === null ? null : asInt(raw.durationMs)
  const pauseDurationMs = asInt(raw.pauseDurationMs) ?? 0
  const activeDurationMs = raw.activeDurationMs === null ? null : asInt(raw.activeDurationMs)
  const warmupDurationMs = asInt(raw.warmupDurationMs) ?? 0

  const turnCountTotal = asInt(raw.turnCountTotal) ?? 0
  const turnCountScored = asInt(raw.turnCountScored) ?? 0
  const exitStage = asString(raw.exitStage)
  const exitTurnIndex = raw.exitTurnIndex === null ? null : asInt(raw.exitTurnIndex)

  const score = typeof raw.score === 'number' && Number.isFinite(raw.score) ? raw.score : null
  const accuracy = raw.accuracy === null ? null : asUnitNumber(raw.accuracy)
  const rtP50Ms = raw.rtP50Ms === null ? null : asInt(raw.rtP50Ms)
  const rtP90Ms = raw.rtP90Ms === null ? null : asInt(raw.rtP90Ms)

  if (!sessionId) return { ok: false, error: 'invalid-sessionId' }
  if (!modeId) return { ok: false, error: 'invalid-modeId' }
  if (!rhythmId) return { ok: false, error: 'invalid-rhythmId' }
  if (difficultyN === null || difficultyN < 1) return { ok: false, error: 'invalid-difficultyN' }
  if (!startedAt) return { ok: false, error: 'invalid-startedAt' }
  if (!platform || !['web', 'pwa', 'android', 'ios'].includes(platform)) return { ok: false, error: 'invalid-platform' }
  if (!appVersion) return { ok: false, error: 'invalid-appVersion' }
  if (timeLimitS < 0) return { ok: false, error: 'invalid-timeLimitS' }
  if (pauseDurationMs < 0 || warmupDurationMs < 0) return { ok: false, error: 'invalid-duration' }
  if (endedReason && !['finished', 'exit'].includes(endedReason)) return { ok: false, error: 'invalid-endedReason' }
  if (exitStage && !['intro', 'warmup', 'main', 'finished'].includes(exitStage)) return { ok: false, error: 'invalid-exitStage' }
  if (accuracy === null && raw.accuracy !== null && raw.accuracy !== undefined) return { ok: false, error: 'invalid-accuracy' }

  return {
    ok: true,
    row: {
      session_id: sessionId,
      mode_id: modeId,
      rhythm_id: rhythmId,
      difficulty_n: difficultyN,
      timed,
      time_limit_s: timeLimitS,
      started_at: startedAt,
      ended_at: endedAt,
      ended_reason: endedReason,
      duration_ms: durationMs,
      pause_duration_ms: pauseDurationMs,
      active_duration_ms: activeDurationMs,
      warmup_duration_ms: warmupDurationMs,
      turn_count_total: turnCountTotal,
      turn_count_scored: turnCountScored,
      exit_stage: exitStage,
      exit_turn_index: exitTurnIndex,
      score,
      accuracy,
      rt_p50_ms: rtP50Ms,
      rt_p90_ms: rtP90Ms,
      app_version: appVersion,
      platform,
      locale,
    },
  }
}

serve(async (req) => {
  const cors = corsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Unauthorized' }, 401, cors)
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    return jsonResponse({ error: 'Unauthorized' }, 401, cors)
  }

  const isAnonymous = (user as unknown as { is_anonymous?: boolean }).is_anonymous === true

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'invalid-json' }, 400, cors)
  }

  if (!isRecord(body) || !isRecord(body.attempt)) {
    return jsonResponse({ error: 'invalid-structure' }, 400, cors)
  }

  const sanitized = sanitizeAttempt(body.attempt)
  if (!sanitized.ok) {
    return jsonResponse({ error: sanitized.error }, 400, cors)
  }

  const row = {
    ...sanitized.row,
    user_id: isAnonymous ? null : user.id,
  }

  const { data, error: insertError } = await supabase
    .from('analytics_attempts')
    .insert(row)
    .select('id')
    .single()

  if (insertError) {
    return jsonResponse({ error: 'insert-failed', detail: insertError.message }, 500, cors)
  }

  return jsonResponse({ success: true, attemptId: data?.id ?? null }, 200, cors)
})
