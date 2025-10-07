import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  task_id: {
    type: String,
    unique: true
  },
  type: {
    type: String,
    enum: ['project_stage_enum']
  },
  project_id: {
    type: String,
    ref: 'Project'
  },
  project_ref_id: {
    type: String
  },
  customer_ref_id: {
    type: String,
    ref: 'Customer'
  },
  task_name: {
    type: String
  },
  description: {
    type: String
  },
  assigned_to: {
    type: String
  },
  start_date: {
    type: Date
  },
  end_date: {
    type: Date
  },
  status: {
    type: String,
    enum: ['task_status_enum']
  },
  priority: {
    type: String,
    enum: ['task_priority_enum']
  }
}, {
  timestamps: true
});

// Virtual relationships
taskSchema.virtual('project', {
  ref: 'Project',
  localField: 'project_id',
  foreignField: 'project_id',
  justOne: true
});

taskSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customer_ref_id',
  foreignField: 'customer_id',
  justOne: true
});

taskSchema.virtual('protocols', {
  ref: 'Protocol',
  localField: 'task_id',
  foreignField: 'linked_task_ref_id'
});

// Ensure virtual fields are serialized
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

// Indexes for efficient querying
taskSchema.index({ project_id: 1 });
taskSchema.index({ customer_ref_id: 1 });
taskSchema.index({ assigned_to: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ start_date: 1, end_date: 1 });

export default mongoose.model('Task', taskSchema);