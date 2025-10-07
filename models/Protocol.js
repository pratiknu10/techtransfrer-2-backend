import mongoose from 'mongoose';

const protocolSchema = new mongoose.Schema({
  protocol_id: {
    type: String,
    unique: true
  },
  project_ref_id: {
    type: String,
    ref: 'Project'
  },
  project_name: {
    type: String
  },
  assignee_name: {
    type: String
  },
  assignee_email: {
    type: String
  },
  linked_task_ref_id: {
    type: String,
    ref: 'Task'
  },
  attachments: {
    type: String
  }
}, {
  timestamps: true
});

// Virtual relationships
protocolSchema.virtual('project', {
  ref: 'Project',
  localField: 'project_ref_id',
  foreignField: 'project_id',
  justOne: true
});

protocolSchema.virtual('linkedTask', {
  ref: 'Task',
  localField: 'linked_task_ref_id',
  foreignField: 'task_id',
  justOne: true
});

// Ensure virtual fields are serialized
protocolSchema.set('toJSON', { virtuals: true });
protocolSchema.set('toObject', { virtuals: true });

// Indexes for efficient querying
protocolSchema.index({ project_ref_id: 1 });
protocolSchema.index({ linked_task_ref_id: 1 });
protocolSchema.index({ assignee_email: 1 });

export default mongoose.model('Protocol', protocolSchema);