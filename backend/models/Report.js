const mongoose = require('mongoose');

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

const reportSchema = new mongoose.Schema(
  {
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      enum: ['user', 'reddit', 'news'],
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    expiresAt: {
      type: Date,
      default() {
        return new Date(Date.now() + TWO_HOURS_MS);
      },
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('Report', reportSchema);
