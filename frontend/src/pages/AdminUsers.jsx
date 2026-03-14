import { useState, useEffect } from 'react'
import { usersAPI } from '../services/api'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'

export default function AdminUsers() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type })
    setTimeout(() => setAlert(null), 3000)
  }

  useEffect(() => {
    usersAPI.getAll()
      .then(r => setUsers(r.data))
      .catch(() => showAlert('Failed to load users', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const handleToggleActive = async (user) => {
    try {
      const res = await usersAPI.update(user.id, { is_active: !user.is_active })
      setUsers(prev => prev.map(u => u.id === user.id ? res.data : u))
      showAlert(`User ${res.data.is_active ? 'activated' : 'deactivated'}.`)
    } catch {
      showAlert('Update failed.', 'error')
    }
  }

  const handleRoleToggle = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    try {
      const res = await usersAPI.update(user.id, { role: newRole })
      setUsers(prev => prev.map(u => u.id === user.id ? res.data : u))
      showAlert(`Role updated to ${newRole}.`)
    } catch {
      showAlert('Update failed.', 'error')
    }
  }

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.username}"? This will also delete all their tasks.`)) return
    try {
      await usersAPI.delete(user.id)
      setUsers(prev => prev.filter(u => u.id !== user.id))
      showAlert('User deleted.')
    } catch (err) {
      showAlert(err.response?.data?.detail || 'Delete failed.', 'error')
    }
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <div className="page-title">Manage Users</div>
            <div className="page-subtitle">{users.length} registered users</div>
          </div>
        </div>

        {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

        <div className="card">
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td style={{ color: 'var(--text3)' }}>#{user.id}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text)' }}>
                        {user.username}
                        {user.id === currentUser?.id && (
                          <span style={{ marginLeft: 6, fontSize: '0.7rem', color: 'var(--accent2)' }}>you</span>
                        )}
                      </td>
                      <td>{user.email}</td>
                      <td><span className={`badge badge-${user.role}`}>{user.role}</span></td>
                      <td>
                        <span className={`badge`} style={user.is_active
                          ? { background: 'rgba(34,197,94,0.1)', color: '#86efac' }
                          : { background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }
                        }>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        {user.id !== currentUser?.id && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleRoleToggle(user)}>
                              {user.role === 'admin' ? 'Make User' : 'Make Admin'}
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleToggleActive(user)}>
                              {user.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(user)}>
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
