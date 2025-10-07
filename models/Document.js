import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  document_id: {
    type: String,
    unique: true
  },
  project_stage_enum: {
    type: String
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
  canonical_key: {
    type: String
  },
  version: {
    type: String
  },
  is_latest: {
    type: Boolean,
    default: true
  },
  status: {
    type: String
  },
  supersede_ref_id: {
    type: String,
    ref: 'Document'
  },
  superseded_by_ref_id: {
    type: String,
    ref: 'Document'
  },
  content_hash: {
    type: String
  },
  effective_date: {
    type: Date
  },
  checksum: {
    type: String
  },
  owner_name: {
    type: String
  },
  owner_email: {
    type: String
  },
  assignment_on: {
    type: Date
  },
  assignment_history: {
    type: String
  },
  category: {
    type: String
  },
  doc_status: {
    type: String
  },
  extra_meta: {
    type: String
  },
  title: {
    type: String
  },
  uploaded_on: {
    type: Date
  },
  uploaded_by: {
    type: String
  },
  file_type: {
    type: String,
    enum: ['file_type_enum']
  },
  link: {
    type: String
  }
}, {
  timestamps: true
});

// Virtual relationships
documentSchema.virtual('project', {
  ref: 'Project',
  localField: 'project_id',
  foreignField: 'project_id',
  justOne: true
});

documentSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customer_ref_id',
  foreignField: 'customer_id',
  justOne: true
});

documentSchema.virtual('tagData', {
  ref: 'TagData',
  localField: 'document_id',
  foreignField: 'document_ref_id'
});

documentSchema.virtual('supersededBy', {
  ref: 'Document',
  localField: 'superseded_by_ref_id',
  foreignField: 'document_id',
  justOne: true
});

documentSchema.virtual('supersedes', {
  ref: 'Document',
  localField: 'supersede_ref_id',
  foreignField: 'document_id',
  justOne: true
});

// Ensure virtual fields are serialized
documentSchema.set('toJSON', { virtuals: true });
documentSchema.set('toObject', { virtuals: true });

// Indexes for efficient querying
documentSchema.index({ project_id: 1 });
documentSchema.index({ customer_ref_id: 1 });
documentSchema.index({ canonical_key: 1 });
documentSchema.index({ is_latest: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ effective_date: 1 });
documentSchema.index({ category: 1 });
documentSchema.index({ file_type: 1 });
documentSchema.index({ owner_email: 1 });

export default mongoose.model('Document', documentSchema);