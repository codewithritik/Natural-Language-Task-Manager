const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  name: String,
  assignee: String,
  dueDate: Date,
  priority: { type: String, default: 'P3' },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task; 