const { Schema, model } = require('mongoose');

const commentSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const supportIssueSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignee: { type: Schema.Types.ObjectId, ref: 'User' },
    comments: { type: [commentSchema], default: [] },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    // Complaint categorization
    category: { type: String, enum: ['product', 'staff', 'service', 'other'], default: 'other', index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    staff: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = { SupportIssue: model('SupportIssue', supportIssueSchema) };
