// Referral Model - Agent-to-agent lead referrals
module.exports = (sequelize, DataTypes) => {
  const Referral = sequelize.define('Referral', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fromAgentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
    toAgentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
    leadId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Products', key: 'id' },
    },
    referralFeePercent: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.25,
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'completed', 'expired'),
      defaultValue: 'pending',
    },
    acceptedAt: {
      type: DataTypes.DATE,
    },
    rejectedAt: {
      type: DataTypes.DATE,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    expectedCommission: {
      type: DataTypes.DECIMAL(10, 2),
    },
    actualCommission: {
      type: DataTypes.DECIMAL(10, 2),
    },
    referralFeePaid: {
      type: DataTypes.DECIMAL(10, 2),
    },
    paidOut: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    paidOutAt: {
      type: DataTypes.DATE,
    },
    stripeTransferId: {
      type: DataTypes.STRING,
    },
    conversionStatus: {
      type: DataTypes.STRING,
      defaultValue: 'pending',
    },
    closedAt: {
      type: DataTypes.DATE,
    },
    salePrice: {
      type: DataTypes.DECIMAL(10, 2),
    },
    rating: {
      type: DataTypes.INTEGER,
      validate: { min: 1, max: 5 },
    },
    feedback: {
      type: DataTypes.TEXT,
    },
  }, {
    tableName: 'Referrals',
    timestamps: true,
  });
  
  Referral.associate = (models) => {
    Referral.belongsTo(models.User, { as: 'fromAgent', foreignKey: 'fromAgentId' });
    Referral.belongsTo(models.User, { as: 'toAgent', foreignKey: 'toAgentId' });
    Referral.belongsTo(models.Product, { as: 'lead', foreignKey: 'leadId' });
  };
  
  return Referral;
};
