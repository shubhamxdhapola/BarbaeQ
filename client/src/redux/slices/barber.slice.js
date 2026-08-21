import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance.js';
import { API_PATHS } from '../../utils/apiPaths.js';

export const fetchShopBarbers = createAsyncThunk(
  'barber/fetchShopBarbers',
  async (shopId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_PATHS.BARBER.GET_SHOP_BARBERS(shopId));
      return response.data.data !== undefined ? response.data.data : response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch barbers');
    }
  }
);

export const addBarber = createAsyncThunk(
  'barber/addBarber',
  async ({ shopId, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(API_PATHS.BARBER.ADD(shopId), data);
      return response.data.data !== undefined ? response.data.data : response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add barber');
    }
  }
);

export const updateBarber = createAsyncThunk(
  'barber/updateBarber',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(API_PATHS.BARBER.UPDATE(id), data);
      return response.data.data !== undefined ? response.data.data : response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update barber');
    }
  }
);

export const deleteBarber = createAsyncThunk(
  'barber/deleteBarber',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(API_PATHS.BARBER.DELETE(id));
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete barber');
    }
  }
);

export const fetchMyBarberProfile = createAsyncThunk(
  'barber/fetchMyBarberProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_PATHS.BARBER.GET_PROFILE);
      return response.data.data !== undefined ? response.data.data : response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const toggleMyAvailability = createAsyncThunk(
  'barber/toggleMyAvailability',
  async (isAvailable, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(API_PATHS.BARBER.TOGGLE_AVAILABILITY, { isAvailable });
      return response.data.data !== undefined ? response.data.data : response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle availability');
    }
  }
);

export const updateQueueDelay = createAsyncThunk(
  'barber/updateQueueDelay',
  async (delayMinutes, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(API_PATHS.BARBER.SET_DELAY, { delayMinutes });
      return response.data.data !== undefined ? response.data.data : response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update queue delay');
    }
  }
);

const barberSlice = createSlice({
  name: 'barber',
  initialState: {
    barbers: [],
    myProfile: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchShopBarbers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchShopBarbers.fulfilled, (state, action) => {
        state.loading = false;
        state.barbers = action.payload;
      })
      .addCase(fetchShopBarbers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addBarber.fulfilled, (state, action) => {
        state.barbers.unshift(action.payload);
      })
      .addCase(updateBarber.fulfilled, (state, action) => {
        const index = state.barbers.findIndex((b) => b._id === action.payload._id);
        if (index !== -1) {
          state.barbers[index] = action.payload;
        }
      })
      .addCase(deleteBarber.fulfilled, (state, action) => {
        state.barbers = state.barbers.filter((b) => b._id !== action.payload);
      })
      .addCase(fetchMyBarberProfile.fulfilled, (state, action) => {
        const isSame = JSON.stringify(state.myProfile) === JSON.stringify(action.payload);
        if (!isSame) {
          state.myProfile = action.payload;
        }
      })
      .addCase(toggleMyAvailability.fulfilled, (state, action) => {
        state.myProfile = action.payload;
      })
      .addCase(updateQueueDelay.fulfilled, (state, action) => {
        state.myProfile = action.payload;
      });
  },
});

export default barberSlice.reducer;
