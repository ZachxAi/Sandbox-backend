const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Workspace = require('../models/Workspace');
const User = require('../models/User');

// @route   POST api/workspaces
// @desc    Create a new workspace
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
      const newWorkspace = new Workspace({
        name: req.body.name,
        owner: req.user.id,
        members: [req.user.id],
      });

      const workspace = await newWorkspace.save();
      res.json(workspace);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/workspaces
// @desc    Get all workspaces for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const workspaces = await Workspace.find({ members: req.user.id }).populate('owner', ['firstName', 'lastName']).populate('members', ['firstName', 'lastName']);
    res.json(workspaces);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/workspaces/:id
// @desc    Get a single workspace by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id).populate('owner', ['firstName', 'lastName']).populate('members', ['firstName', 'lastName']).populate('projects');

    if (!workspace) {
      return res.status(404).json({ msg: 'Workspace not found' });
    }

    // Check if user is a member of the workspace
    if (!workspace.members.some(member => member.id.toString() === req.user.id)) {
        return res.status(401).json({ msg: 'Not authorized' });
    }

    res.json(workspace);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Workspace not found' });
    }
    res.status(500).send('Server Error');
  }
});


// @route   PUT api/workspaces/:id/members
// @desc    Add a member to a workspace
// @access  Private
router.put('/:id/members', [auth, [ body('email', 'Email is required').isEmail() ]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const workspace = await Workspace.findById(req.params.id);
        if (!workspace) {
            return res.status(404).json({ msg: 'Workspace not found' });
        }

        if (workspace.owner.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const userToAdd = await User.findOne({ email: req.body.email });
        if (!userToAdd) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (workspace.members.includes(userToAdd.id)) {
            return res.status(400).json({ msg: 'User is already a member' });
        }

        workspace.members.push(userToAdd.id);
        await workspace.save();
        
        const populatedWorkspace = await Workspace.findById(req.params.id).populate('owner', ['firstName', 'lastName']).populate('members', ['firstName', 'lastName']);

        res.json(populatedWorkspace);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/workspaces/:id
// @desc    Delete a workspace
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.id);

        if (!workspace) {
            return res.status(404).json({ msg: 'Workspace not found' });
        }

        if (workspace.owner.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await workspace.remove();

        res.json({ msg: 'Workspace removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Workspace not found' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
