import express from 'express';
import { body, validationResult } from 'express-validator';
import db from '../models/database.js';

const router = express.Router();

// Get all tasks for a project
router.get('/project/:projectId', (req, res) => {
  const projectId = req.params.projectId;
  const userId = req.user.id;

  // Check if user has access to project
  db.get(
    `SELECT p.id FROM projects p
     LEFT JOIN project_members pm ON p.id = pm.project_id
     WHERE p.id = ? AND (p.owner_id = ? OR pm.user_id = ?)`,
    [projectId, userId, userId],
    (err, project) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!project) {
        return res.status(403).json({ error: 'Access denied' });
      }

      db.all(
        `SELECT t.*, u.name as assigned_to_name 
         FROM tasks t
         LEFT JOIN users u ON t.assigned_to = u.id
         WHERE t.project_id = ?
         ORDER BY t.status, t.position`,
        [projectId],
        (err, tasks) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to fetch tasks' });
          }
          res.json({ tasks });
        }
      );
    }
  );
});

// Create task
router.post('/', [
  body('title').trim().notEmpty(),
  body('description').optional().trim(),
  body('project_id').isInt(),
  body('status').optional().isIn(['todo', 'in_progress', 'done']),
  body('assigned_to').optional().isInt()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, project_id, status, assigned_to } = req.body;
  const userId = req.user.id;

  // Check if user has access to project
  db.get(
    `SELECT p.id FROM projects p
     LEFT JOIN project_members pm ON p.id = pm.project_id
     WHERE p.id = ? AND (p.owner_id = ? OR pm.user_id = ?)`,
    [project_id, userId, userId],
    (err, project) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!project) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get max position for the status
      db.get(
        'SELECT MAX(position) as max_position FROM tasks WHERE project_id = ? AND status = ?',
        [project_id, status || 'todo'],
        (err, result) => {
          const position = (result?.max_position || 0) + 1;

          db.run(
            `INSERT INTO tasks (title, description, project_id, status, position, assigned_to) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [title, description || '', project_id, status || 'todo', position, assigned_to || null],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Failed to create task' });
              }

              res.status(201).json({
                task: {
                  id: this.lastID,
                  title,
                  description,
                  project_id,
                  status: status || 'todo',
                  position,
                  assigned_to
                }
              });
            }
          );
        }
      );
    }
  );
});

// Update task
router.put('/:id', [
  body('title').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('status').optional().isIn(['todo', 'in_progress', 'done']),
  body('position').optional().isInt({ min: 0 }),
  body('assigned_to').optional().isInt()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const taskId = req.params.id;
  const userId = req.user.id;
  const updates = req.body;

  // Get task and check access
  db.get(
    `SELECT t.*, p.owner_id FROM tasks t
     JOIN projects p ON t.project_id = p.id
     LEFT JOIN project_members pm ON p.id = pm.project_id
     WHERE t.id = ? AND (p.owner_id = ? OR pm.user_id = ?)`,
    [taskId, userId, userId],
    (err, task) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!task) {
        return res.status(404).json({ error: 'Task not found or access denied' });
      }

      const updateFields = [];
      const values = [];

      if (updates.title !== undefined) {
        updateFields.push('title = ?');
        values.push(updates.title);
      }
      if (updates.description !== undefined) {
        updateFields.push('description = ?');
        values.push(updates.description);
      }
      if (updates.status !== undefined) {
        updateFields.push('status = ?');
        values.push(updates.status);
      }
      if (updates.position !== undefined) {
        updateFields.push('position = ?');
        values.push(updates.position);
      }
      if (updates.assigned_to !== undefined) {
        updateFields.push('assigned_to = ?');
        values.push(updates.assigned_to);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No updates provided' });
      }

      values.push(taskId);

      db.run(
        `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?`,
        values,
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to update task' });
          }
          res.json({ message: 'Task updated successfully' });
        }
      );
    }
  );
});

// Delete task
router.delete('/:id', (req, res) => {
  const taskId = req.params.id;
  const userId = req.user.id;

  // Check access
  db.get(
    `SELECT t.id FROM tasks t
     JOIN projects p ON t.project_id = p.id
     LEFT JOIN project_members pm ON p.id = pm.project_id
     WHERE t.id = ? AND (p.owner_id = ? OR pm.user_id = ?)`,
    [taskId, userId, userId],
    (err, task) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!task) {
        return res.status(404).json({ error: 'Task not found or access denied' });
      }

      db.run('DELETE FROM tasks WHERE id = ?', [taskId], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete task' });
        }
        res.json({ message: 'Task deleted successfully' });
      });
    }
  );
});

// Reorder tasks
router.post('/reorder', [
  body('taskId').isInt(),
  body('newStatus').isIn(['todo', 'in_progress', 'done']),
  body('newPosition').isInt({ min: 0 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { taskId, newStatus, newPosition } = req.body;
  const userId = req.user.id;

  // Get task and check access
  db.get(
    `SELECT t.*, p.owner_id FROM tasks t
     JOIN projects p ON t.project_id = p.id
     LEFT JOIN project_members pm ON p.id = pm.project_id
     WHERE t.id = ? AND (p.owner_id = ? OR pm.user_id = ?)`,
    [taskId, userId, userId],
    (err, task) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!task) {
        return res.status(404).json({ error: 'Task not found or access denied' });
      }

      const oldStatus = task.status;
      const oldPosition = task.position;
      const projectId = task.project_id;

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // If moving within same status
        if (oldStatus === newStatus) {
          if (oldPosition < newPosition) {
            // Moving down
            db.run(
              `UPDATE tasks SET position = position - 1 
               WHERE project_id = ? AND status = ? AND position > ? AND position <= ?`,
              [projectId, oldStatus, oldPosition, newPosition]
            );
          } else if (oldPosition > newPosition) {
            // Moving up
            db.run(
              `UPDATE tasks SET position = position + 1 
               WHERE project_id = ? AND status = ? AND position >= ? AND position < ?`,
              [projectId, oldStatus, newPosition, oldPosition]
            );
          }
        } else {
          // Moving to different status
          // Update positions in old status
          db.run(
            `UPDATE tasks SET position = position - 1 
             WHERE project_id = ? AND status = ? AND position > ?`,
            [projectId, oldStatus, oldPosition]
          );

          // Update positions in new status
          db.run(
            `UPDATE tasks SET position = position + 1 
             WHERE project_id = ? AND status = ? AND position >= ?`,
            [projectId, newStatus, newPosition]
          );
        }

        // Update the task itself
        db.run(
          'UPDATE tasks SET status = ?, position = ? WHERE id = ?',
          [newStatus, newPosition, taskId],
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Failed to reorder task' });
            }

            db.run('COMMIT');
            res.json({ message: 'Task reordered successfully' });
          }
        );
      });
    }
  );
});

export default router;