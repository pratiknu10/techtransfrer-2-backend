import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  milestone_id: {
    type: String,
    unique: true
  },
  code: {
    type: String
  },
  name: {
    type: String
  },
  primary_use: {
    type: String
  },
  rationale: {
    type: String
  },
  type: {
    type: String
  },
  dosage_forms: {
    type: String
  },
  typical_batch_types: {
    type: String
  },
  steps: {
    type: String
  },
  raw_materials: {
    type: String
  },
  tests: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
milestoneSchema.index({ code: 1 });
milestoneSchema.index({ type: 1 });
milestoneSchema.index({ name: 'text' });

export default mongoose.model('Milestone', milestoneSchema);