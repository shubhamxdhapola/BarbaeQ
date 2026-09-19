import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance.js';
import { API_PATHS } from '../../utils/apiPaths.js';

export const fetchApprovedShops = createAsyncThunk(
  'shop/fetchApprovedShops',
  async ({ city, search } = {}, { rejectWithValue }) => {
    try {
      const params = {};
      if (city) params.city = city;
      if (search) params.search = search;
      const response = await axiosInstance.get(API_PATHS.SHOP.GET_ALL, { params });
      return response.data.data !== undefined ? response.data.data : response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch shops');
    }
  }
);

export const fetchShopById = createAsyncThunk(
  'shop/fetchShopById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_PATHS.SHOP.GET_ONE(id));
      return response.data.data !== undefined ? response.data.data : response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch shop');
    }
  }
);

export const fetchMyShop = createAsyncThunk(
  'shop/fetchMyShop',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_PATHS.SHOP.GET_MY_SHOP);
      return response.data.data !== undefined ? response.data.data : response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch my shop');
    }
  }
);

export const createShop = createAsyncThunk(
  'shop/createShop',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(API_PATHS.SHOP.CREATE, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data !== undefined ? response.data.data : response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create shop');
    }
  }
);

export const updateShop = createAsyncThunk(
  'shop/updateShop',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(API_PATHS.SHOP.UPDATE(id), data);
      return response.data.data !== undefined ? response.data.data : response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update shop');
    }
  }
);

export const uploadShopPhotos = createAsyncThunk(
  'shop/uploadShopPhotos',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(API_PATHS.SHOP.UPLOAD_PHOTOS, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data !== undefined ? response.data.data : response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload photos');
    }
  }
);

export const deleteShopPhoto = createAsyncThunk(
  'shop/deleteShopPhoto',
  async (photoUrl, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(API_PATHS.SHOP.DELETE_PHOTO, {
        data: { photoUrl },
      });
      return response.data.data !== undefined ? response.data.data : response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete photo');
    }
  }
);

const shopSlice = createSlice({
  name: 'shop',
  initialState: {
    shops: [],
    selectedShop: null,
    myShop: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchApprovedShops.pending, (state) => {
        if (!state.shops || state.shops.length === 0) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchApprovedShops.fulfilled, (state, action) => {
        state.loading = false;
        state.shops = action.payload;
      })
      .addCase(fetchApprovedShops.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchShopById.pending, (state, action) => {
        const targetId = action.meta?.arg;
        if (!state.selectedShop || (targetId && state.selectedShop._id !== targetId)) {
          state.loading = true;
        }
      })
      .addCase(fetchShopById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedShop = action.payload;
      })
      .addCase(fetchShopById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMyShop.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyShop.fulfilled, (state, action) => {
        state.loading = false;
        state.myShop = action.payload;
      })
      .addCase(fetchMyShop.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createShop.fulfilled, (state, action) => {
        state.myShop = action.payload;
      })
      .addCase(updateShop.fulfilled, (state, action) => {
        state.myShop = action.payload;
      })
      .addCase(uploadShopPhotos.fulfilled, (state, action) => {
        state.myShop = action.payload;
      })
      .addCase(deleteShopPhoto.fulfilled, (state, action) => {
        state.myShop = action.payload;
      });
  },
});

export default shopSlice.reducer;
