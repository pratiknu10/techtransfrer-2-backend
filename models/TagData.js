import mongoose from 'mongoose';

const tagDataSchema = new mongoose.Schema({
  tag_data_id: {
    type: String,
    unique: true
  },
  project_ref_id: {
    type: String,
    ref: 'Project'
  },
  document_ref_id: {
    type: String,
    ref: 'Document'
  },
  tag_meta_ref_id: {
    type: String,
    ref: 'TagMeta'
  },
  category: {
    type: String
  },
  tag: {
    type: String
  },
  value_raw: {
    type: String
  },
  value_norm: {
    type: String
  },
  source: {
    type: String
  },
  method: {
    type: String
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  reviewer: {
    type: String
  },
  reviewed_at: {
    type: Date
  },
  is_latest_for_doc: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual relationships
tagDataSchema.virtual('project', {
  ref: 'Project',
  localField: 'project_ref_id',
  foreignField: 'project_id',
  justOne: true
});

tagDataSchema.virtual('document', {
  ref: 'Document',
  localField: 'document_ref_id',
  foreignField: 'document_id',
  justOne: true
});

tagDataSchema.virtual('tagMeta', {
  ref: 'TagMeta',
  localField: 'tag_meta_ref_id',
  foreignField: 'tag_meta_id',
  justOne: true
});

// Ensure virtual fields are serialized
tagDataSchema.set('toJSON', { virtuals: true });
tagDataSchema.set('toObject', { virtuals: true });

// Indexes for efficient querying
tagDataSchema.index({ project_ref_id: 1 });
tagDataSchema.index({ document_ref_id: 1 });
tagDataSchema.index({ tag_meta_ref_id: 1 });
tagDataSchema.index({ category: 1 });
tagDataSchema.index({ tag: 1 });
tagDataSchema.index({ is_latest_for_doc: 1 });
tagDataSchema.index({ reviewer: 1 });
tagDataSchema.index({ confidence: 1 });

export default mongoose.model('TagData', tagDataSchema);