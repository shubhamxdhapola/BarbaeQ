import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance.js';
import { API_PATHS } from '../../utils/apiPaths.js';

export const bookAppointment = createAsyncThunk(
  'appointment/book',
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(API_PATHS.APPOINTMENT.BOOK, bookingData);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to book appointment');
    }
  }
);

export const fetchMyAppointments = createAsyncThunk(
  'appointment/fetchMyAppointments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_PATHS.APPOINTMENT.MY_APPOINTMENTS);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch appointments');
    }
  }
);

export const fetchAppointmentById = createAsyncThunk(
  'appointment/fetchAppointmentById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_PATHS.APPOINTMENT.GET_ONE(id));
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch appointment');
    }
  }
);

export const cancelAppointment = createAsyncThunk(
  'appointment/cancel',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(API_PATHS.APPOINTMENT.CANCEL(id));
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel appointment');
    }
  }
);

export const fetchBarberQueue = createAsyncThunk(
  'appointment/fetchBarberQueue',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_PATHS.APPOINTMENT.BARBER_QUEUE);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch queue');
    }
  }
);

export const startService = createAsyncThunk(
  'appointment/startService',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(API_PATHS.APPOINTMENT.START(id));
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start service');
    }
  }
);

export const completeService = createAsyncThunk(
  'appointment/completeService',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(API_PATHS.APPOINTMENT.COMPLETE(id));
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to complete service');
    }
  }
);

export const approveAppointment = createAsyncThunk(
  'appointment/approve',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(API_PATHS.APPOINTMENT.APPROVE(id));
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve appointment');
    }
  }
);

export const rejectAppointment = createAsyncThunk(
  'appointment/reject',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(API_PATHS.APPOINTMENT.REJECT(id));
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject appointment');
    }
  }
);

export const markNoShow = createAsyncThunk(
  'appointment/markNoShow',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(API_PATHS.APPOINTMENT.NO_SHOW(id));
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark no-show');
    }
  }
);

export const createWalkIn = createAsyncThunk(
  'appointment/createWalkIn',
  async (walkInData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(API_PATHS.APPOINTMENT.WALK_IN, walkInData);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add walk-in');
    }
  }
);

export const fetchBarberAppointments = createAsyncThunk(
  'appointment/fetchBarberAppointments',
  async (range = 'today', { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_PATHS.APPOINTMENT.BARBER_APPOINTMENTS, {
        params: { range }
      });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch barber appointments');
    }
  }
);

export const fetchShopAppointments = createAsyncThunk(
  'appointment/fetchShopAppointments',
  async (args, { rejectWithValue }) => {
    try {
      const shopId = typeof args === 'string' ? args : args?.shopId;
      const range = (typeof args === 'object' && args?.range) || 'today';
      if (!shopId) return [];
      const response = await axiosInstance.get(API_PATHS.APPOINTMENT.SHOP_APPOINTMENTS(shopId), {
        params: { range }
      });
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch shop appointments');
    }
  }
);

const appointmentSlice = createSlice({
  name: 'appointment',
  initialState: {
    myAppointments: [],
    barberQueue: [],
    barberAppointments: [],
    shopAppointments: [],
    currentAppointmentDetails: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyAppointments.pending, (state) => {
        if (!state.myAppointments || state.myAppointments.length === 0) {
          state.loading = true;
        }
      })
      .addCase(fetchMyAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.myAppointments = action.payload;
      })
      .addCase(fetchMyAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAppointmentById.pending, (state, action) => {
        const targetId = action.meta?.arg;
        if (!state.currentAppointmentDetails || (targetId && state.currentAppointmentDetails._id !== targetId)) {
          state.loading = true;
        }
      })
      .addCase(fetchAppointmentById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAppointmentDetails = action.payload;
      })
      .addCase(fetchAppointmentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchBarberQueue.pending, (state) => {
        if (!state.barberQueue || state.barberQueue.length === 0) {
          state.loading = true;
        }
      })
      .addCase(fetchBarberQueue.fulfilled, (state, action) => {
        state.loading = false;
        const payload = Array.isArray(action.payload) 
          ? action.payload 
          : (Array.isArray(action.payload?.data) ? action.payload.data : []);
        state.barberQueue = payload;
      })
      .addCase(fetchBarberQueue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchBarberAppointments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBarberAppointments.fulfilled, (state, action) => {
        state.loading = false;
        const payload = Array.isArray(action.payload) 
          ? action.payload 
          : (Array.isArray(action.payload?.data) ? action.payload.data : []);
        state.barberAppointments = payload;
      })
      .addCase(fetchBarberAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchShopAppointments.fulfilled, (state, action) => {
        state.shopAppointments = Array.isArray(action.payload) 
          ? action.payload 
          : (Array.isArray(action.payload?.data) ? action.payload.data : []);
      });
  },
});

export default appointmentSlice.reducer;
