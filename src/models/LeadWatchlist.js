// LeadWatchlist Model - Save leads for later
module.exports = (sequelize, DataTypes) => {
  const LeadWatchlist = sequelize.define('LeadWatchlist', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
    leadId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Products', key: 'id' },
    },
    notes: {
      type: DataTypes.TEXT,
    },
  }, {
    tableName: 'LeadWatchlist',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'leadId'],
      },
    ],
  });
  
  LeadWatchlist.associate = (models) => {
    LeadWatchlist.belongsTo(models.User, { as: 'user', foreignKey: 'userId' });
    LeadWatchlist.belongsTo(models.Product, { as: 'lead', foreignKey: 'leadId' });
  };
  
  return LeadWatchlist;
};
