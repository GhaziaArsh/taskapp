import React, { useState, useEffect, useCallback } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function App() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [toasts, setToasts] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', category: 'general', due_date: '' });

  const toast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  };

  const fetchTasks = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (search) params.set('search', search);
      const res = await fetch(`${API}/api/tasks?${params}`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch { setTasks([]); }
  }, [filter, search]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API}/api/tasks/stats`);
      setStats(await res.json());
    } catch { /* ignore */ }
  };

  useEffect(() => { setLoading(true); fetchTasks().finally(() => setLoading(false)); fetchStats(); }, [fetchTasks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      const url = editTask ? `${API}/api/tasks/${editTask.id}` : `${API}/api/tasks`;
      const method = editTask ? 'PUT' : 'POST';
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      toast(editTask ? 'Task updated!' : 'Task created!');
      closeModal();
      fetchTasks(); fetchStats();
    } catch { toast('Failed to save task', 'error'); }
  };

  const toggleStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'todo' : task.status === 'todo' ? 'in-progress' : 'completed';
    try {
      await fetch(`${API}/api/tasks/${task.id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
      toast(`Task marked as ${newStatus}`);
      fetchTasks(); fetchStats();
    } catch { toast('Failed to update', 'error'); }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await fetch(`${API}/api/tasks/${id}`, { method: 'DELETE' });
      toast('Task deleted');
      fetchTasks(); fetchStats();
    } catch { toast('Failed to delete', 'error'); }
  };

  const openEdit = (task) => {
    setEditTask(task);
    setForm({ title: task.title, description: task.description || '', priority: task.priority, category: task.category || 'general', due_date: task.due_date ? task.due_date.split('T')[0] : '' });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditTask(null); setForm({ title: '', description: '', priority: 'medium', category: 'general', due_date: '' }); };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">T</div>
            <div><div className="logo-text">TaskApp</div></div>
            <span className="logo-badge">Enterprise</span>
          </div>
          <div className="header-status">
            <div className="status-dot"></div>
            <span className="status-text">Azure CI/CD Active</span>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card accent"><div className="stat-label">Total Tasks</div><div className="stat-value">{stats.total || 0}</div></div>
          <div className="stat-card warning"><div className="stat-label">In Progress</div><div className="stat-value warning">{stats.inProgress || 0}</div></div>
          <div className="stat-card success"><div className="stat-label">Completed</div><div className="stat-value success">{stats.completed || 0}</div></div>
          <div className="stat-card danger"><div className="stat-label">High Priority</div><div className="stat-value danger">{stats.highPriority || 0}</div></div>
        </div>

        {/* Controls */}
        <div className="controls-bar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {['all', 'todo', 'in-progress', 'completed'].map(f => (
            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f === 'in-progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <button className="add-btn" onClick={() => setShowModal(true)}>+ New Task</button>
        </div>

        {/* Task List */}
        {loading ? (
          <div className="loading"><div className="loading-dot"></div><div className="loading-dot"></div><div className="loading-dot"></div></div>
        ) : tasks.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-title">No tasks found</div><div className="empty-desc">Create your first task to get started</div></div>
        ) : (
          <div className="task-list">
            {tasks.map(task => (
              <div key={task.id} className={`task-card ${task.status === 'completed' ? 'completed' : ''}`}>
                <div className={`task-checkbox ${task.status === 'completed' ? 'checked' : ''}`} onClick={() => toggleStatus(task)}></div>
                <div className="task-info">
                  <div className="task-title">{task.title}</div>
                  {task.description && <div className="task-desc">{task.description}</div>}
                </div>
                <div className="task-meta">
                  <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
                  <span className="category-badge">{task.category}</span>
                  <span className={`status-badge ${task.status}`}>{task.status}</span>
                </div>
                <div className="task-actions">
                  <button className="action-btn" onClick={() => openEdit(task)} title="Edit">✏️</button>
                  <button className="action-btn delete" onClick={() => deleteTask(task.id)} title="Delete">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editTask ? 'Edit Task' : 'Create New Task'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Enter task title" required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Task details..." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option value="general">General</option><option value="devops">DevOps</option>
                    <option value="infrastructure">Infrastructure</option><option value="security">Security</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-save">{editTask ? 'Update' : 'Create'} Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="toast-container">{toasts.map(t => <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>)}</div>

      <footer className="app-footer">TaskApp v1.0.0 — Enterprise Azure CI/CD Lab Project</footer>
    </div>
  );
}

export default App;
