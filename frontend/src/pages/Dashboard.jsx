import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { tasksAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'

export default function Dashboard() {
  const { user, isAdmin } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    tasksAPI.getAll({ limit: 100 })
      .then(r => setTasks(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    high: tasks.filter(t => t.priority === 'high').length,
  }

  const recent = tasks.slice(0, 5)

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <div className="page-title">Welcome back, {user?.username} 👋</div>
            <div className="page-subtitle">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          </div>
          <Link to="/tasks" className="btn btn-primary">+ New Task</Link>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Total Tasks</div>
              </div>
              <div className="stat-card" style={{ borderColor: 'rgba(59,130,246,0.3)' }}>
                <div className="stat-value" style={{ color: '#93c5fd' }}>{stats.in_progress}</div>
                <div className="stat-label">In Progress</div>
              </div>
              <div className="stat-card" style={{ borderColor: 'rgba(34,197,94,0.3)' }}>
                <div className="stat-value" style={{ color: '#86efac' }}>{stats.done}</div>
                <div className="stat-label">Completed</div>
              </div>
              <div className="stat-card" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
                <div className="stat-value" style={{ color: '#fca5a5' }}>{stats.high}</div>
                <div className="stat-label">High Priority</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.todo}</div>
                <div className="stat-label">To Do</div>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3>Recent Tasks</h3>
                <Link to="/tasks" style={{ fontSize: '0.82rem', color: 'var(--accent2)', textDecoration: 'none' }}>View all →</Link>
              </div>
              {recent.length === 0 ? (
                <div className="empty-state">
                  <p>No tasks yet. <Link to="/tasks" style={{ color: 'var(--accent2)' }}>Create your first task →</Link></p>
                </div>
              ) : (
                <div className="task-list">
                  {recent.map(task => (
                    <div key={task.id} className="task-item">
                      <div className="task-content">
                        <div className="task-title">{task.title}</div>
                        <div className="task-meta">
                          <span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span>
                          <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
