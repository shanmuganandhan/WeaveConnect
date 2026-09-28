const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    singleton: {
      type: String,
      default: 'platform',
      unique: true,
    },
    orderFlow: {
      type: String,
      default: 'Pending → Accepted → Shipped → Delivered',
    },
    autoAccept: {
      type: Boolean,
      default: false,
    },
    approvalRequired: {
      type: Boolean,
      default: true,
    },
    maxProducts: {
      type: String,
      default: 'Unlimited',
    },
    commission: {
      type: String,
      default: '5%',
    },
    payoutCycle: {
      type: String,
      default: 'Weekly',
    },
  },
  { timestamps: true }
);

// Settings is a single-document store: there is only ever one row.
settingsSchema.statics.getOrCreate = async function () {
  let settings = await this.findOne({ singleton: 'platform' });
  if (!settings) {
    settings = await this.create({ singleton: 'platform' });
  }
  return settings;
};

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;