import React, { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { Route, Routes } from 'react-router-dom'
import { ArrowRightLeft, FlaskConical, Pill, MessageSquare, Activity } from 'lucide-react'

function StaffReferrals() {
  const [referrals, setReferrals] = useState<any[]>([])
  useEffect(() => { apiFetch('/referrals/department/placeholder').then(setReferrals).catch(() => {}) }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Incoming Referrals</h1>
      <div className="space-y-3">
        {referrals.length === 0 ? (
          <div className="glass-panel p-12 text-center text-muted-foreground">
            <ArrowRightLeft size={40} className="mx-auto mb-3 opacity-50" />
            <p>No incoming referrals</p>
          </div>
        ) : referrals.map((r: any) => (
          <div key={r.id} className="glass-panel p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{r.patient?.user?.email}</p>
              <p className="text-xs text-muted-foreground">From: {r.referringDoctor?.user?.email} • {r.reason?.slice(0, 60)}</p>
            </div>
            <span className={`text-xs capitalize px-2 py-1 rounded-full ${
              r.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
              r.status === 'accepted' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
            }`}>{r.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StaffLabWorklist() {
  const [orders, setOrders] = useState<any[]>([])
  const [resultForm, setResultForm] = useState<Record<string, string>>({})

  useEffect(() => { apiFetch('/lab-orders/department/placeholder').then(setOrders).catch(() => {}) }, [])

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiFetch(`/lab-orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
      setOrders(orders.map(o => o.id === id ? { ...o, status } : o))
    } catch {}
  }

  const addResult = async (orderId: string) => {
    if (!resultForm[orderId]) return
    try {
      await apiFetch(`/lab-orders/${orderId}/results`, {
        method: 'POST', body: JSON.stringify({ resultSummary: resultForm[orderId] })
      })
      updateStatus(orderId, 'completed')
      setResultForm({ ...resultForm, [orderId]: '' })
    } catch {}
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Lab Worklist</h1>
      <div className="space-y-3">
        {orders.length === 0 ? (
          <div className="glass-panel p-12 text-center text-muted-foreground">
            <FlaskConical size={40} className="mx-auto mb-3 opacity-50" />
            <p>No lab orders</p>
          </div>
        ) : orders.map((o: any) => (
          <div key={o.id} className="glass-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium">{o.testName}</p>
                <p className="text-xs text-muted-foreground">Patient: {o.patient?.user?.email} • Ordered: {new Date(o.orderedAt).toLocaleDateString()}</p>
              </div>
              <span className={`text-xs capitalize px-2 py-1 rounded-full ${
                o.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                o.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
              }`}>{o.status}</span>
            </div>
            {o.status !== 'completed' && (
              <div className="flex gap-2">
                <input className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm" placeholder="Enter result summary..." value={resultForm[o.id] || ''} onChange={(e) => setResultForm({ ...resultForm, [o.id]: e.target.value })} />
                <button onClick={() => addResult(o.id)} className="inline-flex h-9 items-center rounded-md bg-primary text-primary-foreground px-3 text-sm font-medium">Add Result</button>
                {o.status === 'ordered' && <button onClick={() => updateStatus(o.id, 'in_progress')} className="inline-flex h-9 items-center rounded-md border border-input px-3 text-sm">Start</button>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function StaffInventory() {
  const [items, setItems] = useState<any[]>([])
  useEffect(() => { apiFetch('/inventory').then(setItems).catch(() => {}) }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Inventory</h1>
      <div className="glass-panel overflow-hidden">
        {items.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Pill size={40} className="mx-auto mb-3 opacity-50" />
            <p>No inventory items</p>
          </div>
        ) : (
          <div className="divide-y">
            {items.map((i: any) => (
              <div key={i.id} className="p-4 flex items-center justify-between hover:bg-muted/30">
                <div>
                  <p className="text-sm font-medium">{i.name}</p>
                  <p className="text-xs text-muted-foreground">{i.category} • {i.department?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${i.quantityInStock <= i.reorderLevel ? 'text-red-600' : ''}`}>{i.quantityInStock} {i.unit}</span>
                  {i.quantityInStock <= i.reorderLevel && <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700">Low</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StaffMessages() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConv, setSelectedConv] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMsg, setNewMsg] = useState('')

  useEffect(() => { apiFetch('/messaging/conversations').then(setConversations).catch(() => {}) }, [])

  const selectConv = async (id: string) => {
    setSelectedConv(id)
    try { setMessages(await apiFetch(`/messaging/conversations/${id}/messages`)) } catch {}
  }

  const sendMsg = async () => {
    if (!newMsg.trim() || !selectedConv) return
    try {
      const msg = await apiFetch(`/messaging/conversations/${selectedConv}/messages`, {
        method: 'POST', body: JSON.stringify({ content: newMsg })
      })
      setMessages([...messages, msg])
      setNewMsg('')
    } catch {}
  }

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      <div className="w-72 flex-shrink-0 glass-panel overflow-hidden flex flex-col">
        <div className="p-3 border-b"><h3 className="font-semibold">Conversations</h3></div>
        <div className="flex-1 overflow-y-auto divide-y">
          {conversations.map((c: any) => (
            <button key={c.id} onClick={() => selectConv(c.id)} className={`w-full text-left p-3 hover:bg-muted/50 ${selectedConv === c.id ? 'bg-muted' : ''}`}>
              <p className="text-sm font-medium truncate">{c.type}</p>
              <p className="text-xs text-muted-foreground truncate">{c.participants?.map((p: any) => p.user.email).join(', ')}</p>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 glass-panel flex flex-col">
        {selectedConv ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m: any) => (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[70%] rounded-lg p-3 bg-primary/10">
                    <p className="text-xs text-muted-foreground mb-1">{m.sender?.email}</p>
                    <p className="text-sm">{m.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t p-3 flex gap-2">
              <input className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm" placeholder="Type a message..." value={newMsg} onChange={(e) => setNewMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMsg()} />
              <button onClick={sendMsg} className="inline-flex h-10 items-center rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium">Send</button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <MessageSquare size={32} className="mb-2 opacity-50" />
            <p className="text-sm">Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function StaffSubPages() {
  return (
    <Routes>
      <Route index element={<StaffReferrals />} />
      <Route path="dashboard" element={<StaffReferrals />} />
      <Route path="referrals" element={<StaffReferrals />} />
      <Route path="lab-worklist" element={<StaffLabWorklist />} />
      <Route path="inventory" element={<StaffInventory />} />
      <Route path="messages" element={<StaffMessages />} />
    </Routes>
  )
}
