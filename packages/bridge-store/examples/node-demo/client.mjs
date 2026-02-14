import WebSocket from 'ws'

const ws = new WebSocket('ws://127.0.0.1:8787')

let nextId = 1
const pending = new Map()

function request(method, params) {
  const id = nextId++
  ws.send(JSON.stringify({ jsonrpc: '2.0', id, method, params }))
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
}

ws.on('message', (data) => {
  const msg = JSON.parse(String(data))

  if (msg.method === 'store.stateChanged') {
    console.log('[stateChanged]', msg.params.storeId, 'v', msg.params.version, msg.params.state)
    return
  }

  if ('id' in msg && ('result' in msg || 'error' in msg)) {
    const p = pending.get(msg.id)
    if (!p) return
    pending.delete(msg.id)
    if (msg.error) p.reject(msg.error)
    else p.resolve(msg.result)
  }
})

ws.on('open', async () => {
  console.log('connected')

  const pageId = process.env.PAGE_ID || 'demo:counter'
  const storeKey = process.env.STORE_KEY || 'main'
  let storeId = process.env.STORE_ID

  if (!storeId) {
    // Resolve storeId by pageId + storeKey
    const res = await request('page.resolve', { pageId, storeKey }).catch((e) => ({ error: e }))
    if (res?.storeId) storeId = res.storeId
  }

  if (!storeId) {
    // Fallback: list first store under page
    const listed = await request('page.listStores', { pageId }).catch((e) => ({ error: e }))
    storeId = listed?.stores?.[0]?.storeId
  }

  console.log('using storeId:', storeId)

  await request('store.subscribe', { storeId })
  const cur = await request('store.getState', { storeId }).catch((e) => ({ error: e }))
  console.log('getState:', cur)

  console.log('dispatch counter.add {n: 5} to', storeId)
  const r = await request('store.dispatch', { storeId, action: { type: 'counter.add', payload: { n: 5 } } }).catch((e) => ({ error: e }))
  console.log('dispatch result:', r)

  setTimeout(() => process.exit(0), 3000)
})
