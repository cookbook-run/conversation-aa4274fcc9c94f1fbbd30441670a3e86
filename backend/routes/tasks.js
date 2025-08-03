const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all tasks for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const projectId = req.params.projectId;

    // Check if user has access to this project
    const hasAccess = await db.get(`
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE p.id = ? AND (p.owner_id = ? OR pm.user_id = ?)
    `, [projectId, req.user.id, req.user.id]);

    if (!hasAccess) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    const tasks = await db.all(`
      SELECT t.*, 
             creator.name as created_by_name,
             assignee.name as assigned_to_name
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE t.project_id = ?
      ORDER BY t.created_at DESC
    `, [projectId]);

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single task
router.get('/:id', auth, async (req, res) => {
  try {
    const taskId = req.params.id;

    const task = await db.get(`
      SELECT t.*, 
             creator.name as created_by_name,
             assignee.name as assigned_to_name,
             p.name as project_name
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE t.id = ? AND (p.owner_id = ? OR pm.user_id = ?)
    `, [taskId, req.user.id, req.user.id]);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new task
router.post('/', [
  auth,
  body('title').trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('project_id').isInt(),
  body('status').optional().isIn(['todo', 'in_progress', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('assigned_to').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, project_id, status, priority, assigned_to } = req.body;

    // Check if user has access to this project
    const hasAccess = await db.get(`
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE p.id = ? AND (p.owner_id = ? OR pm.user_id = ?)
    `, [project_id, req.user.id, req.user.id]);

    if (!hasAccess) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    // If assigned_to is provided, check if that user has access to the project
    if (assigned_to) {
      const assigneeAccess = await db.get(`
        SELECT 1 FROM projects p
        LEFT JOIN project_members pm ON p.id = pm.project_id
        WHERE p.id = ? AND (p.owner_id = ? OR pm.user_id = ?)
      `, [project_id, assigned_to, assigned_to]);

      if (!assigneeAccess) {
        return res.status(400).json({ error: 'Assigned user does not have access to this project' });
      }
    }

    const result = await db.run(`
      INSERT INTO tasks (title, description, project_id, status, priority, assigned_to, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      title,
      description || '',
      project_id,
      status || 'todo',
      priority || 'medium',
      assigned_to || null,
      req.user.id
    ]);

    const task = await db.get(`
      SELECT t.*, 
             creator.name as created_by_name,
             assignee.name as assigned_to_name
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE t.id = ?
    `, [result.id]);

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update task
router.put('/:id', [
  auth,
  body('title').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('status').optional().isIn(['todo', 'in_progress', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('assigned_to').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const taskId = req.params.id;
    const updates = req.body;

    // Get current task and check access
    const currentTask = await db.get(`
      SELECT t.*, p.owner_id
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE t.id = ? AND (p.owner_id = ? OR pm.user_id = ?)
    `, [taskId, req.user.id, req.user.id]);

    if (!currentTask) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }

    // If assigned_to is being updated, check if that user has access to the project
    if (updates.assigned_to !== undefined && updates.assigned_to !== null) {
      const assigneeAccess = await db.get(`
        SELECT 1 FROM projects p
        LEFT JOIN project_members pm ON p.id = pm.project_id
        WHERE p.id = ? AND (p.owner_id = ? OR pm.user_id = ?)
      `, [currentTask.project_id, updates.assigned_to, updates.assigned_to]);

      if (!assigneeAccess) {
        return res.status(400).json({ error: 'Assigned user does not have access to this project' });
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    Object.keys(updates).forEach(key => {
      if (['title', 'description', 'status', 'priority', 'assigned_to'].includes(key)) {
        updateFields.push(`${key} = ?`);
        updateValues.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(taskId);

    await db.run(
      `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    const updatedTask = await db.get(`
      SELECT t.*, 
             creator.name as created_by_name,
             assignee.name as assigned_to_name
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE t.id = ?
    `, [taskId]);

    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const taskId = req.params.id;

    // Check if user has access to this task
    const task = await db.get(`
      SELECT t.*, p.owner_id
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE t.id = ? AND (p.owner_id = ? OR pm.user_id = ?)
    `, [taskId, req.user.id, req.user.id]);

    if (!task) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }

    await db.run('DELETE FROM tasks WHERE id = ?', [taskId]);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;