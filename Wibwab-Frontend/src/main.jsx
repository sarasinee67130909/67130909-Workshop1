import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
// สามฝั่ง (ลูกค้า/พนักงาน/แอดมิน) มี AuthProvider แยกกันคนละ localStorage key
// จึงล็อกอินพร้อมกันได้ทั้ง 3 role ในเบราว์เซอร์เดียวกันโดยไม่ทับ session กัน
import { CustomerAuthProvider } from './context/CustomerAuthContext';
import { StaffAuthProvider } from './context/StaffAuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { CartProvider } from './context/CartContext';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CustomerAuthProvider>
        <StaffAuthProvider>
          <AdminAuthProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </AdminAuthProvider>
        </StaffAuthProvider>
      </CustomerAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);