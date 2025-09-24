import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import PropertyDetails from "./pages/PropertyDetails";
import Login from "./pages/Login";
import RegisterProperty from "./pages/RegisterProperty";
import AdminDashboard from "./pages/AdminDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import SubscriptionPage from "./pages/SubscriptionPage";
import MaintenanceRequest from "./pages/MaintenanceRequest";
import SearchPage from "./pages/SearchPage";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/property/:id" element={<PropertyDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register-property" element={<RegisterProperty />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/owner-dashboard" element={<OwnerDashboard />} />
              <Route path="/staff-dashboard" element={<StaffDashboard />} />
              <Route path="/subscription/:propertyId" element={<SubscriptionPage />} />
              <Route path="/maintenance/create" element={<MaintenanceRequest />} />
              
              {/* Redirect old login routes to the unified login */}
              <Route path="/admin/login" element={<Navigate to="/login" replace />} />
              <Route path="/staff-login" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
