import { useEffect, useState, useCallback } from 'react';
import { AdminAPI } from '../api';
import { PropertiesAPI } from '../api';

const AdminDashboard = () => {
  const [pendingProperties, setPendingProperties] = useState([]);
  const [approvedProperties, setApprovedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const token = localStorage.getItem('token');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [pending, approved] = await Promise.all([
        AdminAPI.listPending(token),
        PropertiesAPI.listApproved()
      ]);
      setPendingProperties(pending);
      setApprovedProperties(approved);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, loadData]);

  const handleAction = async (id, action) => {
    try {
      if (action === 'approve') {
        await AdminAPI.approve(id, token);
        setPendingProperties(prev => prev.filter(p => p._id !== id));
        // Refresh approved properties
        const approved = await PropertiesAPI.listApproved();
        setApprovedProperties(approved);
      } else if (action === 'reject') {
        await AdminAPI.reject(id, token);
        setPendingProperties(prev => prev.filter(p => p._id !== id));
      } else if (action === 'remove') {
        await AdminAPI.remove(id, token);
        // Remove locally and refresh Home list consumers will refetch on mount
        setApprovedProperties(prev => prev.filter(p => p._id !== id));
      }
    } catch (e) {
      alert(e.message);
    }
  };

  if (!token) return <div className="error">Login as admin first.</div>;
  if (error) return <div className="error">Error: {error}</div>;

  const getStats = () => {
    const totalProperties = pendingProperties.length + approvedProperties.length;
    const approvalRate = totalProperties > 0 ? Math.round((approvedProperties.length / totalProperties) * 100) : 0;
    
    return {
      total: totalProperties,
      pending: pendingProperties.length,
      approved: approvedProperties.length,
      approvalRate
    };
  };

  const stats = getStats();

  return (
    <div className="admin-dashboard">
      {/* Header Section */}
      <div className="admin-header">
        <div className="admin-header-content">
          <div className="admin-header-icon">
            <i className="fas fa-shield-alt"></i>
          </div>
          <div className="admin-header-text">
            <h1>Admin Dashboard</h1>
            <p>Manage property listings and approvals with ease</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">
            <i className="fas fa-home"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Properties</p>
          </div>
        </div>
        
        <div className="stat-card pending">
          <div className="stat-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.pending}</h3>
            <p>Pending Review</p>
          </div>
        </div>
        
        <div className="stat-card approved">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.approved}</h3>
            <p>Approved</p>
          </div>
        </div>
        
        <div className="stat-card rate">
          <div className="stat-icon">
            <i className="fas fa-percentage"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.approvalRate}%</h3>
            <p>Approval Rate</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <i className="fas fa-clock"></i>
          <span className="tab-text">Pending Review</span>
          <span className="tab-count">{pendingProperties.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          <i className="fas fa-check-circle"></i>
          <span className="tab-text">Approved Properties</span>
          <span className="tab-count">{approvedProperties.length}</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="admin-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner">
              <i className="fas fa-spinner fa-spin"></i>
            </div>
            <p>Loading admin data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'pending' && (
              <div className="pending-section">
                <div className="section-header">
                  <h2>
                    <i className="fas fa-clock"></i>
                    Properties Pending Approval
                  </h2>
                  <p>Review and approve new property listings</p>
                </div>
                
                {pendingProperties.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <i className="fas fa-check-circle"></i>
                    </div>
                    <h3>No pending properties</h3>
                    <p>All properties have been reviewed and processed.</p>
                  </div>
                ) : (
                  <div className="admin-properties">
                    {pendingProperties.map((p) => (
                      <div key={p._id} className="admin-property-card pending">
                        <div className="property-image">
                          <img 
                            src={p.images && p.images[0] ? p.images[0] : 'https://via.placeholder.com/400x200/3498db/ffffff?text=No+Image'} 
                            alt={p.title} 
                          />
                          <div className="property-status pending-badge">
                            <i className="fas fa-clock"></i>
                            <span>Pending</span>
                          </div>
                        </div>
                        
                        <div className="property-details">
                          <h4>{p.title}</h4>
                          <div className="property-meta">
                            <span className="meta-item">
                              <i className="fas fa-money-bill-wave"></i>
                              ₹{p.pricePerMonth}/month
                            </span>
                            <span className="meta-item">
                              <i className="fas fa-bed"></i>
                              {p.rooms} rooms
                            </span>
                            <span className="meta-item">
                              <i className="fas fa-ruler-combined"></i>
                              {p.totalAreaSqFt} sq ft
                            </span>
                          </div>
                          <div className="property-address">
                            <i className="fas fa-map-marker-alt"></i>
                            <span>{p.address}</span>
                          </div>
                          <div className="property-lister">
                            <strong>Listed by:</strong> {p.owner?.name || 'Unknown User'}
                          </div>
                        </div>
                        
                        <div className="admin-actions">
                          <button 
                            onClick={() => handleAction(p._id, 'approve')} 
                            className="action-btn approve-btn"
                            title="Approve this property"
                          >
                            <i className="fas fa-check"></i>
                            <span>Approve</span>
                          </button>
                          <button 
                            onClick={() => handleAction(p._id, 'reject')} 
                            className="action-btn reject-btn"
                            title="Reject this property"
                          >
                            <i className="fas fa-times"></i>
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'approved' && (
              <div className="approved-section">
                <div className="section-header">
                  <h2>
                    <i className="fas fa-check-circle"></i>
                    Approved Properties
                  </h2>
                  <p>Manage approved property listings</p>
                </div>
                
                {approvedProperties.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <i className="fas fa-home"></i>
                    </div>
                    <h3>No approved properties</h3>
                    <p>Properties will appear here after approval.</p>
                  </div>
                ) : (
                  <div className="admin-properties">
                    {approvedProperties.map((p) => (
                      <div key={p._id} className="admin-property-card approved">
                        <div className="property-image">
                          <img 
                            src={p.images && p.images[0] ? p.images[0] : 'https://via.placeholder.com/400x200/27ae60/ffffff?text=No+Image'} 
                            alt={p.title} 
                          />
                          <div className="property-status approved-badge">
                            <i className="fas fa-check-circle"></i>
                            <span>Approved</span>
                          </div>
                        </div>
                        
                        <div className="property-details">
                          <h4>{p.title}</h4>
                          <div className="property-meta">
                            <span className="meta-item">
                              <i className="fas fa-money-bill-wave"></i>
                              ₹{p.pricePerMonth}/month
                            </span>
                            <span className="meta-item">
                              <i className="fas fa-bed"></i>
                              {p.rooms} rooms
                            </span>
                            <span className="meta-item">
                              <i className="fas fa-ruler-combined"></i>
                              {p.totalAreaSqFt} sq ft
                            </span>
                          </div>
                          <div className="property-address">
                            <i className="fas fa-map-marker-alt"></i>
                            <span>{p.address}</span>
                          </div>
                          <div className="property-lister">
                            <strong>Listed by:</strong> {p.owner?.name || 'Unknown User'}
                          </div>
                        </div>
                        
                        <div className="admin-actions">
                          <button 
                            onClick={() => handleAction(p._id, 'remove')} 
                            className="action-btn remove-btn"
                            title="Remove this property"
                          >
                            <i className="fas fa-trash"></i>
                            <span>Remove</span>
                          </button>
                          <a 
                            href={`/property/${p._id}`} 
                            className="action-btn view-btn"
                            title="View property details"
                          >
                            <i className="fas fa-eye"></i>
                            <span>View</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
