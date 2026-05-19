/**
 * Task Routes
 * Full CRUD operations for task management
 * Supports both Azure SQL and in-memory storage modes
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getPool, isInMemoryMode, getInMemoryTasks, setInMemoryTasks, sql } = require('../config/database');

// ─── GET /api/tasks — List all tasks ───────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { status, priority, category, search, sort, order } = req.query;

    if (isInMemoryMode()) {
      let tasks = [...getInMemoryTasks()];

      // Filtering
      if (status) tasks = tasks.filter(t => t.status === status);
      if (priority) tasks = tasks.filter(t => t.priority === priority);
      if (category) tasks = tasks.filter(t => t.category === category);
      if (search) {
        const s = search.toLowerCase();
        tasks = tasks.filter(t =>
          t.title.toLowerCase().includes(s) ||
          (t.description && t.description.toLowerCase().includes(s))
        );
      }

      // Sorting
      const sortField = sort || 'created_at';
      const sortOrder = order === 'asc' ? 1 : -1;
      tasks.sort((a, b) => {
        if (a[sortField] < b[sortField]) return -1 * sortOrder;
        if (a[sortField] > b[sortField]) return 1 * sortOrder;
        return 0;
      });

      return res.json({
        count: tasks.length,
        tasks,
        mode: 'in-memory'
      });
    }

    // Azure SQL query
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const request = getPool().request();

    if (status) {
      query += ' AND status = @status';
      request.input('status', sql.NVarChar, status);
    }
    if (priority) {
      query += ' AND priority = @priority';
      request.input('priority', sql.NVarChar, priority);
    }
    if (category) {
      query += ' AND category = @category';
      request.input('category', sql.NVarChar, category);
    }
    if (search) {
      query += ' AND (title LIKE @search OR description LIKE @search)';
      request.input('search', sql.NVarChar, `%${search}%`);
    }

    query += ` ORDER BY ${sort === 'priority' ? 'priority' : 'created_at'} ${order === 'asc' ? 'ASC' : 'DESC'}`;

    const result = await request.query(query);
    res.json({
      count: result.recordset.length,
      tasks: result.recordset,
      mode: 'azure-sql'
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/tasks/stats — Task statistics ────────────────
router.get('/stats', async (req, res, next) => {
  try {
    if (isInMemoryMode()) {
      const tasks = getInMemoryTasks();
      return res.json({
        total: tasks.length,
        todo: tasks.filter(t => t.status === 'todo').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        highPriority: tasks.filter(t => t.priority === 'high').length,
        overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length,
        mode: 'in-memory'
      });
    }

    const result = await getPool().request().query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) AS todo,
        SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) AS inProgress,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) AS highPriority,
        SUM(CASE WHEN due_date < GETUTCDATE() AND status != 'completed' THEN 1 ELSE 0 END) AS overdue
      FROM tasks
    `);

    res.json({ ...result.recordset[0], mode: 'azure-sql' });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/tasks/:id — Get single task ──────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isInMemoryMode()) {
      const task = getInMemoryTasks().find(t => t.id === id);
      if (!task) return res.status(404).json({ error: 'Task not found' });
      return res.json(task);
    }

    const result = await getPool().request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM tasks WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/tasks — Create a new task ───────────────────
router.post('/', async (req, res, next) => {
  try {
    const { title, description, priority, category, due_date } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    if (isInMemoryMode()) {
      const newTask = {
        id,
        title: title.trim(),
        description: description || '',
        status: 'todo',
        priority: priority || 'medium',
        category: category || 'general',
        created_at: now,
        updated_at: now,
        due_date: due_date || null,
        completed_at: null
      };

      const tasks = getInMemoryTasks();
      tasks.unshift(newTask);
      setInMemoryTasks(tasks);

      return res.status(201).json(newTask);
    }

    await getPool().request()
      .input('id', sql.NVarChar, id)
      .input('title', sql.NVarChar, title.trim())
      .input('description', sql.NVarChar, description || '')
      .input('priority', sql.NVarChar, priority || 'medium')
      .input('category', sql.NVarChar, category || 'general')
      .input('due_date', sql.DateTime2, due_date ? new Date(due_date) : null)
      .query(`
        INSERT INTO tasks (id, title, description, priority, category, due_date)
        VALUES (@id, @title, @description, @priority, @category, @due_date)
      `);

    const result = await getPool().request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM tasks WHERE id = @id');

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/tasks/:id — Update a task ────────────────────
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, category, due_date } = req.body;

    if (isInMemoryMode()) {
      const tasks = getInMemoryTasks();
      const index = tasks.findIndex(t => t.id === id);
      if (index === -1) return res.status(404).json({ error: 'Task not found' });

      const now = new Date().toISOString();
      tasks[index] = {
        ...tasks[index],
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(category !== undefined && { category }),
        ...(due_date !== undefined && { due_date }),
        updated_at: now,
        ...(status === 'completed' && { completed_at: now }),
        ...(status !== 'completed' && tasks[index].status === 'completed' && { completed_at: null })
      };

      setInMemoryTasks(tasks);
      return res.json(tasks[index]);
    }

    const existing = await getPool().request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM tasks WHERE id = @id');

    if (existing.recordset.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await getPool().request()
      .input('id', sql.NVarChar, id)
      .input('title', sql.NVarChar, title || existing.recordset[0].title)
      .input('description', sql.NVarChar, description !== undefined ? description : existing.recordset[0].description)
      .input('status', sql.NVarChar, status || existing.recordset[0].status)
      .input('priority', sql.NVarChar, priority || existing.recordset[0].priority)
      .input('category', sql.NVarChar, category || existing.recordset[0].category)
      .input('due_date', sql.DateTime2, due_date ? new Date(due_date) : existing.recordset[0].due_date)
      .input('completed_at', sql.DateTime2, status === 'completed' ? new Date() : null)
      .query(`
        UPDATE tasks SET
          title = @title,
          description = @description,
          status = @status,
          priority = @priority,
          category = @category,
          due_date = @due_date,
          completed_at = @completed_at,
          updated_at = GETUTCDATE()
        WHERE id = @id
      `);

    const result = await getPool().request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM tasks WHERE id = @id');

    res.json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/tasks/:id/status — Quick status update ─────
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['todo', 'in-progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    if (isInMemoryMode()) {
      const tasks = getInMemoryTasks();
      const index = tasks.findIndex(t => t.id === id);
      if (index === -1) return res.status(404).json({ error: 'Task not found' });

      const now = new Date().toISOString();
      tasks[index].status = status;
      tasks[index].updated_at = now;
      if (status === 'completed') tasks[index].completed_at = now;
      else tasks[index].completed_at = null;

      setInMemoryTasks(tasks);
      return res.json(tasks[index]);
    }

    await getPool().request()
      .input('id', sql.NVarChar, id)
      .input('status', sql.NVarChar, status)
      .input('completed_at', sql.DateTime2, status === 'completed' ? new Date() : null)
      .query(`
        UPDATE tasks SET status = @status, completed_at = @completed_at, updated_at = GETUTCDATE()
        WHERE id = @id
      `);

    const result = await getPool().request()
      .input('id', sql.NVarChar, id)
      .query('SELECT * FROM tasks WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/tasks/:id — Delete a task ─────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isInMemoryMode()) {
      const tasks = getInMemoryTasks();
      const index = tasks.findIndex(t => t.id === id);
      if (index === -1) return res.status(404).json({ error: 'Task not found' });

      tasks.splice(index, 1);
      setInMemoryTasks(tasks);
      return res.json({ message: 'Task deleted successfully', id });
    }

    const result = await getPool().request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM tasks WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully', id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
