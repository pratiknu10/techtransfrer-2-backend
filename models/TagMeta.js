import mongoose from 'mongoose';

const tagMetaSchema = new mongoose.Schema({
  tag_meta_id: {
    type: String,
    unique: true
  },
  category: {
    type: String
  },
  tag: {
    type: String
  },
  friendly_name: {
    type: String
  },
  description: {
    type: String
  },
  data_type: {
    type: String
  },
  regex: {
    type: String
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual relationships
tagMetaSchema.virtual('tagData', {
  ref: 'TagData',
  localField: 'tag_meta_id',
  foreignField: 'tag_meta_ref_id'
});

// Ensure virtual fields are serialized
tagMetaSchema.set('toJSON', { virtuals: true });
tagMetaSchema.set('toObject', { virtuals: true });

// Indexes for efficient querying
tagMetaSchema.index({ category: 1 });
tagMetaSchema.index({ tag: 1 });
tagMetaSchema.index({ active: 1 });
tagMetaSchema.index({ data_type: 1 });

export default mongoose.model('TagMeta', tagMetaSchema);