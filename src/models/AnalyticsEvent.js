// AnalyticsEvent Model - User behavior tracking
module.exports = (sequelize, DataTypes) => {
  const AnalyticsEvent = sequelize.define('AnalyticsEvent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      references: { model: 'Users', key: 'id' },
    },
    eventType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    eventData: {
      type: DataTypes.JSONB,
    },
    sessionId: {
      type: DataTypes.STRING,
    },
    ipAddress: {
      type: DataTypes.STRING,
    },
    userAgent: {
      type: DataTypes.STRING,
    },
  }, {
    tableName: 'AnalyticsEvents',
    timestamps: true,
    updatedAt: false,
  });
  
  AnalyticsEvent.associate = (models) => {
    AnalyticsEvent.belongsTo(models.User, { as: 'user', foreignKey: 'userId' });
  };
  
  return AnalyticsEvent;
};
