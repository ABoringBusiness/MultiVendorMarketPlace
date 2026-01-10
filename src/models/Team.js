// Team Model - Brokerage team accounts
module.exports = (sequelize, DataTypes) => {
  const Team = sequelize.define('Team', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    brokerage: {
      type: DataTypes.STRING,
    },
    ownerAgentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
    memberCount: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    discountPercent: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.00,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    totalLeadsPurchased: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalSpent: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
    },
    totalEarnings: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
    },
  }, {
    tableName: 'Teams',
    timestamps: true,
  });
  
  Team.associate = (models) => {
    Team.belongsTo(models.User, { as: 'owner', foreignKey: 'ownerAgentId' });
    Team.hasMany(models.TeamMember, { as: 'members', foreignKey: 'teamId' });
    Team.hasMany(models.User, { as: 'agents', foreignKey: 'teamId' });
  };
  
  return Team;
};
