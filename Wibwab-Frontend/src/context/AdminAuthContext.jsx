// context/AdminAuthContext.jsx — session ของฝั่งแอดมินโดยเฉพาะ (แยกจากลูกค้า/พนักงาน)
import { createAuthContext } from './createAuthContext.jsx';

const { AuthProvider: AdminAuthProvider, useAuth: useAdminAuth } = createAuthContext(
  'wibwab_admin_auth',
  'admin'
);

export { AdminAuthProvider, useAdminAuth };
