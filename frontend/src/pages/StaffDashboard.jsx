import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MaintenanceAPI, StaffAPI, StaffReportAPI } from "../api";

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

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || userData.role !== 'staff') {
      navigate('/login');
      return;
    }

    setUser(userData);
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [assignmentsRes, maintenanceRes] = await Promise.all([
        StaffAPI.getAssignments(user?.id, token),
        MaintenanceAPI.getStaffAssignments({}, token)
      ]);
      setAssignments(assignmentsRes);
      setMaintenance(maintenanceRes);

      // Fetch tenant details for each assignment's property
      const tenantMap = {};
      for (const assignment of assignmentsRes) {
        try {
          const res = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/api/properties/${assignment.property._id}/bookings`);
          if (res.ok) {
            const bookings = await res.json();
            // Find the latest confirmed booking
            const confirmed = bookings.find(b => b.status === 'confirmed');
            if (confirmed) tenantMap[assignment._id] = confirmed;
          }
        } catch {}
      }
      setTenantDetails(tenantMap);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
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
                  <div key={assignment._id} className="admin-property-card">
                    <div className="property-details">
                      <h4>{assignment.property.title}</h4>
                      <div className="property-meta">
                        <div className="meta-item">
                          <i className="fas fa-map-marker-alt"></i>
                          <span>{assignment.property.address}</span>
                        </div>
                        <div className="meta-item">
                          <i className="fas fa-tag"></i>
                          <span>{assignment.assignmentType}</span>
                        </div>
                        <div className="meta-item">
                          <i className="fas fa-calendar"></i>
                          <span>Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}</span>
                        </div>
                      </div>
                      {assignment.description && (
                        <p className="assignment-description">{assignment.description}</p>
                      )}
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
    </div>
  );
};

export default StaffDashboard;
