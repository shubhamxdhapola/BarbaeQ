import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance.js';
import { API_PATHS } from '../../utils/apiPaths.js';

export const fetchPendingShops = createAsyncThunk(
  'admin/fetchPendingShops',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_PATHS.ADMIN.PENDING_SHOPS);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch pending shops');
    }
  }
);

export const fetchApprovedShopsAdmin = createAsyncThunk(
  'admin/fetchApprovedShopsAdmin',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_PATHS.ADMIN.APPROVED_SHOPS);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch approved shops');
    }
  }
);

export const fetchRejectedShopsAdmin = createAsyncThunk(
  'admin/fetchRejectedShopsAdmin',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_PATHS.ADMIN.REJECTED_SHOPS);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch rejected shops');
    }
  }
);

export const fetchShopDetailsAdmin = createAsyncThunk(
  'admin/fetchShopDetailsAdmin',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_PATHS.ADMIN.SHOP_DETAILS(id));
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch shop details');
    }
  }
);

export const approveShopAdmin = createAsyncThunk(
  'admin/approveShopAdmin',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(API_PATHS.ADMIN.APPROVE_SHOP(id));
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve shop');
    }
  }
);

export const rejectShopAdmin = createAsyncThunk(
  'admin/rejectShopAdmin',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(API_PATHS.ADMIN.REJECT_SHOP(id));
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject shop');
    }
  }
);

export const toggleShopStatusAdmin = createAsyncThunk(
  'admin/toggleShopStatusAdmin',
  async (payload, { rejectWithValue }) => {
    try {
      const id = typeof payload === 'object' && payload !== null ? payload.shopId || payload.id : payload;
      const response = await axiosInstance.patch(API_PATHS.ADMIN.TOGGLE_SHOP_STATUS(id));
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle shop status');
    }
  }
);

export const deleteShopAdmin = createAsyncThunk(
  'admin/deleteShopAdmin',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(API_PATHS.ADMIN.DELETE_SHOP(id));
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete shop');
    }
  }
);

// Manager Async Thunks
export const fetchManagersAdmin = createAsyncThunk(
  'admin/fetchManagersAdmin',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_PATHS.ADMIN.MANAGERS);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch managers');
    }
  }
);

export const createManagerAdmin = createAsyncThunk(
  'admin/createManagerAdmin',
  async (managerData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(API_PATHS.ADMIN.CREATE_MANAGER, managerData);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create manager');
    }
  }
);

export const updateManagerAdmin = createAsyncThunk(
  'admin/updateManagerAdmin',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(API_PATHS.ADMIN.UPDATE_MANAGER(id), data);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update manager');
    }
  }
);

export const toggleManagerStatusAdmin = createAsyncThunk(
  'admin/toggleManagerStatusAdmin',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(API_PATHS.ADMIN.TOGGLE_MANAGER_STATUS(id));
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle manager status');
    }
  }
);

export const deleteManagerAdmin = createAsyncThunk(
  'admin/deleteManagerAdmin',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(API_PATHS.ADMIN.DELETE_MANAGER(id));
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete manager');
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    pendingShops: [],
    approvedShops: [],
    rejectedShops: [],
    managers: [],
    selectedShopDetails: null,
    loading: false,
    detailsLoading: false,
    error: null,
  },
  reducers: {
    clearSelectedShopDetails: (state) => {
      state.selectedShopDetails = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPendingShops.pending, (state) => {
        if (state.pendingShops.length === 0) state.loading = true;
      })
      .addCase(fetchPendingShops.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingShops = action.payload;
      })
      .addCase(fetchApprovedShopsAdmin.pending, (state) => {
        if (state.approvedShops.length === 0) state.loading = true;
      })
      .addCase(fetchApprovedShopsAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.approvedShops = action.payload;
      })
      .addCase(fetchRejectedShopsAdmin.pending, (state) => {
        if (state.rejectedShops.length === 0) state.loading = true;
      })
      .addCase(fetchRejectedShopsAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.rejectedShops = action.payload;
      })
      .addCase(fetchShopDetailsAdmin.pending, (state) => {
        state.detailsLoading = true;
      })
      .addCase(fetchShopDetailsAdmin.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedShopDetails = action.payload;
      })
      .addCase(fetchShopDetailsAdmin.rejected, (state) => {
        state.detailsLoading = false;
      })
      .addCase(toggleShopStatusAdmin.fulfilled, (state, action) => {
        const index = state.approvedShops.findIndex((s) => s._id === action.payload._id);
        if (index !== -1) {
          state.approvedShops[index] = action.payload;
        }
      })
      .addCase(deleteShopAdmin.fulfilled, (state, action) => {
        state.approvedShops = state.approvedShops.filter((s) => s._id !== action.payload);
      })
      .addCase(fetchManagersAdmin.pending, (state) => {
        if (state.managers.length === 0) state.loading = true;
      })
      .addCase(fetchManagersAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.managers = action.payload;
      })
      .addCase(createManagerAdmin.fulfilled, (state, action) => {
        state.managers.unshift(action.payload);
      })
      .addCase(updateManagerAdmin.fulfilled, (state, action) => {
        const index = state.managers.findIndex((m) => m._id === action.payload._id);
        if (index !== -1) {
          state.managers[index] = action.payload;
        }
      })
      .addCase(toggleManagerStatusAdmin.fulfilled, (state, action) => {
        const index = state.managers.findIndex((m) => m._id === action.payload._id);
        if (index !== -1) {
          state.managers[index] = action.payload;
        }
      })
      .addCase(deleteManagerAdmin.fulfilled, (state, action) => {
        state.managers = state.managers.filter((m) => m._id !== action.payload);
      });
  },
});

export const { clearSelectedShopDetails } = adminSlice.actions;
export default adminSlice.reducer;
