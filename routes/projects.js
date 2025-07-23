const express = require('express');
const router = express.Router({ mergeParams: true });
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const Workspace = require('../models/Workspace');

// @route   POST api/workspaces/:workspaceId/projects
// @desc    Create a new project in a workspace
// @access  Private
router.post(
  '/',
  [auth, [body('name', 'Name is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const workspace = await Workspace.findById(req.params.workspaceId);
      if (!workspace) {
        return res.status(404).json({ msg: 'Workspace not found' });
      }

      if (!workspace.members.some(member => member.toString() === req.user.id)) {
        return res.status(401).json({ msg: 'Not authorized' });
      }

      const newProject = new Project({
        name: req.body.name,
        description: req.body.description,
        workspace: req.params.workspaceId,
        owner: req.user.id,
      });

      const project = await newProject.save();

      workspace.projects.push(project.id);
      await workspace.save();

      res.json(project);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/workspaces/:workspaceId/projects
// @desc    Get all projects for a workspace
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.workspaceId);
        if (!workspace) {
            return res.status(404).json({ msg: 'Workspace not found' });
        }

        if (!workspace.members.some(member => member.toString() === req.user.id)) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const projects = await Project.find({ workspace: req.params.workspaceId }).populate('owner', ['firstName', 'lastName']);
        res.json(projects);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/workspaces/:workspaceId/projects/:projectId
// @desc    Get a single project by ID
// @access  Private
router.get('/:projectId', auth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId).populate('owner', ['firstName', 'lastName']);
        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        const workspace = await Workspace.findById(project.workspace);
        if (!workspace.members.some(member => member.toString() === req.user.id)) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        res.json(project);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Project not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/workspaces/:workspaceId/projects/:projectId
// @desc    Delete a project
// @access  Private
router.delete('/:projectId', auth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        if (project.owner.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const workspace = await Workspace.findById(project.workspace);
        if (!workspace) {
            return res.status(404).json({ msg: 'Workspace not found' });
        }

        await project.remove();

        workspace.projects.pull(req.params.projectId);
        await workspace.save();

        res.json({ msg: 'Project removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Project not found' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
