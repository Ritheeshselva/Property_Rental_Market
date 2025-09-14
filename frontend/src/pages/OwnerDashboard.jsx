import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PropertiesAPI, SubscriptionAPI, MaintenanceAPI } from "../api";

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [properties, setProperties] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || userData.role !== 'owner') {
      navigate('/login');
      return;
    }

    setUser(userData);
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [propertiesRes, subscriptionsRes, maintenanceRes] = await Promise.all([
        PropertiesAPI.listApproved(),
        SubscriptionAPI.getMySubscriptions(token),
        MaintenanceAPI.getMyMaintenance({}, token)
      ]);

      // Filter properties owned by current user
      const userProperties = propertiesRes.filter(prop => 
        prop.owner && prop.owner._id === user?.id
      );

      setProperties(userProperties);
      setSubscriptions(subscriptionsRes);
      setMaintenance(maintenanceRes);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const totalProperties = properties.length;
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active').length;
    const pendingMaintenance = maintenance.filter(m => m.status === 'pending').length;
    const completedMaintenance = maintenance.filter(m => m.status === 'completed').length;

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

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">
            <i className="fas fa-building"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalProperties}</h3>
            <p>Total Properties</p>
          </div>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon">
            <i className="fas fa-credit-card"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.activeSubscriptions}</h3>
            <p>Active Subscriptions</p>
          </div>
        </div>
        <div className="stat-card approved">
          <div className="stat-icon">
            <i className="fas fa-tools"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.pendingMaintenance}</h3>
            <p>Pending Maintenance</p>
          </div>
        </div>
        <div className="stat-card rate">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.completedMaintenance}</h3>
            <p>Completed Tasks</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="fas fa-chart-pie"></i>
          <span className="tab-text">Overview</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'properties' ? 'active' : ''}`}
          onClick={() => setActiveTab('properties')}
        >
          <i className="fas fa-building"></i>
          <span className="tab-text">Properties</span>
          <span className="tab-count">{properties.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'subscriptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          <i className="fas fa-credit-card"></i>
          <span className="tab-text">Subscriptions</span>
          <span className="tab-count">{subscriptions.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`}
          onClick={() => setActiveTab('maintenance')}
        >
          <i className="fas fa-tools"></i>
          <span className="tab-text">Maintenance</span>
          <span className="tab-count">{maintenance.length}</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="admin-content">
        {activeTab === 'overview' && (
          <div className="section-header">
            <h2>Property Overview</h2>
            <p>Quick overview of your property portfolio</p>
            
            <div className="admin-properties">
              {properties.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <i className="fas fa-home"></i>
                  </div>
                  <h3>No Properties Found</h3>
                  <p>You haven't registered any properties yet.</p>
                  <button 
                    className="cta-btn primary"
                    onClick={() => navigate('/register-property')}
                  >
                    <i className="fas fa-plus"></i>
                    Register Property
                  </button>
                </div>
              ) : (
                properties.map(property => (
                  <div key={property._id} className="admin-property-card">
                    <div className="property-image">
                      <img 
                        src={property.images?.[0] || '/placeholder-property.jpg'} 
                        alt={property.title}
                      />
                    </div>
                    <div className="property-details">
                      <h4>{property.title}</h4>
                      <div className="property-meta">
                        <div className="meta-item">
                          <i className="fas fa-map-marker-alt"></i>
                          <span>{property.address}</span>
                        </div>
                        <div className="meta-item">
                          <i className="fas fa-dollar-sign"></i>
                          <span>₹{property.pricePerMonth}/month</span>
                        </div>
                        <div className="meta-item">
                          <i className="fas fa-bed"></i>
                          <span>{property.rooms} rooms</span>
                        </div>
                      </div>
                      <div className="property-status">
                        {property.hasSubscription ? (
                          <span className="approved-badge">
                            <i className="fas fa-check"></i>
                            Subscribed ({property.subscriptionType})
                          </span>
                        ) : (
                          <span className="pending-badge">
                            <i className="fas fa-exclamation"></i>
                            No Subscription
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="admin-actions">
                      {!property.hasSubscription && (
                        <button 
                          className="action-btn approve-btn"
                          onClick={() => handleSubscribe(property._id)}
                        >
                          <i className="fas fa-credit-card"></i>
                          Subscribe
                        </button>
                      )}
                      <button 
                        className="action-btn view-btn"
                        onClick={() => navigate(`/property/${property._id}`)}
                      >
                        <i className="fas fa-eye"></i>
                        View
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'properties' && (
          <div className="section-header">
            <h2>My Properties</h2>
            <p>Manage your property listings</p>
            
            <div className="admin-properties">
              {properties.map(property => (
                <div key={property._id} className="admin-property-card">
                  <div className="property-image">
                    <img 
                      src={property.images?.[0] || '/placeholder-property.jpg'} 
                      alt={property.title}
                    />
                  </div>
                  <div className="property-details">
                    <h4>{property.title}</h4>
                    <div className="property-meta">
                      <div className="meta-item">
                        <i className="fas fa-map-marker-alt"></i>
                        <span>{property.address}</span>
                      </div>
                      <div className="meta-item">
                        <i className="fas fa-dollar-sign"></i>
                        <span>₹{property.pricePerMonth}/month</span>
                      </div>
                      <div className="meta-item">
                        <i className="fas fa-bed"></i>
                        <span>{property.rooms} rooms</span>
                      </div>
                    </div>
                    <div className="property-status">
                      <span className={`${property.status}-badge`}>
                        {property.status === 'approved' ? (
                          <>
                            <i className="fas fa-check"></i>
                            Approved
                          </>
                        ) : property.status === 'pending' ? (
                          <>
                            <i className="fas fa-clock"></i>
                            Pending
                          </>
                        ) : (
                          <>
                            <i className="fas fa-times"></i>
                            Rejected
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="admin-actions">
                    <button 
                      className="action-btn view-btn"
                      onClick={() => navigate(`/property/${property._id}`)}
                    >
                      <i className="fas fa-eye"></i>
                      View
                    </button>
                    <button 
                      className="action-btn"
                      onClick={() => handleCreateMaintenance(property._id)}
                    >
                      <i className="fas fa-tools"></i>
                      Maintenance
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="section-header">
            <h2>My Subscriptions</h2>
            <p>Manage your property subscriptions</p>
            
            <div className="admin-properties">
              {subscriptions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <i className="fas fa-credit-card"></i>
                  </div>
                  <h3>No Subscriptions</h3>
                  <p>You don't have any active subscriptions yet.</p>
                </div>
              ) : (
                subscriptions.map(subscription => (
                  <div key={subscription._id} className="admin-property-card">
                    <div className="property-details">
                      <h4>{subscription.property.title}</h4>
                      <div className="property-meta">
                        <div className="meta-item">
                          <i className="fas fa-tag"></i>
                          <span>{subscription.planType.toUpperCase()} Plan</span>
                        </div>
                        <div className="meta-item">
                          <i className="fas fa-dollar-sign"></i>
                          <span>₹{subscription.amount}/month</span>
                        </div>
                        <div className="meta-item">
                          <i className="fas fa-calendar"></i>
                          <span>Expires: {new Date(subscription.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="property-status">
                        <span className={`${subscription.status}-badge`}>
                          {subscription.status === 'active' ? (
                            <>
                              <i className="fas fa-check"></i>
                              Active
                            </>
                          ) : (
                            <>
                              <i className="fas fa-times"></i>
                              {subscription.status}
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="admin-actions">
                      <button 
                        className="action-btn view-btn"
                        onClick={() => navigate(`/subscription/${subscription._id}`)}
                      >
                        <i className="fas fa-eye"></i>
                        View Details
                      </button>
                      {subscription.status === 'active' && (
                        <button 
                          className="action-btn reject-btn"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to cancel this subscription?')) {
                              // Handle cancellation
                            }
                          }}
                        >
                          <i className="fas fa-times"></i>
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="section-header">
            <h2>Maintenance Requests</h2>
            <p>Track and manage property maintenance</p>
            
            <div className="admin-properties">
              {maintenance.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <i className="fas fa-tools"></i>
                  </div>
                  <h3>No Maintenance Requests</h3>
                  <p>You haven't created any maintenance requests yet.</p>
                </div>
              ) : (
                maintenance.map(request => (
                  <div key={request._id} className="admin-property-card">
                    <div className="property-details">
                      <h4>{request.title}</h4>
                      <div className="property-meta">
                        <div className="meta-item">
                          <i className="fas fa-building"></i>
                          <span>{request.property.title}</span>
                        </div>
                        <div className="meta-item">
                          <i className="fas fa-tag"></i>
                          <span>{request.type}</span>
                        </div>
                        <div className="meta-item">
                          <i className="fas fa-exclamation-triangle"></i>
                          <span>{request.priority}</span>
                        </div>
                      </div>
                      <div className="property-status">
                        <span className={`${request.status}-badge`}>
                          {request.status === 'completed' ? (
                            <>
                              <i className="fas fa-check"></i>
                              Completed
                            </>
                          ) : request.status === 'in_progress' ? (
                            <>
                              <i className="fas fa-clock"></i>
                              In Progress
                            </>
                          ) : (
                            <>
                              <i className="fas fa-exclamation"></i>
                              Pending
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="admin-actions">
                      <button 
                        className="action-btn view-btn"
                        onClick={() => navigate(`/maintenance/${request._id}`)}
                      >
                        <i className="fas fa-eye"></i>
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;
