// TeamMember Model - Team membership
module.exports = (sequelize, DataTypes) => {
  const TeamMember = sequelize.define('TeamMember', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    teamId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Teams', key: 'id' },
    },
    agentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
    role: {
      type: DataTypes.ENUM('owner', 'admin', 'member'),
      defaultValue: 'member',
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'TeamMembers',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['teamId', 'agentId'],
      },
    ],
  });
  
  TeamMember.associate = (models) => {
    TeamMember.belongsTo(models.Team, { as: 'team', foreignKey: 'teamId' });
    TeamMember.belongsTo(models.User, { as: 'agent', foreignKey: 'agentId' });
  };
  
  return TeamMember;
};
