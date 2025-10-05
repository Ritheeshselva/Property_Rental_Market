import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MaintenanceAPI, StaffAPI, StaffReportAPI, PropertiesAPI } from "../api";
import "./StaffDashboard.css";

// Helper function to normalize image URLs
const getImageUrl = (image) => {
  if (!image) return null;
  
  // If it's already a full URL, return it
  if (image.startsWith('http')) {
    return image;
  }
  
  // Handle relative paths
  const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
  if (image.startsWith('/uploads/')) {
    return `${apiBase}${image}`;
  } else if (image.startsWith('uploads/')) {
    return `${apiBase}/${image}`;
  } else {
    return `${apiBase}/uploads/${image}`;
  }
};

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('assignments');
  const [assignments, setAssignments] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [tenantDetails, setTenantDetails] = useState({});
  const [reportText, setReportText] = useState({});
  const [reportSubmitting, setReportSubmitting] = useState({});
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [propertyDetailsLoading, setPropertyDetailsLoading] = useState(false);
  const [propertyDetails, setPropertyDetails] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || userData.role !== 'staff') {
      navigate('/login');
      return;
    }

    setUser(userData);
    loadDashboardData(userData);
  }, [navigate]);

  const loadDashboardData = async (currentUser) => {
    try {
      const token = localStorage.getItem('token');
      const userData = currentUser || user || JSON.parse(localStorage.getItem('user') || '{}');
      
      // Debug output of the full user data
      console.log('Staff Dashboard - Full User Data:', JSON.stringify(userData, null, 2));
      
      // Check for all possible ID formats
      const userId = userData?._id || userData?.staffId || userData?.id;
      
      if (!userId) {
        console.error('User ID not found in userData:', userData);
        setLoading(false);
        return;
      }
      
      console.log('Staff Dashboard: Loading assignments for staff ID:', userId);
      
      let assignmentsRes = [];
      let maintenanceRes = [];
      
      try {
        assignmentsRes = await StaffAPI.getAssignments(userId, token);
        console.log('Staff assignments loaded:', assignmentsRes.length);
        
        // Debug the first assignment's images
        if (assignmentsRes.length > 0 && assignmentsRes[0].property) {
          console.log('First assignment property:', assignmentsRes[0].property.title);
          console.log('First assignment images:', JSON.stringify(assignmentsRes[0].property.images));
        }
        
        setAssignments(assignmentsRes);
      } catch (err) {
        console.error('Error loading staff assignments:', err);
        setAssignments([]);
      }
      
      try {
        maintenanceRes = await MaintenanceAPI.getStaffAssignments({staffId: userId}, token);
        console.log('Staff maintenance tasks loaded:', maintenanceRes.length);
        setMaintenance(maintenanceRes);
      } catch (err) {
        console.error('Error loading maintenance tasks:', err);
        setMaintenance([]);
      }

      // Fetch tenant details for each assignment's property
      const tenantMap = {};
      for (const assignment of (assignmentsRes || [])) {
        if (assignment && assignment.property && assignment.property._id) {
          try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/properties/${assignment.property._id}/bookings`);
            if (res.ok) {
              const bookings = await res.json();
              // Find the latest confirmed booking
              const confirmed = bookings.find(b => b.status === 'confirmed');
              if (confirmed) tenantMap[assignment._id] = confirmed;
            }
          } catch (err) {
            console.error('Error fetching tenant details for property:', assignment.property._id, err);
          }
        }
      }
      setTenantDetails(tenantMap);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleViewPropertyDetails = async (propertyId) => {
    setSelectedProperty(propertyId);
    setPropertyDetailsLoading(true);
    
    try {
      console.log('Fetching details for property ID:', propertyId);
      const details = await PropertiesAPI.get(propertyId);
      console.log('Property details received:', details);
      
      // Log image URLs for debugging
      if (details && details.images) {
        console.log('Property images:', details.images);
      }
      
      setPropertyDetails(details);
    } catch (error) {
      console.error('Error fetching property details:', error);
      alert('Could not load property details');
    } finally {
      setPropertyDetailsLoading(false);
    }
  };
  
  const closePropertyDetailsModal = () => {
    setSelectedProperty(null);
    setPropertyDetails(null);
  };
  
  // Add ESC key handler for modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && selectedProperty) {
        closePropertyDetailsModal();
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [selectedProperty]);

  const handleReportChange = (assignmentId, value) => {
    setReportText(prev => ({ ...prev, [assignmentId]: value }));
  };

  const handleSubmitReport = async (assignmentId) => {
    setReportSubmitting(prev => ({ ...prev, [assignmentId]: true }));
    try {
      const token = localStorage.getItem('token');
      await StaffReportAPI.submitReport(assignmentId, reportText[assignmentId], token);
      setReportText(prev => ({ ...prev, [assignmentId]: '' }));
      alert('Report submitted successfully!');
    } catch (e) {
      alert('Failed to submit report: ' + e.message);
    } finally {
      setReportSubmitting(prev => ({ ...prev, [assignmentId]: false }));
    }
  };

  const getStats = () => {
    const totalAssignments = assignments.length;
    const pendingAssignments = assignments.filter(a => a.status === 'assigned' || a.status === 'accepted').length;
    const completedAssignments = assignments.filter(a => a.status === 'completed').length;
    const pendingMaintenance = maintenance.filter(m => m.status === 'pending' || m.status === 'in_progress').length;

    return {
      total: totalAssignments,
      pending: pendingAssignments,
      completed: completedAssignments,
      maintenance: pendingMaintenance
    };
  };

  const handleUpdateAssignment = async (assignmentId, status, notes) => {
    try {
      const token = localStorage.getItem('token');
      await StaffAPI.updateAssignment(assignmentId, { status, notes }, token);
      loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error updating assignment:', error);
      alert('Failed to update assignment');
    }
  };

  const handleUpdateMaintenance = async (maintenanceId, status, staffNotes) => {
    try {
      const token = localStorage.getItem('token');
      await MaintenanceAPI.updateStatus(maintenanceId, { status, staffNotes }, token);
      loadDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error updating maintenance:', error);
      alert('Failed to update maintenance');
    }
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header Section */}
      <div className="admin-header">
        <div className="admin-header-content">
          <div className="admin-header-icon">
            <i className="fas fa-tools"></i>
          </div>
          <div>
            <h1>Staff Dashboard</h1>
            <p>Manage your assignments and maintenance tasks</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">
            <i className="fas fa-tasks"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Assignments</p>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.pending}</h3>
            <p>Pending Tasks</p>
          </div>
        </div>

        <div className="stat-card approved">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.completed}</h3>
            <p>Completed Tasks</p>
          </div>
        </div>

        <div className="stat-card rate">
          <div className="stat-icon">
            <i className="fas fa-wrench"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.maintenance}</h3>
            <p>Maintenance Tasks</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          <i className="fas fa-tasks"></i>
          <span className="tab-text">My Assignments</span>
          <span className="tab-count">{assignments.length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`}
          onClick={() => setActiveTab('maintenance')}
        >
          <i className="fas fa-wrench"></i>
          <span className="tab-text">Maintenance</span>
          <span className="tab-count">{maintenance.length}</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="admin-content">
        {activeTab === 'assignments' && (
          <div className="assignments-section">
            <div className="section-header">
              <h2>
                <i className="fas fa-tasks"></i>
                My Assignments
              </h2>
              <p>Manage your assigned property tasks</p>
            </div>

            <div className="admin-properties">
              {assignments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <i className="fas fa-tasks"></i>
                  </div>
                  <h3>No assignments yet</h3>
                  <p>You haven't been assigned to any properties yet.</p>
                </div>
              ) : (
                assignments.map(assignment => (
                  <div key={assignment._id} className="admin-property-card property-enhanced-display">
                    <div className="property-details">
                      {/* Property Image - Clickable to show details */}
                      <div 
                        className="property-image-container" 
                        onClick={() => handleViewPropertyDetails(assignment.property._id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <img 
                          src={assignment.property.images && assignment.property.images.length > 0 
                            ? getImageUrl(assignment.property.images[0])
                            : "https://via.placeholder.com/400x250/3498db/ffffff?text=No+Image"} 
                          alt={assignment.property.title} 
                          className="property-image"
                          onError={(e) => {
                            console.log("Image failed to load:", e.target.src);
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/400x250/3498db/ffffff?text=No+Image";
                          }}
                        />
                        <div className="image-overlay">
                          <i className="fas fa-search-plus"></i>
                          <span>View Details</span>
                        </div>
                        <span className={`assignment-status-badge ${assignment.status}-badge`}>
                          <i className="fas fa-circle"></i>
                          {assignment.status}
                        </span>
                      </div>
                      
                      {/* Property Title */}
                      <h4 className="property-title">{assignment.property.title}</h4>
                      
                      {/* Property Meta Data */}
                      <div className="property-meta">
                        <div className="meta-item">
                          <i className="fas fa-map-marker-alt"></i>
                          <span>{assignment.property.address}</span>
                        </div>
                        <div className="meta-item">
                          <i className="fas fa-tag"></i>
                          <span>{assignment.assignmentType.replace('_', ' ')}</span>
                        </div>
                        <div className="meta-item">
                          <i className="fas fa-calendar"></i>
                          <span>Next Inspection: {assignment.nextInspectionDate ? new Date(assignment.nextInspectionDate).toLocaleDateString() : 'Not scheduled'}</span>
                        </div>
                      </div>
                      
                      {/* Assignment Details */}
                      <div className="assignment-details">
                        <h5><i className="fas fa-clipboard-list"></i> Assignment Details</h5>
                        {assignment.description && (
                          <p className="assignment-description">{assignment.description}</p>
                        )}
                        {assignment.instructions && (
                          <div className="assignment-instructions">
                            <strong>Instructions:</strong> {assignment.instructions}
                          </div>
                        )}
                      </div>
                      
                      {/* Assignment Status */}
                      <div className="property-status">
                        <span className={`${assignment.status}-badge`}>
                          <i className="fas fa-circle"></i>
                          {assignment.status}
                        </span>
                      </div>
                      {/* Tenant details */}
                      {tenantDetails[assignment._id] && (
                        <div className="tenant-details">
                          <h5>Tenant Details</h5>
                          <p><strong>Name:</strong> {tenantDetails[assignment._id].name}</p>
                          <p><strong>Email:</strong> {tenantDetails[assignment._id].email}</p>
                          <p><strong>Phone:</strong> {tenantDetails[assignment._id].phone}</p>
                          <p><strong>Start Date:</strong> {new Date(tenantDetails[assignment._id].startDate).toLocaleDateString()}</p>
                        </div>
                      )}
                      {/* Report submission form */}
                      <div className="report-section">
                        <h5>Submit Inspection/Problem Report</h5>
                        <textarea
                          value={reportText[assignment._id] || ''}
                          onChange={e => handleReportChange(assignment._id, e.target.value)}
                          placeholder="Describe inspection result or any issues..."
                          rows={3}
                          style={{ width: '100%' }}
                        />
                        <button
                          className="action-btn approve-btn"
                          disabled={reportSubmitting[assignment._id] || !(reportText[assignment._id] && reportText[assignment._id].trim())}
                          onClick={() => handleSubmitReport(assignment._id)}
                        >
                          {reportSubmitting[assignment._id] ? 'Submitting...' : 'Submit Report'}
                        </button>
                      </div>
                    </div>
                    <div className="admin-actions">
                      {assignment.status === 'assigned' && (
                        <button 
                          className="action-btn approve-btn"
                          onClick={() => handleUpdateAssignment(assignment._id, 'accepted', '')}
                        >
                          <i className="fas fa-check"></i>
                          Accept
                        </button>
                      )}
                      {assignment.status === 'accepted' && (
                        <button 
                          className="action-btn approve-btn"
                          onClick={() => handleUpdateAssignment(assignment._id, 'in_progress', '')}
                        >
                          <i className="fas fa-play"></i>
                          Start
                        </button>
                      )}
                      {assignment.status === 'in_progress' && (
                        <button 
                          className="action-btn approve-btn"
                          onClick={() => handleUpdateAssignment(assignment._id, 'completed', '')}
                        >
                          <i className="fas fa-check-circle"></i>
                          Complete
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
          <div className="maintenance-section">
            <div className="section-header">
              <h2>
                <i className="fas fa-wrench"></i>
                Maintenance Tasks
              </h2>
              <p>Handle property maintenance requests</p>
            </div>

            <div className="admin-properties">
              {maintenance.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <i className="fas fa-wrench"></i>
                  </div>
                  <h3>No maintenance tasks</h3>
                  <p>You don't have any maintenance tasks assigned yet.</p>
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
                      <p className="maintenance-description">{request.description}</p>
                      <div className="property-status">
                        <span className={`${request.status}-badge`}>
                          <i className="fas fa-circle"></i>
                          {request.status}
                        </span>
                      </div>
                    </div>
                    <div className="admin-actions">
                      {request.status === 'pending' && (
                        <button 
                          className="action-btn approve-btn"
                          onClick={() => handleUpdateMaintenance(request._id, 'in_progress', 'Started working on this task')}
                        >
                          <i className="fas fa-play"></i>
                          Start
                        </button>
                      )}
                      {request.status === 'in_progress' && (
                        <button 
                          className="action-btn approve-btn"
                          onClick={() => handleUpdateMaintenance(request._id, 'completed', 'Task completed successfully')}
                        >
                          <i className="fas fa-check-circle"></i>
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Property Details Modal */}
      {selectedProperty && (
        <div className="property-details-modal" onClick={(e) => {
          // Close the modal when clicking outside the content
          if (e.target.className === 'property-details-modal') {
            closePropertyDetailsModal();
          }
        }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <i className="fas fa-building"></i>
                Property Details
              </h3>
              <button className="close-btn" onClick={closePropertyDetailsModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              {propertyDetailsLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading property details...</p>
                </div>
              ) : propertyDetails ? (
                <div className="property-full-details">
                  {/* Property Images Carousel */}
                  <div className="property-images-carousel">
                    {propertyDetails.images && propertyDetails.images.length > 0 ? (
                      <>
                        <img 
                          src={getImageUrl(propertyDetails.images[0])}
                          alt={propertyDetails.title} 
                          className="property-full-image"
                          onError={(e) => {
                            console.log("Modal image failed to load:", e.target.src);
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/800x600/3498db/ffffff?text=Image+Not+Available";
                          }}
                        />
                        {/* Thumbnail gallery if multiple images */}
                        {propertyDetails.images.length > 1 && (
                          <div className="image-thumbnails">
                            {propertyDetails.images.map((image, index) => (
                              <img 
                                key={index}
                                src={getImageUrl(image)}
                                alt={`${propertyDetails.title} - Image ${index + 1}`}
                                className="image-thumbnail"
                                onClick={() => {
                                  // If we wanted to implement image navigation
                                  console.log("Thumbnail clicked:", index);
                                }}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://via.placeholder.com/100x100/3498db/ffffff?text=NA";
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="no-image-placeholder">
                        <i className="fas fa-home"></i>
                        <p>No images available</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Property Information */}
                  <div className="property-info-section">
                    <h2 className="property-title">{propertyDetails.title}</h2>
                    <div className="property-price">₹{propertyDetails.pricePerMonth}/month</div>
                    
                    <div className="property-address">
                      <i className="fas fa-map-marker-alt"></i> {propertyDetails.address}
                    </div>
                    
                    <div className="property-features-grid">
                      <div className="feature">
                        <i className="fas fa-bed"></i>
                        <span className="feature-label">Rooms:</span>
                        <span className="feature-value">{propertyDetails.rooms}</span>
                      </div>
                      
                      <div className="feature">
                        <i className="fas fa-ruler-combined"></i>
                        <span className="feature-label">Area:</span>
                        <span className="feature-value">{propertyDetails.totalAreaSqFt} sq ft</span>
                      </div>
                      
                      <div className="feature">
                        <i className="fas fa-compass"></i>
                        <span className="feature-label">Facing:</span>
                        <span className="feature-value">{propertyDetails.facing}</span>
                      </div>
                      
                      <div className="feature">
                        <i className="fas fa-building"></i>
                        <span className="feature-label">Type:</span>
                        <span className="feature-value">{propertyDetails.propertyType}</span>
                      </div>
                    </div>
                    
                    <div className="property-description">
                      <h4>Description</h4>
                      <p>{propertyDetails.description}</p>
                    </div>
                    
                    {/* Amenities */}
                    {propertyDetails.amenities && propertyDetails.amenities.length > 0 && (
                      <div className="property-amenities">
                        <h4>Amenities</h4>
                        <div className="amenities-list">
                          {propertyDetails.amenities.map((amenity, index) => (
                            <span key={index} className="amenity">
                              <i className="fas fa-check-circle"></i> {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="error-message">
                  <i className="fas fa-exclamation-triangle"></i>
                  <p>Failed to load property details</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="close-modal-btn" onClick={closePropertyDetailsModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
