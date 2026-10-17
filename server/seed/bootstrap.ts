import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { usersRepository } from '../repositories/users.repository.js';
import { logger } from '../utils/logger.js';

export async function bootstrapAdminUser() {
  try {
    const existingAdmin = await usersRepository.findByEmail('rogerio@plioou.com');
    if (!existingAdmin) {
      const generatedPassword = process.env.ADMIN_PASSWORD || crypto.randomBytes(12).toString('base64url');
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(generatedPassword, salt);

      const adminUser = await usersRepository.create({
        id: 'u-1',
        name: 'Administrador Plioou',
        email: 'rogerio@plioou.com',
        role: 'admin',
        passwordHash,
        mustChangePassword: !process.env.ADMIN_PASSWORD,
        tokenVersion: 1,
        active: true,
        createdAt: new Date().toISOString(),
      });

      console.log('================================================================');
      console.log(' [BOOTSTRAP DE SEGURANÇA] Novo Administrador inicial criado:');
      console.log(` E-mail: ${adminUser.email}`);
      console.log(` Senha Inicial Única: ${generatedPassword}`);
      console.log(' (ATENÇÃO: Anote esta senha. Ela não será exibida novamente.)');
      console.log('================================================================');

      logger.info({ email: adminUser.email }, 'Admin user bootstrap completed successfully');
    }
  } catch (err: any) {
    logger.error({ err }, 'Failed to bootstrap admin user');
  }
}
