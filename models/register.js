'use strict';
const {
  Model
} = require('sequelize');
// const { FOREIGNKEYS } = require('sequelize/types/query-types');
module.exports = (sequelize, DataTypes) => {
  class register extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({secret}) {
      // define association here
      this.hasMany(secret, {foreignKey:'userId'});
    }
  }
  register.init({
    username: DataTypes.STRING,
    password: DataTypes.STRING,
    googleId: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'register',
  });
  return register;
};