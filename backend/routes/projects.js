const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all projects for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const projects = await db.all(`
      SELECT DISTINCT p.*, u.name as owner_name
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE p.owner_id = ? OR pm.user_id = ?
      ORDER BY p.created_at DESC
    `, [req.user.id, req.user.id]);

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single project
router.get('/:id', auth, async (req, res) => {
  try {
    const projectId = req.params.id;

    // Check if user has access to this project
    const project = await db.get(`
      SELECT DISTINCT p.*, u.name as owner_name
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE p.id = ? AND (p.owner_id = ? OR pm.user_id = ?)
    `, [projectId, req.user.id, req.user.id]);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get project members
    const members = await db.all(`
      SELECT u.id, u.name, u.email, pm.role
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
    `, [projectId]);

    // Add owner to members if not already included
    const ownerInMembers = members.find(m => m.id === project.owner_id);
    if (!ownerInMembers) {
      const owner = await db.get('SELECT id, name, email FROM users WHERE id = ?', [project.owner_id]);
      if (owner) {
        members.unshift({ ...owner, role: 'owner' });
      }
    }

    res.json({ ...project, members });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new project
router.post('/', [
  auth,
  body('name').trim().isLength({ min: 1 }),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    const result = await db.run(
      'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)',
      [name, description || '', req.user.id]
    );

    const project = await db.get(`
      SELECT p.*, u.name as owner_name
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.id = ?
    `, [result.id]);

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update project
router.put('/:id', [
  auth,
  body('name').trim().isLength({ min: 1 }),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const projectId = req.params.id;
    const { name, description } = req.body;

    // Check if user owns this project
    const project = await db.get('SELECT * FROM projects WHERE id = ? AND owner_id = ?', [projectId, req.user.id]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    await db.run(
      'UPDATE projects SET name = ?, description = ? WHERE id = ?',
      [name, description || '', projectId]
    );

    const updatedProject = await db.get(`
      SELECT p.*, u.name as owner_name
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.id = ?
    `, [projectId]);

    res.json(updatedProject);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete project
router.delete('/:id', auth, async (req, res) => {
  try {
    const projectId = req.params.id;

    // Check if user owns this project
    const project = await db.get('SELECT * FROM projects WHERE id = ? AND owner_id = ?', [projectId, req.user.id]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    // Delete related data
    await db.run('DELETE FROM tasks WHERE project_id = ?', [projectId]);
    await db.run('DELETE FROM project_members WHERE project_id = ?', [projectId]);
    await db.run('DELETE FROM projects WHERE id = ?', [projectId]);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;