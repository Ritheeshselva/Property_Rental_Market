import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MaintenanceAPI, PropertiesAPI } from "../api";

const MaintenanceRequest = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get('property');
  
  const [formData, setFormData] = useState({
    propertyId: propertyId || '',
    type: '',
    priority: 'medium',
    title: '',
    description: '',
    scheduledDate: '',
    estimatedCost: '',
    location: ''
  });
  
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadUserProperties();
  }, []);

  const loadUserProperties = async () => {
    try {
      const token = localStorage.getItem('token');
      const allProperties = await PropertiesAPI.listApproved();
      
      // Filter properties owned by current user
      const userProperties = allProperties.filter(prop => 
        prop.owner && prop.owner._id === JSON.parse(localStorage.getItem('user') || '{}').id
      );
      
      setProperties(userProperties);
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const maintenanceData = {
        ...formData,
        estimatedCost: formData.estimatedCost ? Number(formData.estimatedCost) : undefined,
        scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate).toISOString() : undefined
      };

      await MaintenanceAPI.create(maintenanceData, token);
      setMessage('Maintenance request created successfully!');
      
      setTimeout(() => {
        navigate('/owner-dashboard');
      }, 2000);
    } catch (error) {
      setMessage(error.message || 'Failed to create maintenance request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="form">
        <h2>
          <i className="fas fa-tools"></i>
          Create Maintenance Request
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Property Information</h3>
            <div className="input-group">
              <label htmlFor="propertyId">
                <i className="fas fa-building"></i> Select Property
              </label>
              <select
                id="propertyId"
                name="propertyId"
                value={formData.propertyId}
                onChange={handleInputChange}
                required
              >
                <option value="">Choose a property</option>
                {properties.map(property => (
                  <option key={property._id} value={property._id}>
                    {property.title} - {property.address}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-section">
            <h3>Maintenance Details</h3>
            <div className="input-group">
              <label htmlFor="type">
                <i className="fas fa-wrench"></i> Maintenance Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
              >
                <option value="">Select maintenance type</option>
                <option value="inspection">Inspection</option>
                <option value="repair">Repair</option>
                <option value="cleaning">Cleaning</option>
                <option value="renovation">Renovation</option>
                <option value="emergency">Emergency</option>
                <option value="routine">Routine</option>
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="priority">
                <i className="fas fa-exclamation-triangle"></i> Priority Level
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="title">
                <i className="fas fa-heading"></i> Request Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="Brief title for the maintenance request"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="description">
                <i className="fas fa-align-left"></i> Description
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="Detailed description of the maintenance needed"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="location">
                <i className="fas fa-map-marker-alt"></i> Specific Location
              </label>
              <input
                id="location"
                name="location"
                type="text"
                placeholder="e.g., Kitchen, Living Room, Bathroom, etc."
                value={formData.location}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Additional Information</h3>
            <div className="input-group">
              <label htmlFor="scheduledDate">
                <i className="fas fa-calendar"></i> Preferred Date
              </label>
              <input
                id="scheduledDate"
                name="scheduledDate"
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={handleInputChange}
              />
            </div>

            <div className="input-group">
              <label htmlFor="estimatedCost">
                <i className="fas fa-dollar-sign"></i> Estimated Cost (₹)
              </label>
              <input
                id="estimatedCost"
                name="estimatedCost"
                type="number"
                placeholder="Enter estimated cost if known"
                value={formData.estimatedCost}
                onChange={handleInputChange}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="cta-btn secondary"
              onClick={() => navigate('/owner-dashboard')}
            >
              <i className="fas fa-arrow-left"></i>
              Cancel
            </button>
            <button 
              type="submit"
              className="cta-btn primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Creating Request...
                </>
              ) : (
                <>
                  <i className="fas fa-tools"></i>
                  Create Request
                </>
              )}
            </button>
          </div>
        </form>

        {message && (
          <div className={message.includes('successfully') ? 'success' : 'error'}>
            {message}
          </div>
        )}
      </div>

      <style jsx>{`
        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 2rem;
        }

        .form-section {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .form-section h3 {
          margin: 0 0 1rem 0;
          color: #333;
          font-size: 1.2rem;
          border-bottom: 2px solid #007bff;
          padding-bottom: 0.5rem;
        }

        .input-group {
          margin-bottom: 1rem;
        }

        .input-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #333;
        }

        .input-group label i {
          color: #007bff;
          margin-right: 0.5rem;
          width: 16px;
        }

        .input-group input,
        .input-group select,
        .input-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .input-group input:focus,
        .input-group select:focus,
        .input-group textarea:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }

        .input-group textarea {
          resize: vertical;
          min-height: 100px;
        }
      `}</style>
    </div>
  );
};

export default MaintenanceRequest;
