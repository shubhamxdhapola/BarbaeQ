import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/auth.slice.js';
import shopReducer from './slices/shop.slice.js';
import barberReducer from './slices/barber.slice.js';
import serviceReducer from './slices/service.slice.js';
import appointmentReducer from './slices/appointment.slice.js';
import adminReducer from './slices/admin.slice.js';
import reviewReducer from './slices/review.slice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    shop: shopReducer,
    barber: barberReducer,
    service: serviceReducer,
    appointment: appointmentReducer,
    admin: adminReducer,
    review: reviewReducer,
  },
});
