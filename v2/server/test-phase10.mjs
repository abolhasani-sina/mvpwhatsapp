// Phase 10 end-to-end smoke test: channel lock + change request flow
const BASE = 'http://localhost:4000/api';
const ts = Date.now();

async function api(method, path, token, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, json };
}

(async () => {
  // 1. Register tenant
  const tenantEmail = `tenant-${ts}@example.com`;
  const reg = await api('POST', '/auth/register', null, {
    email: tenantEmail, password: 'TenantPass123!', name: 'Tenant One',
  });
  console.log('1. Register tenant:', reg.status, 'role=' + reg.json.user?.role);
  const tToken = reg.json.accessToken;

  // 2. Create business
  const biz = await api('POST', '/business', tToken, {
    templateKey: 'beauty_salon',
    businessName: 'Test Salon ' + ts,
    templateData: { welcomeMessage: 'Hi', buttons: [] },
  });
  console.log('2. Create business:', biz.status, 'id=' + biz.json.data?.id);
  const bizId = biz.json.data?.id;

  // 3. Initial settings PUT — should set + lock telegram
  const set1 = await api('PUT', `/business/${bizId}/settings`, tToken, {
    telegramBotToken: '111:initial-token',
    telegramChatId: '-100123',
    businessEmail: 'salon@example.com',
    whatsappNumber: '',
  });
  console.log('3. First settings save:', set1.status);

  // 4. GET settings — confirm telegram_locked=1
  const get1 = await api('GET', `/business/${bizId}/settings`, tToken);
  console.log('4. Settings after first save:',
    'telegram_locked=' + get1.json.data?.telegram_locked,
    'telegram_set_at=' + get1.json.data?.telegram_set_at);

  // 5. Try to change locked telegram token — expect 409
  const set2 = await api('PUT', `/business/${bizId}/settings`, tToken, {
    telegramBotToken: '222:new-token',
    telegramChatId: '-100123',
    businessEmail: 'salon@example.com',
    whatsappNumber: '',
  });
  console.log('5. Update locked channel:', set2.status,
    'code=' + set2.json.code, 'channel=' + set2.json.channel);

  // 6. Submit change request
  const req = await api('POST', `/business/${bizId}/channel-change-requests`, tToken, {
    channel: 'telegram',
    requestedValue: '222:new-bot-token',
    reason: 'Bot was reset',
  });
  console.log('6. Submit change request:', req.status, 'id=' + req.json.data?.id);
  const reqId = req.json.data?.id;

  // 7. Try to submit duplicate pending request — expect 409
  const reqDup = await api('POST', `/business/${bizId}/channel-change-requests`, tToken, {
    channel: 'telegram', requestedValue: '333:another', reason: 'oops',
  });
  console.log('7. Duplicate pending request:', reqDup.status, 'code=' + reqDup.json.code);

  // 8. List own requests
  const reqList = await api('GET', `/business/${bizId}/channel-change-requests`, tToken);
  console.log('8. Tenant sees requests:', reqList.status, 'count=' + reqList.json.data?.length,
    'masked=' + reqList.json.data?.[0]?.requested_value_masked);

  // 9. Login as owner & approve
  const ownerLogin = await api('POST', '/auth/login', null, {
    email: 'owner-test-1776757265@example.com', password: 'OwnerTest123!',
  });
  const oToken = ownerLogin.json.accessToken;
  console.log('9. Owner login:', ownerLogin.status, 'role=' + ownerLogin.json.user?.role);

  // 10. Owner sees pending request
  const pending = await api('GET', '/owner/channel-requests?status=pending', oToken);
  console.log('10. Owner pending requests:', pending.status, 'count=' + pending.json.data?.length);

  // 11. Approve
  const approve = await api('POST', `/owner/channel-requests/${reqId}/approve`, oToken, {
    note: 'Verified via support ticket #42',
  });
  console.log('11. Approve:', approve.status);

  // 12. Tenant re-fetches settings — token should be the new one, still locked
  const get2 = await api('GET', `/business/${bizId}/settings`, tToken);
  console.log('12. Settings after approval:',
    'telegram_bot_token=' + get2.json.data?.telegram_bot_token,
    'telegram_locked=' + get2.json.data?.telegram_locked);

  // 13. Test plan limit: Starter has max_staff=1 — second staff should be blocked
  const s1 = await api('POST', `/business/${bizId}/staff`, tToken, {
    name: 'Alice', role: 'stylist', email: '', telegram_chat_id: '',
  });
  console.log('13a. First staff:', s1.status);
  const s2 = await api('POST', `/business/${bizId}/staff`, tToken, {
    name: 'Bob', role: 'stylist', email: '', telegram_chat_id: '',
  });
  console.log('13b. Second staff (over limit):', s2.status, 'code=' + s2.json.code);

  // 14. Owner upgrades tenant to Pro plan
  const upgrade = await api('PUT', `/owner/tenants/${bizId}/plan`, oToken, { planId: 2 });
  console.log('14. Upgrade to Pro:', upgrade.status);

  // 15. Now second staff should succeed
  const s2b = await api('POST', `/business/${bizId}/staff`, tToken, {
    name: 'Bob', role: 'stylist', email: '', telegram_chat_id: '',
  });
  console.log('15. Second staff after upgrade:', s2b.status);

  // 16. Owner suspends tenant
  const suspend = await api('POST', `/owner/tenants/${bizId}/suspend`, oToken);
  console.log('16. Suspend tenant:', suspend.status);

  // 17. Tenant tries to login after suspension
  const blockedLogin = await api('POST', '/auth/login', null, {
    email: tenantEmail, password: 'TenantPass123!',
  });
  console.log('17. Suspended tenant login:', blockedLogin.status,
    'code=' + blockedLogin.json.code);

  // 18. Reactivate
  const reactivate = await api('POST', `/owner/tenants/${bizId}/reactivate`, oToken);
  console.log('18. Reactivate tenant:', reactivate.status);

  console.log('\n=== Phase 10 smoke test complete ===');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
