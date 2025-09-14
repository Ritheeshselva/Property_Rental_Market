import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SubscriptionAPI, PropertiesAPI } from "../api";

const SubscriptionPage = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const [plans, setPlans] = useState({});
  const [selectedPlan, setSelectedPlan] = useState('basic');
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, [propertyId]);

  const loadData = async () => {
    try {
      const [plansRes, propertyRes] = await Promise.all([
        SubscriptionAPI.getPlans(),
        PropertiesAPI.get(propertyId)
      ]);

      setPlans(plansRes);
      setProperty(propertyRes);
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage('Error loading subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      setMessage('Please select a subscription plan');
      return;
    }

    setSubscribing(true);
    setMessage("");

    try {
      const token = localStorage.getItem('token');
      const subscriptionData = {
        propertyId,
        planType: selectedPlan,
        paymentMethod: 'card', // In real app, integrate with payment gateway
        transactionId: `txn_${Date.now()}` // Mock transaction ID
      };

      await SubscriptionAPI.create(subscriptionData, token);
      setMessage('Subscription created successfully!');
      
      setTimeout(() => {
        navigate('/owner-dashboard');
      }, 2000);
    } catch (error) {
      setMessage(error.message || 'Failed to create subscription');
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="form">
        <h2>
          <i className="fas fa-credit-card"></i>
          Subscribe to Property Management
        </h2>
        
        {property && (
          <div className="property-info" style={{ 
            background: '#f8f9fa', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '2rem' 
          }}>
            <h3>{property.title}</h3>
            <p><i className="fas fa-map-marker-alt"></i> {property.address}</p>
            <p><i className="fas fa-dollar-sign"></i> ₹{property.pricePerMonth}/month</p>
          </div>
        )}

        <div className="subscription-plans">
          <h3>Choose Your Plan</h3>
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

        <div className="form-actions">
          <button 
            type="button" 
            className="cta-btn secondary"
            onClick={() => navigate('/owner-dashboard')}
          >
            <i className="fas fa-arrow-left"></i>
            Back to Dashboard
          </button>
          <button 
            type="button"
            className="cta-btn primary"
            onClick={handleSubscribe}
            disabled={subscribing || !selectedPlan}
          >
            {subscribing ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Processing...
              </>
            ) : (
              <>
                <i className="fas fa-credit-card"></i>
                Subscribe Now
              </>
            )}
          </button>
        </div>

        {message && (
          <div className={message.includes('successfully') ? 'success' : 'error'}>
            {message}
          </div>
        )}
      </div>

      <style jsx>{`
        .subscription-plans {
          margin: 2rem 0;
        }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-top: 1rem;
        }

        .plan-card {
          border: 2px solid #e9ecef;
          border-radius: 12px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
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
          margin-bottom: 1.5rem;
        }

        .plan-header h4 {
          margin: 0 0 0.5rem 0;
          color: #333;
          font-size: 1.5rem;
        }

        .plan-price {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 0.25rem;
        }

        .price-amount {
          font-size: 2rem;
          font-weight: bold;
          color: #007bff;
        }

        .price-period {
          color: #666;
          font-size: 1rem;
        }

        .plan-features ul {
          list-style: none;
          padding: 0;
          margin: 0 0 1.5rem 0;
        }

        .plan-features li {
          padding: 0.5rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .plan-features i {
          color: #28a745;
          width: 16px;
        }

        .plan-limits {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          font-size: 0.9rem;
        }

        .plan-limits p {
          margin: 0.25rem 0;
          color: #666;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 2rem;
        }

        .property-info {
          border-left: 4px solid #007bff;
        }

        .property-info h3 {
          margin: 0 0 0.5rem 0;
          color: #333;
        }

        .property-info p {
          margin: 0.25rem 0;
          color: #666;
        }

        .property-info i {
          color: #007bff;
          margin-right: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default SubscriptionPage;
