// Lead Transaction Model - Tracks lead purchases
module.exports = (sequelize, DataTypes) => {
  const LeadTransaction = sequelize.define('LeadTransaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    listingId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Products', key: 'id' },
    },
    sellerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
    buyerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    platformFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    sellerPayout: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'refunded', 'disputed'),
      defaultValue: 'pending',
    },
    leadQualityRating: {
      type: DataTypes.INTEGER,
      validate: { min: 1, max: 5 },
    },
    conversionStatus: {
      type: DataTypes.ENUM('pending', 'contacted', 'meeting_scheduled', 'under_contract', 'closed', 'lost'),
      defaultValue: 'pending',
    },
  }, {
    tableName: 'LeadTransactions',
    timestamps: true,
  });
  
  LeadTransaction.associate = (models) => {
    LeadTransaction.belongsTo(models.Product, { as: 'listing', foreignKey: 'listingId' });
    LeadTransaction.belongsTo(models.User, { as: 'seller', foreignKey: 'sellerId' });
    LeadTransaction.belongsTo(models.User, { as: 'buyer', foreignKey: 'buyerId' });
  };
  
  return LeadTransaction;
};
