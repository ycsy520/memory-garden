import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * 生成统一 JSON 响应
 * @param {Record<string, unknown>} payload
 * @param {number} status
 * @returns {Response}
 */
function jsonResponse(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  // 验证用户身份
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }
  const token = authHeader.replace('Bearer ', '')
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  // 验证确认文本
  const { confirmText } = await req.json()
  if (confirmText !== 'DELETE') {
    return jsonResponse({ error: 'Invalid confirmation' }, 400)
  }

  const userId = user.id

  /**
   * 删除指定表中的当前用户数据，并在失败时立即返回。
   * @param {string} table
   * @param {string} column
   * @returns {Promise<{ ok: boolean, error?: string }>}
   */
  const deleteBy = async (table: string, column: string) => {
    const { error: deleteError } = await supabase.from(table).delete().eq(column, userId)
    if (deleteError) {
      return { ok: false, error: `${table}: ${deleteError.message}` }
    }
    return { ok: true }
  }

  // 级联删除用户数据
  const deletionPlan: Array<[string, string]> = [
    ['diary_entries', 'user_id'],
    ['narrative_unlocks', 'user_id'],
    ['sessions', 'user_id'],
    ['auth_identities', 'user_id'],
    ['user_settings', 'user_id'],
    ['profiles', 'id'],
  ]

  for (const [table, column] of deletionPlan) {
    const result = await deleteBy(table, column)
    if (!result.ok) {
      return jsonResponse({ error: 'Delete failed', detail: result.error }, 500)
    }
  }

  const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId)
  if (deleteUserError) {
    return jsonResponse({ error: 'Delete auth user failed', detail: deleteUserError.message }, 500)
  }

  return jsonResponse({ success: true, userId })
})
