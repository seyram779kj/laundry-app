import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { useSelector, useDispatch } from 'react-redux';
import theme from './theme';
import { RootState, AppDispatch } from './app/store';
import { getMe } from './features/auth/authSlice';

// Layout
import MainLayout from './components/layout/MainLayout';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NewOrder from './pages/NewOrder';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Services from './pages/Services';
import ServiceProviderDashboard from './pages/dashboards/ServiceProviderDashboard';
import CustomerDashboard from './pages/dashboards/CustomerDashboard';
import ProviderEarnings from './pages/provider/ProviderEarnings';
import ProviderAvailability from './pages/provider/ProviderAvailability';

// Admin pages
import UsersManagement from './pages/admin/UsersManagement';
import OrdersManagement from './pages/admin/OrdersManagement';
import ServicesManagement from './pages/admin/ServicesManagement';
import Analytics from './pages/admin/Analytics';
import PaymentsManagement from './pages/admin/PaymentsManagement';
import ReviewsManagement from './pages/admin/ReviewsManagement';

// Authentication Initialization Component
const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Check if user is already authenticated (has token)
    const token = localStorage.getItem('token');
    console.log('🔍 AuthInitializer check:', { token: token ? 'exists' : 'null', isAuthenticated, loading });
    
    if (token && !isAuthenticated) {
      console.log('🔄 Calling getMe() to restore authentication...');
      dispatch(getMe());
    }
  }, [dispatch, isAuthenticated]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
};

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const user = useSelector((state: RootState) => state.auth.user);
  
  console.log('🔍 ProtectedRoute check:', { isAuthenticated, user: user ? 'exists' : 'null' });
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};

// Role-Based Route Component
const RoleBasedRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
};

// Unauthorized Access Page
const Unauthorized: React.FC = () => {
  return (
    <MainLayout title="Unauthorized">
      <div style={{ padding: '2rem' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
      </div>
    </MainLayout>
  );
};

// Root Route Component
const RootRoute: React.FC = () => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/" />;
  }

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin" />;
    case 'service_provider':
      return <Navigate to="/provider" />;
    case 'customer':
      return <Navigate to="/customer" />;
    default:
      return <Navigate to="/login" />;
  }
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthInitializer>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Root Route - Redirects to appropriate dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <RootRoute />
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes */}
              {/* Admin Routes */}
              <Route
                path="/admin/*"
                element={
                  <RoleBasedRoute allowedRoles={['admin']}>
                    <MainLayout title="Admin Dashboard">
                      <Routes>
                        <Route index element={<Dashboard />} />
                        <Route path="users" element={<UsersManagement />} />
                        <Route path="orders" element={<OrdersManagement />} />
                        <Route path="services" element={<ServicesManagement />} />
                        <Route path="analytics" element={<Analytics />} />
                        <Route path="payments" element={<PaymentsManagement />} />
                        <Route path="reviews" element={<ReviewsManagement />} />
                      </Routes>
                    </MainLayout>
                  </RoleBasedRoute>
                }
              />

              {/* Customer Routes */}
              <Route
                path="/customer/*"
                element={
                  <RoleBasedRoute allowedRoles={['customer']}>
                    <MainLayout title="Customer Dashboard">
                      <Routes>
                        <Route index element={<CustomerDashboard />} />
                        <Route path="new-order" element={<NewOrder />} />
                        <Route path="orders" element={<Orders />} />
                        <Route path="services" element={<Services />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="settings" element={<Settings />} />
                      </Routes>
                    </MainLayout>
                  </RoleBasedRoute>
                }
              />

              {/* Service Provider Routes */}
              <Route
                path="/provider/*"
                element={
                  <RoleBasedRoute allowedRoles={['service_provider']}>
                    <MainLayout title="Provider Dashboard">
                      <Routes>
                        <Route index element={<ServiceProviderDashboard />} />
                        <Route path="orders" element={<Orders />} />
                        <Route path="earnings" element={<ProviderEarnings />} />
                        <Route path="availability" element={<ProviderAvailability />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="settings" element={<Settings />} />
                      </Routes>
                    </MainLayout>
                  </RoleBasedRoute>
                }
              />

              {/* Unauthorized Access */}
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route
                path="/new-order"
                element={
                  <ProtectedRoute>
                    <MainLayout title="New Order">
                      <NewOrder />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <MainLayout title="My Orders">
                      <Orders />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <MainLayout title="Profile">
                      <Profile />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <MainLayout title="Settings">
                      <Settings />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/services"
                element={
                  <ProtectedRoute>
                    <MainLayout title="Services">
                      <Services />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </AuthInitializer>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
