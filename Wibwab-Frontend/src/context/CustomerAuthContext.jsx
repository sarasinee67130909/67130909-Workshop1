// context/CustomerAuthContext.jsx — session ของฝั่งลูกค้าโดยเฉพาะ (แยกจาก staff/admin)
import { createAuthContext } from './createAuthContext.jsx';

const { AuthProvider: CustomerAuthProvider, useAuth: useCustomerAuth } = createAuthContext(
  'wibwab_customer_auth',
  'customer'
);

export { CustomerAuthProvider, useCustomerAuth };
