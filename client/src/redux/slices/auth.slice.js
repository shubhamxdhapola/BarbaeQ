import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance.js';
import { API_PATHS } from '../../utils/apiPaths.js';

const cleanErrorMessage = (rawMsg, fallback) => {
  if (!rawMsg) return fallback;
  if (typeof rawMsg === 'string') {
    if (rawMsg.includes('E11000') || rawMsg.includes('duplicate key')) {
      if (rawMsg.includes('email')) return 'An account with this email address already exists.';
      if (rawMsg.includes('phone')) return 'An account with this phone number already exists.';
      return 'An account with these details already exists.';
    }
  }
  return rawMsg;
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, credentials);
      
      // Multi-role selection required
      if (response.data?.requiresRoleSelection) {
        return response.data;
      }

      if (response.data?.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      return response.data.user || response.data;
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed';
      return rejectWithValue(cleanErrorMessage(msg, 'Login failed'));
    }
  }
);

export const selectRole = createAsyncThunk(
  'auth/selectRole',
  async ({ role, tempToken }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.SELECT_ROLE, { role, tempToken });
      if (response.data?.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      return response.data.user || response.data;
    } catch (error) {
      const msg = error.response?.data?.message || 'Role selection failed';
      return rejectWithValue(cleanErrorMessage(msg, 'Role selection failed'));
    }
  }
);

export const switchRole = createAsyncThunk(
  'auth/switchRole',
  async ({ role }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.SWITCH_ROLE, { role });
      if (response.data?.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      return response.data.user || response.data;
    } catch (error) {
      const msg = error.response?.data?.message || 'Role switch failed';
      return rejectWithValue(cleanErrorMessage(msg, 'Role switch failed'));
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, userData);
      if (response.data?.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      return response.data.user || response.data;
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed';
      return rejectWithValue(cleanErrorMessage(msg, 'Registration failed'));
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(API_PATHS.AUTH.GET_ME);
      return response.data.user || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Not authenticated');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    try {
      await axiosInstance.post(API_PATHS.AUTH.LOGOUT);
    } catch (err) {
      // Ignore errors on logout
    } finally {
      localStorage.removeItem('authToken');
      return null;
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.patch(API_PATHS.AUTH.UPDATE_PROFILE, formData, {
        headers: formData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
      });
      return response.data.user || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    roleSelectionData: null, // { requiresRoleSelection: true, roles: [], tempToken: '' }
    isLoading: false,
    isAuthenticating: true,
    error: null,
  },
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    resetRoleSelection: (state) => {
      state.roleSelectionData = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticating = false;
        if (action.payload?.requiresRoleSelection) {
          state.roleSelectionData = action.payload;
          state.user = null;
        } else {
          state.user = action.payload;
          state.roleSelectionData = null;
        }
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticating = false;
        state.error = action.payload;
      })
      // Select Role
      .addCase(selectRole.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(selectRole.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticating = false;
        state.user = action.payload;
        state.roleSelectionData = null;
        state.error = null;
      })
      .addCase(selectRole.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticating = false;
        state.error = action.payload;
      })
      // Switch Role
      .addCase(switchRole.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(switchRole.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(switchRole.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticating = false;
        if (action.payload?.requiresPasswordConfirmation) {
          state.user = null;
        } else {
          state.user = action.payload?.user || action.payload;
          state.roleSelectionData = null;
        }
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticating = false;
        state.error = action.payload;
      })
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.isAuthenticating = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isAuthenticating = false;
        state.user = action.payload;
        state.roleSelectionData = null;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isAuthenticating = false;
        state.user = null;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.roleSelectionData = null;
        state.isAuthenticating = false;
        state.isLoading = false;
      })
      // Update Profile / Avatar
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isLoading = false;
      });
  },
});

export const { clearAuthError, resetRoleSelection } = authSlice.actions;
export default authSlice.reducer;
