import User from '../models/User.js';

export const initializeDefaultUsers = async () => {
  try {
    const defaultUsers = [
      {
        email: 'superuser@company.com',
        passwordHash: 'admin123',
        fullName: 'Super User (Admin)',
        phone: '+1 (555) 019-9999',
        role: 'super_user',
        status: 'active',
      },
      {
        email: 'user@company.com',
        passwordHash: 'user123',
        fullName: 'John Doe',
        phone: '+1 (555) 012-3456',
        role: 'user',
        status: 'active',
      },
      {
        email: 'inventory@company.com',
        passwordHash: 'inventory123',
        fullName: 'Stock Manager',
        phone: '+1 (555) 015-8888',
        role: 'inventory_admin',
        status: 'active',
      },
      {
        email: 'delivery@company.com',
        passwordHash: 'delivery123',
        fullName: 'Courier Dave',
        phone: '+1 (555) 017-7777',
        role: 'delivery_person',
        status: 'active',
      }
    ];

    for (const userData of defaultUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        await User.create(userData);
        console.log(`[INIT] Created default user: ${userData.email}`);
      }
    }
  } catch (error) {
    console.error('[INIT] Error initializing default users:', error);
  }
};
