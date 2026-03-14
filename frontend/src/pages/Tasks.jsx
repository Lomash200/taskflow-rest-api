import { useState, useEffect, useCallback } from 'react'
import { tasksAPI } from '../services/api'
import Sidebar from '../components/Sidebar'

const STATUSES = ['todo', 'in_progress', 'done']
const PRIORITIES = ['low', 'medium', 'high']

function TaskModal({ task, onClose, onSave }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    due_date: task?.due_date ? task.due_date.slice(0, 16) : '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const payload = { ...form, due_date: form.due_date || null }
      let saved
      if (task?.id) {
        saved = await tasksAPI.update(task.id, payload)
      } else {
        saved = await tasksAPI.create(payload)
      }
      onSave(saved.data)
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(Array.isArray(detail) ? detail.map(d => d.msg).join(', ') : detail || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{task?.id ? 'Edit Task' : 'New Task'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input className="form-input" placeholder="Task title" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required autoFocus />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-textarea" placeholder="Optional description…" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Status</label>
              <select className="form-select" value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select className="form-select" value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input className="form-input" type="datetime-local" value={form.due_date}
              onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : (task?.id ? 'Update Task' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'create' | task object
  const [filters, setFilters] = useState({ status: '', priority: '' })
  const [alert, setAlert] = useState(null)

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type })
    setTimeout(() => setAlert(null), 3000)
  }

  const loadTasks = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.status) params.status = filters.status
      if (filters.priority) params.priority = filters.priority
      const res = await tasksAPI.getAll(params)
      setTasks(res.data)
    } catch {
      showAlert('Failed to load tasks', 'error')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { loadTasks() }, [loadTasks])

  const handleSave = (task) => {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === task.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = task; return next }
      return [task, ...prev]
    })
    setModal(null)
    showAlert(task.id ? 'Task updated!' : 'Task created!')
  }

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return
    try {
      await tasksAPI.delete(task.id)
      setTasks(prev => prev.filter(t => t.id !== task.id))
      showAlert('Task deleted.')
    } catch {
      showAlert('Failed to delete task.', 'error')
    }
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <div className="page-title">Tasks</div>
            <div className="page-subtitle">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</div>
          </div>
          <button className="btn btn-primary" onClick={() => setModal('create')}>+ New Task</button>
        </div>

        {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

        <div className="filter-row">
          <select className="form-select" value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <select className="form-select" value={filters.priority}
            onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : tasks.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/></svg>
              <p>No tasks found. Create your first one!</p>
            </div>
          </div>
        ) : (
          <div className="task-list">
            {tasks.map(task => (
              <div key={task.id} className="task-item">
                <div className="task-content">
                  <div className="task-title">{task.title}</div>
                  {task.description && <div className="task-desc">{task.description}</div>}
                  <div className="task-meta">
                    <span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span>
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    {task.due_date && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>
                        Due {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="task-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => setModal(task)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(task)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {(modal === 'create' || (modal && typeof modal === 'object')) && (
          <TaskModal
            task={modal === 'create' ? null : modal}
            onClose={() => setModal(null)}
            onSave={handleSave}
          />
        )}
      </main>
    </div>
  )
}
