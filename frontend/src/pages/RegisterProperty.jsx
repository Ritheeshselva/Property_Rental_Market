import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PropertiesAPI, SubscriptionAPI } from "../api";

const RegisterProperty = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [pricePerMonth, setPricePerMonth] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [totalAreaSqFt, setTotalAreaSqFt] = useState("");
  const [facing, setFacing] = useState("");
  const [rooms, setRooms] = useState("");
  const [description, setDescription] = useState("");
  // Location fields
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [area, setArea] = useState("");
  const [pincode, setPincode] = useState("");
  const [files, setFiles] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Personal info fields
  const [ownerName, setOwnerName] = useState("");
  const [ownerContact, setOwnerContact] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");

  // Subscription fields
  const [selectedPlan, setSelectedPlan] = useState('basic');
  const [plans, setPlans] = useState({});
  const [includeSubscription, setIncludeSubscription] = useState(false);

  // Check authentication and load subscription plans on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMsg('Please login first to register a property.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      loadSubscriptionPlans();
    }
  }, [navigate]);

  const loadSubscriptionPlans = async () => {
    try {
      const plansData = await SubscriptionAPI.getPlans();
      setPlans(plansData);
    } catch (error) {
      console.error('Error loading subscription plans:', error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files).slice(0, 5);
    setFiles(selectedFiles);
  };

  const removeImage = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      // Check if user is still authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        setMsg('Please login first to register a property.');
        setLoading(false);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }

      const formData = new FormData();
      formData.append("title", title);
      formData.append("address", address);
      formData.append("pricePerMonth", pricePerMonth);
      formData.append("advanceAmount", advanceAmount);
      formData.append("totalAreaSqFt", totalAreaSqFt);
      formData.append("facing", facing);
      formData.append("rooms", rooms);
      formData.append("description", description);
      
      // Location information
      formData.append("city", city);
      formData.append("state", state);
      formData.append("area", area);
      formData.append("pincode", pincode);
      
      // Add personal info
      formData.append("ownerName", ownerName);
      formData.append("ownerContact", ownerContact);
      formData.append("ownerEmail", ownerEmail);

      files.forEach((file) => {
        formData.append("images", file);
      });

      // Pass the token to the API call
      const propertyResponse = await PropertiesAPI.create(formData, token);
      
      // If subscription is selected, create subscription for the property
      if (includeSubscription && propertyResponse._id) {
        try {
          const subscriptionData = {
            propertyId: propertyResponse._id,
            planType: selectedPlan,
            paymentMethod: 'card',
            transactionId: `txn_${Date.now()}`
          };
          await SubscriptionAPI.create(subscriptionData, token);
          setMsg("Property registered successfully with subscription! Waiting for admin approval.");
        } catch (subscriptionError) {
          setMsg("Property registered successfully but subscription failed. You can add subscription later from your dashboard.");
        }
      } else {
        setMsg("Property registered successfully! Waiting for admin approval.");
      }
      
      // Reset form
      setTitle("");
      setAddress("");
      setPricePerMonth("");
      setAdvanceAmount("");
      setTotalAreaSqFt("");
      setFacing("");
      setRooms("");
      setDescription("");
      setFiles([]);
      // Reset location fields
      setCity("");
      setState("");
      setArea("");
      setPincode("");
      setOwnerName("");
      setOwnerContact("");
      setOwnerEmail("");
      setSelectedPlan('basic');
      setIncludeSubscription(false);
      
    } catch (e) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Don't render the form if user is not authenticated
  const token = localStorage.getItem('token');
  if (!token) {
    return (
      <div className="page-container">
        <div className="error">
          <i className="fas fa-exclamation-triangle"></i>
          Please login first to register a property. Redirecting to login page...
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2>
        <i className="fas fa-plus-circle"></i> Register New Property
      </h2>
      
      <form className="form" onSubmit={onSubmit}>
        {/* Personal Information Section */}
        <div className="form-section">
          <h3>Personal Information</h3>
          <div className="input-group">
            <label htmlFor="ownerName">
              <i className="fas fa-user"></i> Full Name
            </label>
            <input
              id="ownerName"
              type="text"
              placeholder="Enter your full name"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="ownerContact">
              <i className="fas fa-phone"></i> Contact Number
            </label>
            <input
              id="ownerContact"
              type="tel"
              placeholder="Enter your contact number"
              value={ownerContact}
              onChange={(e) => setOwnerContact(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="ownerEmail">
              <i className="fas fa-envelope"></i> Email Address
            </label>
            <input
              id="ownerEmail"
              type="email"
              placeholder="Enter your email address"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Property Information Section */}
        <div className="form-section">
          <h3>Property Information</h3>
          <div className="input-group">
            <label htmlFor="title">
              <i className="fas fa-home"></i> Property Title
            </label>
            <input
              id="title"
              type="text"
              placeholder="Enter property title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="address">
              <i className="fas fa-map-marker-alt"></i> Address
            </label>
            <input
              id="address"
              type="text"
              placeholder="Enter property address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
          
          {/* Location Information */}
          <div className="location-fields">
            <h4>Location Details</h4>
            <div className="input-group">
              <label htmlFor="area">
                <i className="fas fa-map"></i> Area/Locality
              </label>
              <input
                id="area"
                type="text"
                placeholder="Enter area or locality"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                required
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="city">
                <i className="fas fa-city"></i> City
              </label>
              <input
                id="city"
                type="text"
                placeholder="Enter city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="state">
                <i className="fas fa-map-marked-alt"></i> State
              </label>
              <input
                id="state"
                type="text"
                placeholder="Enter state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="pincode">
                <i className="fas fa-map-pin"></i> Pincode
              </label>
              <input
                id="pincode"
                type="text"
                placeholder="Enter pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="pricePerMonth">
              <i className="fas fa-money-bill-wave"></i> Monthly Rent
            </label>
            <input
              id="pricePerMonth"
              type="number"
              placeholder="Enter monthly rent amount"
              value={pricePerMonth}
              onChange={(e) => setPricePerMonth(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="advanceAmount">
              <i className="fas fa-money-bill-wave"></i> Advance Payment
            </label>
            <input
              id="advanceAmount"
              type="number"
              placeholder="Enter advance payment amount"
              value={advanceAmount}
              onChange={(e) => setAdvanceAmount(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="totalAreaSqFt">
              <i className="fas fa-ruler-combined"></i> Total Area (sq ft)
            </label>
            <input
              id="totalAreaSqFt"
              type="number"
              placeholder="Enter total area in square feet"
              value={totalAreaSqFt}
              onChange={(e) => setTotalAreaSqFt(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="facing">
              <i className="fas fa-compass"></i> Facing
            </label>
            <select
              id="facing"
              value={facing}
              onChange={(e) => setFacing(e.target.value)}
              required
            >
              <option value="">Select facing direction</option>
              <option value="North">North</option>
              <option value="South">South</option>
              <option value="East">East</option>
              <option value="West">West</option>
              <option value="North-East">North-East</option>
              <option value="North-West">North-West</option>
              <option value="South-East">South-East</option>
              <option value="South-West">South-West</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="rooms">
              <i className="fas fa-bed"></i> Number of Rooms
            </label>
            <input
              id="rooms"
              type="number"
              placeholder="Enter number of rooms"
              value={rooms}
              onChange={(e) => setRooms(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="description">
              <i className="fas fa-align-left"></i> Description
            </label>
            <textarea
              id="description"
              placeholder="Enter property description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="4"
            />
          </div>
        </div>

        {/* Image Upload Section */}
        <div className="form-section">
          <h3>Property Images</h3>
          <div className="image-upload-section">
            <label className="image-upload-label">
              <i className="fas fa-images"></i> Property Images (Max 5 images)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="file-input"
            />
            {files.length > 0 && (
              <div className="image-preview-container">
                <p className="image-count">
                  Selected {files.length}/5 images:
                </p>
                <div className="image-preview-grid">
                  {files.map((file, index) => (
                    <div key={index} className="image-preview-item">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="image-preview"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="remove-image-btn"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Subscription Section */}
        <div className="form-section">
          <h3>Subscription Plan (Optional)</h3>
          <div className="subscription-option">
            <label className="subscription-checkbox">
              <input
                type="checkbox"
                checked={includeSubscription}
                onChange={(e) => setIncludeSubscription(e.target.checked)}
              />
              <span className="checkmark"></span>
              Include subscription plan to unlock premium features
            </label>
          </div>

          {includeSubscription && (
            <div className="subscription-plans">
              <p className="subscription-description">
                Choose a subscription plan to unlock premium features for your property
              </p>
              <div className="plans-grid">
                {Object.entries(plans).map(([planKey, plan]) => (
                  <div 
                    key={planKey}
                    className={`plan-card ${selectedPlan === planKey ? 'selected' : ''}`}
                    onClick={() => setSelectedPlan(planKey)}
                  >
                    <div className="plan-header">
                      <h4>{plan.name}</h4>
                      <div className="plan-price">
                        <span className="price-amount">₹{plan.price}</span>
                        <span className="price-period">/month</span>
                      </div>
                    </div>
                    <div className="plan-features">
                      <ul>
                        {plan.features.map((feature, index) => (
                          <li key={index}>
                            <i className="fas fa-check"></i>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="plan-limits">
                      <p><strong>Property Limit:</strong> {plan.limits.properties === -1 ? 'Unlimited' : plan.limits.properties}</p>
                      <p><strong>Staff Assignments:</strong> {plan.limits.staffAssignments === -1 ? 'Unlimited' : plan.limits.staffAssignments}</p>
                      <p><strong>Maintenance Tracking:</strong> {plan.limits.maintenanceTracking ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading}>
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Registering Property...
            </>
          ) : (
            <>
              <i className="fas fa-plus-circle"></i>
              Register Property
            </>
          )}
        </button>
      </form>

      {msg && (
        <div className={msg.includes("successfully") ? "success" : "error"}>
          {msg}
        </div>
      )}

      <style jsx>{`
        .subscription-option {
          margin-bottom: 1.5rem;
        }

        .subscription-checkbox {
          display: flex;
          align-items: center;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
          color: #333;
        }

        .subscription-checkbox input[type="checkbox"] {
          margin-right: 0.75rem;
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .subscription-description {
          margin: 1rem 0;
          color: #666;
          font-style: italic;
        }

        .subscription-plans {
          margin-top: 1.5rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .plan-card {
          border: 2px solid #e9ecef;
          border-radius: 12px;
          padding: 1.25rem;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .plan-card:hover {
          border-color: #007bff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
        }

        .plan-card.selected {
          border-color: #007bff;
          background: #f8f9ff;
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.2);
        }

        .plan-header {
          text-align: center;
          margin-bottom: 1rem;
        }

        .plan-header h4 {
          margin: 0 0 0.5rem 0;
          color: #333;
          font-size: 1.25rem;
        }

        .plan-price {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 0.25rem;
        }

        .price-amount {
          font-size: 1.5rem;
          font-weight: bold;
          color: #007bff;
        }

        .price-period {
          color: #666;
          font-size: 0.9rem;
        }

        .plan-features ul {
          list-style: none;
          padding: 0;
          margin: 0 0 1rem 0;
        }

        .plan-features li {
          padding: 0.4rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .plan-features i {
          color: #28a745;
          width: 14px;
          font-size: 0.8rem;
        }

        .plan-limits {
          background: #f8f9fa;
          padding: 0.75rem;
          border-radius: 6px;
          font-size: 0.85rem;
        }

        .plan-limits p {
          margin: 0.2rem 0;
          color: #666;
        }

        @media (max-width: 768px) {
          .plans-grid {
            grid-template-columns: 1fr;
          }
          
          .plan-card {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default RegisterProperty;
