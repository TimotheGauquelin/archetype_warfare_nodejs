import sequelize from '../config/Sequelize.js';
import User from '../models/UserModel.js';
import Role from '../models/RoleModel.js';
import { execSync } from 'child_process';
import path from 'path';

beforeAll(async () => {
  await sequelize.sync({ force: true });
  const seedPath = path.join(__dirname, '../config/scripts/seed_test.sql');
  execSync(`psql -U postgres -d archetype_warfare_test -f "${seedPath}"`);
});

afterAll(async () => {
  await sequelize.close();
});

afterEach(async () => {
  await User.destroy({ where: {}, force: true });
  await Role.destroy({ where: {}, force: true });
});
