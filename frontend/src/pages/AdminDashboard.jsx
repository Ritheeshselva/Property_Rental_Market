
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminAPI, StaffAPI, SubscriptionAPI, MaintenanceAPI, StaffReportAPI } from '../api';
import { PropertiesAPI } from '../api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [pendingProperties, setPendingProperties] = useState([]);
  const [approvedProperties, setApprovedProperties] = useState([]);
  const [staff, setStaff] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staffReports, setStaffReports] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialization: ''
  });
  const token = localStorage.getItem('token');
  // State for property assignment modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignStaffId, setAssignStaffId] = useState(null);
  const [assignForm, setAssignForm] = useState({ propertyId: '', assignmentType: '', dueDate: '', description: '', instructions: '', priority: 'medium' });
  const [assignLoading, setAssignLoading] = useState(false);

    // Fetch all dashboard data
    const loadData = useCallback(async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch all data in parallel
        const [pending, approved, staffList, mySubscriptions, maint, reports] = await Promise.all([
          AdminAPI.listPending(token),
          PropertiesAPI.listApproved(),
          StaffAPI.getAll(token),
          SubscriptionAPI.getMySubscriptions(token),
          MaintenanceAPI.getAll({}, token),
          StaffReportAPI.getAllReports(token)
        ]);
        setPendingProperties(pending);
        setApprovedProperties(approved);
        setStaff(staffList);
        setSubscriptions(Array.isArray(mySubscriptions) ? mySubscriptions : (mySubscriptions.subscriptions || []));
        setMaintenance(maint);
        setStaffReports(reports);
      } catch (err) {
        setError(err.message || 'Failed to load admin data');
      }
      setLoading(false);
    }, [token]);

  // Open assign modal for a staff member
  const openAssignModal = (staffId) => {
    setAssignStaffId(staffId);
    setAssignForm({ propertyId: '', assignmentType: '', dueDate: '', description: '', instructions: '', priority: 'medium' });
    setShowAssignModal(true);
  };

  const handleAssignProperty = async (e) => {
    e.preventDefault();
    setAssignLoading(true);
    try {
      await StaffAPI.assign(assignStaffId, assignForm, token);
      setShowAssignModal(false);
      setAssignStaffId(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
    setAssignLoading(false);
  };

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

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      await StaffAPI.create(newStaff, token);
      setNewStaff({ name: '', email: '', password: '', phone: '', specialization: '' });
      setShowStaffForm(false);
      loadData(); // Refresh data
    } catch (error) {
      alert(error.message);
    }
  };

  const getStats = () => {
    const totalProperties = pendingProperties.length + approvedProperties.length;
    const approvalRate = totalProperties > 0 ? Math.round((approvedProperties.length / totalProperties) * 100) : 0;
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active').length;
    const pendingMaintenance = maintenance.filter(m => m.status === 'pending').length;
    
    return {
      total: totalProperties,
      pending: pendingProperties.length,
      approved: approvedProperties.length,
      approvalRate,
      staff: staff.length,
      subscriptions: activeSubscriptions,
      maintenance: pendingMaintenance
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
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.staff}</h3>
            <p>Staff Members</p>
          </div>
        </div>

        <div className="stat-card total">
          <div className="stat-icon">
            <i className="fas fa-credit-card"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.subscriptions}</h3>
            <p>Active Subscriptions</p>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">
            <i className="fas fa-tools"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.maintenance}</h3>
            <p>Pending Maintenance</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'staffReports' ? 'active' : ''}`}
          onClick={() => setActiveTab('staffReports')}
        >
          <i className="fas fa-file-alt"></i>
          <span className="tab-text">Staff Reports</span>
          <span className="tab-count">{staffReports.length}</span>
        </button>
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
        <button 
          className={`tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
          onClick={() => setActiveTab('staff')}
        >
          <i className="fas fa-users"></i>
          <span className="tab-text">Staff Management</span>
          <span className="tab-count">{staff.length}</span>
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
                        {/* ...existing code for pending property card... */}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'staffReports' && (
              <div className="staff-reports-section">
                <div className="section-header">
                  <h2>
                    <i className="fas fa-file-alt"></i>
                    Staff Inspection/Problem Reports
                  </h2>
                  <p>Review, verify, and forward staff reports to property owners</p>
                </div>
                {reportLoading ? (
                  <div className="loading-container">
                    <div className="loading-spinner">
                      <i className="fas fa-spinner fa-spin"></i>
                    </div>
                    <p>Loading staff reports...</p>
                  </div>
                ) : staffReports.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <i className="fas fa-file-alt"></i>
                    </div>
                    <h3>No staff reports</h3>
                    <p>No inspection/problem reports have been submitted by staff yet.</p>
                  </div>
                ) : (
                  <div className="admin-properties">
                    {staffReports.map(report => (
                      <div key={report._id} className="admin-property-card">
                        {/* ...existing code for staff report card... */}
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

            {activeTab === 'staff' && (
              <div className="staff-section">
                <div className="section-header">
                  <h2>
                    <i className="fas fa-users"></i>
                    Staff Management
                  </h2>
                  <p>Manage staff members and their assignments</p>
                  <button 
                    className="cta-btn primary"
                    onClick={() => setShowStaffForm(!showStaffForm)}
                  >
                    <i className="fas fa-plus"></i>
                    Add New Staff
                  </button>
                </div>

                {showStaffForm && (
                  <div className="form-section">
                    <h3>Create New Staff Member</h3>
                    <form onSubmit={handleCreateStaff}>
                      <div className="input-group">
                        <label>Name</label>
                        <input
                          type="text"
                          value={newStaff.name}
                          onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="input-group">
                        <label>Email</label>
                        <input
                          type="email"
                          value={newStaff.email}
                          onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                          required
                        />
                      </div>
                      <div className="input-group">
                        <label>Password</label>
                        <input
                          type="password"
                          value={newStaff.password}
                          onChange={(e) => setNewStaff({...newStaff, password: e.target.value})}
                          required
                        />
                      </div>
                      <div className="input-group">
                        <label>Phone</label>
                        <input
                          type="tel"
                          value={newStaff.phone}
                          onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                        />
                      </div>
                      <div className="input-group">
                        <label>Specialization</label>
                        <select
                          value={newStaff.specialization}
                          onChange={(e) => setNewStaff({...newStaff, specialization: e.target.value})}
                        >
                          <option value="">Select specialization</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="inspection">Inspection</option>
                          <option value="cleaning">Cleaning</option>
                          <option value="general">General</option>
                        </select>
                      </div>
                      <div className="form-actions">
                        <button type="submit" className="cta-btn primary">
                          <i className="fas fa-plus"></i>
                          Create Staff
                        </button>
                        <button 
                          type="button" 
                          className="cta-btn secondary"
                          onClick={() => setShowStaffForm(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="admin-properties">
                  {staff.map(member => (
                    <div key={member._id} className="admin-property-card">
                      <div className="property-details">
                        <h4>{member.name}</h4>
                        <div className="property-meta">
                          <div className="meta-item">
                            <i className="fas fa-envelope"></i>
                            <span>{member.email}</span>
                          </div>
                          <div className="meta-item">
                            <i className="fas fa-phone"></i>
                            <span>{member.phone || 'Not provided'}</span>
                          </div>
                          <div className="meta-item">
                            <i className="fas fa-tag"></i>
                            <span>{member.specialization || 'General'}</span>
                          </div>
                        </div>
                        <div className="property-status">
                          <span className={`${member.availability}-badge`}>
                            <i className="fas fa-circle"></i>
                            {member.availability}
                          </span>
                        </div>
                      </div>
                      <div className="admin-actions">
                        <button className="action-btn view-btn">
                          <i className="fas fa-eye"></i>
                          View Details
                        </button>
                        <button className="action-btn assign-btn" onClick={() => openAssignModal(member._id)}>
                          <i className="fas fa-user-plus"></i>
                          Assign Property
                        </button>
                        <button className="action-btn remove-btn">
                          <i className="fas fa-trash"></i>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Assign Property Modal */}
                {showAssignModal && (
                  <div className="modal-overlay">
                    <div className="modal-content">
                      <h3>Assign Property to Staff</h3>
                      <form onSubmit={handleAssignProperty}>
                        <div className="input-group">
                          <label>Property</label>
                          <select
                            value={assignForm.propertyId}
                            onChange={e => setAssignForm({ ...assignForm, propertyId: e.target.value })}
                            required
                          >
                            <option value="">Select property</option>
                            {approvedProperties.map(p => (
                              <option key={p._id} value={p._id}>{p.title} - {p.address}</option>
                            ))}
                          </select>
                        </div>
                        <div className="input-group">
                          <label>Assignment Type</label>
                          <select
                            value={assignForm.assignmentType}
                            onChange={e => setAssignForm({ ...assignForm, assignmentType: e.target.value })}
                            required
                          >
                            <option value="">Select type</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="inspection">Inspection</option>
                            <option value="cleaning">Cleaning</option>
                            <option value="general">General</option>
                          </select>
                        </div>
                        <div className="input-group">
                          <label>Due Date</label>
                          <input
                            type="date"
                            value={assignForm.dueDate}
                            onChange={e => setAssignForm({ ...assignForm, dueDate: e.target.value })}
                          />
                        </div>
                        <div className="input-group">
                          <label>Description</label>
                          <textarea
                            value={assignForm.description}
                            onChange={e => setAssignForm({ ...assignForm, description: e.target.value })}
                          />
                        </div>
                        <div className="input-group">
                          <label>Instructions</label>
                          <textarea
                            value={assignForm.instructions}
                            onChange={e => setAssignForm({ ...assignForm, instructions: e.target.value })}
                          />
                        </div>
                        <div className="input-group">
                          <label>Priority</label>
                          <select
                            value={assignForm.priority}
                            onChange={e => setAssignForm({ ...assignForm, priority: e.target.value })}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                        <div className="form-actions">
                          <button type="submit" className="cta-btn primary" disabled={assignLoading}>
                            {assignLoading ? 'Assigning...' : 'Assign Property'}
                          </button>
                          <button type="button" className="cta-btn secondary" onClick={() => setShowAssignModal(false)}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'subscriptions' && (
              <div className="subscriptions-section">
                <div className="section-header">
                  <h2>
                    <i className="fas fa-credit-card"></i>
                    Active Subscriptions
                  </h2>
                  <p>Monitor property subscriptions and payments</p>
                </div>

                <div className="admin-properties">
                  {subscriptions.map(subscription => (
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
                            <i className="fas fa-circle"></i>
                            {subscription.status}
                          </span>
                        </div>
                      </div>
                      <div className="admin-actions">
                        <button className="action-btn view-btn">
                          <i className="fas fa-eye"></i>
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div className="maintenance-section">
                <div className="section-header">
                  <h2>
                    <i className="fas fa-tools"></i>
                    Maintenance Requests
                  </h2>
                  <p>Track and manage property maintenance requests</p>
                </div>

                <div className="admin-properties">
                  {maintenance.map(request => (
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
                            <i className="fas fa-circle"></i>
                            {request.status}
                          </span>
                        </div>
                      </div>
                      <div className="admin-actions">
                        <button className="action-btn view-btn">
                          <i className="fas fa-eye"></i>
                          View Details
                        </button>
                        {request.status === 'pending' && (
                          <button className="action-btn approve-btn">
                            <i className="fas fa-user-plus"></i>
                            Assign Staff
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
