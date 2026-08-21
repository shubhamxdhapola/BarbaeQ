import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance.js';
import { API_PATHS } from '../../utils/apiPaths.js';

export const fetchShopReviews = createAsyncThunk(
  'review/fetchShopReviews',
  async ({ shopId, barberId, star, page, limit }, { rejectWithValue }) => {
    try {
      const params = {};
      if (barberId && barberId !== 'ALL') params.barberId = barberId;
      if (star && star !== 'ALL') params.star = star;
      if (page) params.page = page;
      if (limit) params.limit = limit;

      const response = await axiosInstance.get(API_PATHS.REVIEW.SHOP_REVIEWS(shopId), { params });
      return response.data.data !== undefined ? response.data.data : response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reviews');
    }
  }
);

export const fetchMyBarberReviews = createAsyncThunk(
  'review/fetchMyBarberReviews',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_PATHS.REVIEW.MY_BARBER_REVIEWS);
      return response.data?.data || response.data || {};
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch barber reviews');
    }
  }
);

const reviewSlice = createSlice({
  name: 'review',
  initialState: {
    reviews: [],
    loading: false,
    error: null,
    lastFetchedShopId: null,
    barberReviews: [],
    barberProfile: null,
    barberLoading: false,
  },
  reducers: {
    clearReviews: (state) => {
      state.reviews = [];
      state.lastFetchedShopId = null;
      state.error = null;
      state.barberReviews = [];
      state.barberProfile = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShopReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShopReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload || [];
        state.lastFetchedShopId = action.meta.arg.shopId;
      })
      .addCase(fetchShopReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMyBarberReviews.pending, (state) => {
        state.barberLoading = true;
        state.error = null;
      })
      .addCase(fetchMyBarberReviews.fulfilled, (state, action) => {
        state.barberLoading = false;
        state.barberReviews = action.payload.reviews || [];
        state.barberProfile = action.payload.barber || null;
      })
      .addCase(fetchMyBarberReviews.rejected, (state, action) => {
        state.barberLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearReviews } = reviewSlice.actions;
export default reviewSlice.reducer;
