import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance.js';
import { API_PATHS } from '../../utils/apiPaths.js';

export const fetchShopServices = createAsyncThunk(
  'service/fetchShopServices',
  async ({ shopId, activeOnly = false }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_PATHS.SERVICE.GET_SHOP_SERVICES(shopId), {
        params: { activeOnly },
      });
      return response.data.data !== undefined ? response.data.data : response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch services');
    }
  }
);

export const addService = createAsyncThunk(
  'service/addService',
  async ({ shopId, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(API_PATHS.SERVICE.ADD(shopId), data);
      return response.data.data !== undefined ? response.data.data : response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add service');
    }
  }
);

export const updateService = createAsyncThunk(
  'service/updateService',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(API_PATHS.SERVICE.UPDATE(id), data);
      return response.data.data !== undefined ? response.data.data : response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update service');
    }
  }
);

export const deleteService = createAsyncThunk(
  'service/deleteService',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(API_PATHS.SERVICE.DELETE(id));
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete service');
    }
  }
);

const serviceSlice = createSlice({
  name: 'service',
  initialState: {
    services: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchShopServices.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchShopServices.fulfilled, (state, action) => {
        state.loading = false;
        state.services = action.payload;
      })
      .addCase(fetchShopServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addService.fulfilled, (state, action) => {
        state.services.unshift(action.payload);
      })
      .addCase(updateService.fulfilled, (state, action) => {
        const index = state.services.findIndex((s) => s._id === action.payload._id);
        if (index !== -1) {
          state.services[index] = action.payload;
        }
      })
      .addCase(deleteService.fulfilled, (state, action) => {
        state.services = state.services.filter((s) => s._id !== action.payload);
      });
  },
});

export default serviceSlice.reducer;
