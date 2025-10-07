import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  report_id: {
    type: String,
    unique: true
  },
  project_ref_id: {
    type: String,
    ref: 'Project'
  },
  stage: {
    type: String,
    enum: ['project_stage_enum']
  },
  type: {
    type: String
  },
  report_type: {
    type: String
  },
  version: {
    type: String
  },
  generated_from: {
    type: String
  },
  generated_by: {
    type: String
  },
  generated_at: {
    type: Date
  },
  link: {
    type: String
  },
  payload: {
    type: String
  }
}, {
  timestamps: true
});

// Virtual relationships
reportSchema.virtual('project', {
  ref: 'Project',
  localField: 'project_ref_id',
  foreignField: 'project_id',
  justOne: true
});

// Ensure virtual fields are serialized
reportSchema.set('toJSON', { virtuals: true });
reportSchema.set('toObject', { virtuals: true });

// Indexes for efficient querying
reportSchema.index({ project_ref_id: 1 });
reportSchema.index({ stage: 1 });
reportSchema.index({ report_type: 1 });
reportSchema.index({ generated_at: 1 });
reportSchema.index({ generated_by: 1 });
reportSchema.index({ version: 1 });

export default mongoose.model('Report', reportSchema);