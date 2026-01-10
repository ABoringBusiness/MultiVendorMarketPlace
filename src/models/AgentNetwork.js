// AgentNetwork Model - Relationship graph
module.exports = (sequelize, DataTypes) => {
  const AgentNetwork = sequelize.define('AgentNetwork', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    agentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
    connectedAgentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
    relationshipType: {
      type: DataTypes.ENUM('coworker', 'referral_partner', 'friend', 'mentor', 'team_member'),
      defaultValue: 'referral_partner',
    },
    connectionStrength: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.50,
    },
    transactionCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalRevenue: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
    },
    lastTransactionAt: {
      type: DataTypes.DATE,
    },
    leadsShared: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    leadsReceived: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    referralsSent: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    referralsReceived: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    trustScore: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.50,
    },
    averageRating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.00,
    },
  }, {
    tableName: 'AgentNetwork',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['agentId', 'connectedAgentId'],
      },
    ],
  });
  
  AgentNetwork.associate = (models) => {
    AgentNetwork.belongsTo(models.User, { as: 'agent', foreignKey: 'agentId' });
    AgentNetwork.belongsTo(models.User, { as: 'connectedAgent', foreignKey: 'connectedAgentId' });
  };
  
  return AgentNetwork;
};
