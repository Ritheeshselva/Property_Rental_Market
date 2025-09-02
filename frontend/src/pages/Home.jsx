import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PropertiesAPI } from "../api";

const Home = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    PropertiesAPI.listApproved()
      .then((data) => mounted && setProperties(data))
      .catch((e) => mounted && setError(e.message))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="loading">Loading properties...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Find Your Perfect Rental Home
          </h1>
          <p className="hero-subtitle">
            Discover amazing properties in prime locations with competitive prices
          </p>
          <div className="hero-actions">
            <Link to="/" className="hero-btn primary">
              <i className="fas fa-search"></i>
              Browse Properties
            </Link>
            <Link to="/register-property" className="hero-btn secondary">
              <i className="fas fa-plus"></i>
              List Your Property
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-image-placeholder">
            <i className="fas fa-home"></i>
          </div>
        </div>
      </section>

      {/* Properties Section */}
      <section className="properties-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured Properties</h2>
            <p className="section-subtitle">
              Discover our latest approved properties available for rent
            </p>
          </div>
          
          {properties.length > 0 ? (
            <div className="properties-grid">
              {properties.map((p) => (
                <Link key={p._id} to={`/property/${p._id}`} className="property-card">
                  <div className="property-image">
                    <img 
                      src={p.images && p.images[0] ? p.images[0] : "https://via.placeholder.com/400x250/3498db/ffffff?text=No+Image"} 
                      alt={p.title} 
                    />
                    <div className="property-badge approved">
                      <i className="fas fa-check-circle"></i> Verified
                    </div>
                  </div>
                  
                  <div className="property-content">
                    <h3 className="property-title">{p.title}</h3>
                    <div className="property-price">
                      <span className="price-amount">₹{p.pricePerMonth}</span>
                      <span className="price-period">/month</span>
                    </div>
                    
                    <div className="property-location">
                      <i className="fas fa-map-marker-alt"></i>
                      <span>{p.address}</span>
                    </div>
                    
                    <div className="property-features">
                      <span className="feature">
                        <i className="fas fa-bed"></i> {p.rooms} rooms
                      </span>
                      <span className="feature">
                        <i className="fas fa-ruler-combined"></i> {p.totalAreaSqFt} sq ft
                      </span>
                      <span className="feature">
                        <i className="fas fa-compass"></i> {p.facing}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-properties">
              <div className="empty-icon">
                <i className="fas fa-home"></i>
              </div>
              <h3>No properties available yet</h3>
              <p>Check back later for amazing rental opportunities</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
