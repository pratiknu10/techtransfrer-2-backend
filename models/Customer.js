import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  customer_id: {
    type: String,
    unique: true
  },
  name: {
    type: String
  },
  type: {
    type: String
  },
  status: {
    type: String
  },
  account_manager: {
    type: String
  }
}, {
  timestamps: true
});

// Virtual relationships
customerSchema.virtual('projects', {
  ref: 'Project',
  localField: 'customer_id',
  foreignField: 'customer_ref_id'
});

customerSchema.virtual('tasks', {
  ref: 'Task',
  localField: 'customer_id',
  foreignField: 'customer_ref_id'
});

customerSchema.virtual('documents', {
  ref: 'Document',
  localField: 'customer_id',
  foreignField: 'customer_ref_id'
});

// Ensure virtual fields are serialized
customerSchema.set('toJSON', { virtuals: true });
customerSchema.set('toObject', { virtuals: true });

export default mongoose.model('Customer', customerSchema);