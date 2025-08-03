import express from 'express';
import { body, validationResult } from 'express-validator';
import db from '../models/database.js';

const router = express.Router();

// Get all projects for the current user
router.get('/', (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT DISTINCT p.* FROM projects p
     LEFT JOIN project_members pm ON p.id = pm.project_id
     WHERE p.owner_id = ? OR pm.user_id = ?
     ORDER BY p.created_at DESC`,
    [userId, userId],
    (err, projects) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch projects' });
      }
      res.json({ projects });
    }
  );
});

// Get single project
router.get('/:id', (req, res) => {
  const projectId = req.params.id;
  const userId = req.user.id;

  db.get(
    `SELECT p.* FROM projects p
     LEFT JOIN project_members pm ON p.id = pm.project_id
     WHERE p.id = ? AND (p.owner_id = ? OR pm.user_id = ?)`,
    [projectId, userId, userId],
    (err, project) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch project' });
      }
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      res.json({ project });
    }
  );
});

// Create project
router.post('/', [
  body('name').trim().notEmpty(),
  body('description').optional().trim()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description } = req.body;
  const ownerId = req.user.id;

  db.run(
    'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)',
    [name, description || '', ownerId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create project' });
      }

      const projectId = this.lastID;

      // Add owner as a member
      db.run(
        'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
        [projectId, ownerId, 'owner'],
        (err) => {
          if (err) {
            console.error('Failed to add owner as member:', err);
          }
        }
      );

      res.status(201).json({
        project: { id: projectId, name, description, owner_id: ownerId }
      });
    }
  );
});

// Update project
router.put('/:id', [
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const projectId = req.params.id;
  const userId = req.user.id;
  const { name, description } = req.body;

  // Check if user is owner
  db.get(
    'SELECT id FROM projects WHERE id = ? AND owner_id = ?',
    [projectId, userId],
    (err, project) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!project) {
        return res.status(403).json({ error: 'Not authorized to update this project' });
      }

      const updates = [];
      const values = [];

      if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No updates provided' });
      }

      values.push(projectId);

      db.run(
        `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`,
        values,
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to update project' });
          }
          res.json({ message: 'Project updated successfully' });
        }
      );
    }
  );
});

// Delete project
router.delete('/:id', (req, res) => {
  const projectId = req.params.id;
  const userId = req.user.id;

  // Check if user is owner
  db.get(
    'SELECT id FROM projects WHERE id = ? AND owner_id = ?',
    [projectId, userId],
    (err, project) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!project) {
        return res.status(403).json({ error: 'Not authorized to delete this project' });
      }

      db.run('DELETE FROM projects WHERE id = ?', [projectId], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete project' });
        }
        res.json({ message: 'Project deleted successfully' });
      });
    }
  );
});

// Add member to project
router.post('/:id/members', [
  body('email').isEmail().normalizeEmail()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const projectId = req.params.id;
  const userId = req.user.id;
  const { email } = req.body;

  // Check if user is owner
  db.get(
    'SELECT id FROM projects WHERE id = ? AND owner_id = ?',
    [projectId, userId],
    (err, project) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!project) {
        return res.status(403).json({ error: 'Not authorized to add members to this project' });
      }

      // Find user by email
      db.get('SELECT id FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Add member
        db.run(
          'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
          [projectId, user.id, 'member'],
          (err) => {
            if (err) {
              if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'User is already a member' });
              }
              return res.status(500).json({ error: 'Failed to add member' });
            }
            res.status(201).json({ message: 'Member added successfully' });
          }
        );
      });
    }
  );
});

export default router;