import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  project_id: {
    type: String,
    unique: true
  },
  customer_ref_id: {
    type: String,
    ref: 'Customer'
  },
  customer_name: {
    type: String
  },
  api_code_id: {
    type: String
  },
  product: {
    type: String
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['project_status_enum']
  },
  current_stage: {
    type: String,
    enum: ['project_stage_enum']
  },
  timeline: {
    type: String
  },
  facilities: {
    type: String
  },
  team_members: {
    type: String
  },
  project_meta: {
    type: String
  }
}, {
  timestamps: true
});

// Virtual relationships
projectSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customer_ref_id',
  foreignField: 'customer_id',
  justOne: true
});

projectSchema.virtual('tasks', {
  ref: 'Task',
  localField: 'project_id',
  foreignField: 'project_id'
});

projectSchema.virtual('protocols', {
  ref: 'Protocol',
  localField: 'project_id',
  foreignField: 'project_ref_id'
});

projectSchema.virtual('documents', {
  ref: 'Document',
  localField: 'project_id',
  foreignField: 'project_id'
});

projectSchema.virtual('reports', {
  ref: 'Report',
  localField: 'project_id',
  foreignField: 'project_ref_id'
});

projectSchema.virtual('tagData', {
  ref: 'TagData',
  localField: 'project_id',
  foreignField: 'project_ref_id'
});

// Ensure virtual fields are serialized
projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

// Index for efficient querying
projectSchema.index({ customer_ref_id: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ current_stage: 1 });

export default mongoose.model('Project', projectSchema);