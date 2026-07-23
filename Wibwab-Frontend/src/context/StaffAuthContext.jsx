// context/StaffAuthContext.jsx — session ของฝั่งพนักงานโดยเฉพาะ (แยกจากลูกค้า/แอดมิน)
import { createAuthContext } from './createAuthContext.jsx';

const { AuthProvider: StaffAuthProvider, useAuth: useStaffAuth } = createAuthContext(
  'wibwab_staff_auth',
  'staff'
);

export { StaffAuthProvider, useStaffAuth };
