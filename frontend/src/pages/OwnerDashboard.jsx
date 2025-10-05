// ...existing code...
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PropertiesAPI, SubscriptionAPI, MaintenanceAPI, StaffReportAPI } from "../api";

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [properties, setProperties] = useState([]); // owner's properties (with subscription flags)
  const [exploreProperties, setExploreProperties] = useState([]); // all approved properties
  const [subscriptions, setSubscriptions] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forwardedReports, setForwardedReports] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = JSON.parse(localStorage.getItem("user") || "{}");

    if (!token || userData.role !== "owner") {
      navigate("/login");
      return;
    }

    setUser(userData);
    loadDashboardData(userData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const loadDashboardData = async (currentUser) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const userId = currentUser?._id || currentUser?.id;
      console.log('OwnerDashboard: loading data for userId=', userId);

      // 1) Fetch only the owner's properties using listOwnerProperties
      // This will call /api/properties/my endpoint which filters properties by the authenticated owner
      let ownerPropertiesRes = [];
      try {
        // Directly use the listOwnerProperties function which calls the /api/properties/my endpoint
        ownerPropertiesRes = await PropertiesAPI.listOwnerProperties(token);
        console.log('OwnerDashboard: ownerPropertiesRes.length=', (ownerPropertiesRes || []).length);
      } catch (err) {
        console.error("Error fetching owner properties:", err);
        ownerPropertiesRes = [];
      }
      
      // 2) Fetch all approved properties for the explore section
      let propertiesRes = [];
      try {
        propertiesRes = await PropertiesAPI.listApproved?.(token) || [];
      } catch (err) {
        console.warn("Properties fetch failed for explore section", err);
        propertiesRes = [];
      }

      // 3) Fetch subscriptions and maintenance for this owner
      const [subscriptionsRes, maintenanceRes] = await Promise.all([
        SubscriptionAPI.getMySubscriptions ? SubscriptionAPI.getMySubscriptions(token) : (SubscriptionAPI.list ? SubscriptionAPI.list(token) : []),
        MaintenanceAPI.getMyMaintenance ? MaintenanceAPI.getMyMaintenance({ owner: userId }, token) : (MaintenanceAPI.listByOwner ? MaintenanceAPI.listByOwner(userId, token) : [])
      ]);

      // 4) Normalize subscriptions so subscription.property becomes a full property object when possible
      const normalizedSubscriptions = (subscriptionsRes || []).map((sub) => {
        let prop = sub.property;
        if (prop && typeof prop === "string") {
          // look in ownerProperties first then all properties
          const found = (ownerPropertiesRes || []).find((p) => p._id === prop || p.id === prop)
            || (propertiesRes || []).find((p) => p._id === prop || p.id === prop);
          if (found) prop = found;
        }
        return { ...sub, property: prop };
      });

      // 5) Build owner's properties list (use ownerPropertiesRes)
      const userProperties = (ownerPropertiesRes || []).map((prop) => {
        const matchingSub = normalizedSubscriptions.find(
          (s) => s.property && (s.property._id === prop._id || s.property === prop._id || s.property === prop)
        );
        return {
          ...prop,
          hasSubscription: !!matchingSub,
          subscriptionType: matchingSub?.planType || matchingSub?.plan || null
        };
      });

      console.log('OwnerDashboard: Setting user properties, count=', userProperties.length);
      setProperties(userProperties);

      // Explore list: show approved properties (or all if no status field)
      const exploreList = (propertiesRes || []).filter((p) => (p.status ? p.status === "approved" : true));
      setExploreProperties(exploreList);

      setSubscriptions(normalizedSubscriptions);
      setMaintenance(maintenanceRes || []);

      // 6) Load forwarded staff reports and filter to this owner's properties
      setReportLoading(true);
      try {
        let allReports = [];
        if (StaffReportAPI.getAllReports) {
          allReports = await StaffReportAPI.getAllReports(token);
        } else if (StaffReportAPI.list) {
          allReports = await StaffReportAPI.list(token);
        } else if (StaffReportAPI.getReportsForOwner) {
          allReports = await StaffReportAPI.getReportsForOwner(userId, token);
        } else {
          allReports = [];
        }

        const ownerReports = (allReports || []).filter((r) => {
          if (!r) return false;
          const prop = r.property;
          if (!prop) return false;
          const propOwner = prop.owner || prop.ownerId || prop.owner?._id;
          return (
            r.status === "forwarded" &&
            (propOwner === userId || propOwner?._id === userId || propOwner === (userId))
          );
        });

        setForwardedReports(ownerReports);
      } catch (err) {
        console.error("Error loading staff reports:", err);
        setForwardedReports([]);
      } finally {
        setReportLoading(false);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const totalProperties = properties.length;
    const activeSubscriptions = subscriptions.filter((sub) => sub.status === "active").length;
    const pendingMaintenance = maintenance.filter((m) => m.status === "pending").length;
    const completedMaintenance = maintenance.filter((m) => m.status === "completed").length;

    return {
      totalProperties,
      activeSubscriptions,
      pendingMaintenance,
      completedMaintenance
    };
  };

  const handleSubscribe = (propertyId) => {
    navigate(`/subscription/${propertyId}`);
  };

  const handleCreateMaintenance = (propertyId) => {
    navigate(`/maintenance/create?property=${propertyId}`);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-content">
          <div className="admin-header-icon">
            <i className="fas fa-home"></i>
          </div>
          <div>
            <h1>Property Owner Dashboard</h1>
            <p>Manage your properties, subscriptions, and maintenance</p>
          </div>
        </div>
      </div>

      {/* (stats removed) */}

      {/* Tabs: simplified for owners (only two sections) */}
      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === "properties" ? "active" : ""}`}
          onClick={() => setActiveTab("properties")}
        >
          <i className="fas fa-building"></i>
          <span className="tab-text">My Properties</span>
          <span className="tab-count">{properties.length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "reports" ? "active" : ""}`}
          onClick={() => setActiveTab("reports")}
        >
          <i className="fas fa-file-alt"></i>
          <span className="tab-text">Reports</span>
          <span className="tab-count">{forwardedReports.length}</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="admin-content">
        {activeTab === 'properties' && (
          <div className="section-header">
            <h2>My Properties</h2>
            <p>Properties you have registered</p>

            <div className="admin-properties">
              {properties.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <i className="fas fa-home"></i>
                  </div>
                  <h3>No Properties Found</h3>
                  <p>You haven't registered any properties yet.</p>
                  <button className="cta-btn primary" onClick={() => navigate('/register-property')}>
                    <i className="fas fa-plus"></i>
                    Register Property
                  </button>
                </div>
              ) : (
                properties.map((property) => (
                  <div key={property._id} className="admin-property-card">
                    <div className="property-image">
                      <img src={property.images?.[0] || '/placeholder-property.jpg'} alt={property.title} />
                    </div>
                    <div className="property-details">
                      <h4>{property.title}</h4>
                      <div className="property-meta">
                        <div className="meta-item">
                          <i className="fas fa-map-marker-alt"></i>
                          <span>{property.address}</span>
                        </div>
                        <div className="meta-item">
                          <i className="fas fa-bed"></i>
                          <span>{property.rooms} rooms</span>
                        </div>
                      </div>
                      <div className="property-status">
                        <span className={`${property.status}-badge`}>
                          {property.status === 'approved' ? (
                            <><i className="fas fa-check"></i> Approved</>
                          ) : property.status === 'pending' ? (
                            <><i className="fas fa-clock"></i> Pending</>
                          ) : (
                            <><i className="fas fa-times"></i> Rejected</>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="admin-actions">
                      <button className="action-btn view-btn" onClick={() => navigate(`/property/${property._id}`)}>
                        <i className="fas fa-eye"></i> View
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="section-header">
            <h2>Reports</h2>
            <p>Reports forwarded by admin for your properties</p>

            {reportLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"><i className="fas fa-spinner fa-spin"></i></div>
                <p>Loading reports...</p>
              </div>
            ) : forwardedReports.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><i className="fas fa-file-alt"></i></div>
                <h3>No Reports</h3>
                <p>No reports have been forwarded by admin yet.</p>
              </div>
            ) : (
              <div className="admin-properties">
                {forwardedReports.map((report) => (
                  <div key={report._id} className="admin-property-card">
                    <div className="property-details">
                      <h4>{report.property?.title || 'Property'}</h4>
                      <div className="report-content">
                        <p>{report.reportText || 'No details provided.'}</p>
                      </div>
                      <div className="property-meta">
                        <span className="meta-item"><i className="fas fa-user"></i> {report.staff?.name || 'Staff'}</span>
                        <span className="meta-item"><i className="fas fa-calendar"></i> {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : ''}</span>
                      </div>
                      <div className="property-status">
                        <span className={`${report.status}-badge`}><i className="fas fa-circle"></i> {report.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;