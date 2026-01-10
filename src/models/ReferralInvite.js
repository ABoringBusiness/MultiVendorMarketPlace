// ReferralInvite Model - Viral loop invitations
const crypto = require('crypto');

module.exports = (sequelize, DataTypes) => {
  const ReferralInvite = sequelize.define('ReferralInvite', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    referrerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
    inviteeEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    inviteeName: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'expired'),
      defaultValue: 'pending',
    },
    inviteCode: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      defaultValue: () => crypto.randomBytes(16).toString('hex'),
    },
    invitedUserId: {
      type: DataTypes.UUID,
      references: { model: 'Users', key: 'id' },
    },
    referrerReward: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 100.00,
    },
    inviteeReward: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 100.00,
    },
    rewardPaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    rewardPaidAt: {
      type: DataTypes.DATE,
    },
    emailSentAt: {
      type: DataTypes.DATE,
    },
    emailOpenedAt: {
      type: DataTypes.DATE,
    },
    linkClickedAt: {
      type: DataTypes.DATE,
    },
    acceptedAt: {
      type: DataTypes.DATE,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  }, {
    tableName: 'ReferralInvites',
    timestamps: true,
  });
  
  ReferralInvite.associate = (models) => {
    ReferralInvite.belongsTo(models.User, { as: 'referrer', foreignKey: 'referrerId' });
    ReferralInvite.belongsTo(models.User, { as: 'invitedUser', foreignKey: 'invitedUserId' });
  };
  
  return ReferralInvite;
};
