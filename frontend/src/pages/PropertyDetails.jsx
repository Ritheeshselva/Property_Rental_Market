import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PropertiesAPI } from "../api";

const PropertyDetails = () => {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [booking, setBooking] = useState({
    name: localStorage.getItem('userName') || "",
    email: localStorage.getItem('userEmail') || "",
    phone: "",
    startDate: "",
    message: ""
  });

  useEffect(() => {
    PropertiesAPI.get(id)
      .then(setP)
      .catch((e) => setError(e.message));
  }, [id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!p || !p.images || p.images.length <= 1) return;
      
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextImage();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevImage();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [p]);

  const nextImage = () => {
    if (p && p.images && p.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === p.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (p && p.images && p.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? p.images.length - 1 : prev - 1
      );
    }
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  if (error) return <div className="error">Error: {error}</div>;
  if (!p) return <div className="loading">Loading...</div>;

  return (
    <div className="property-details">
      <h2>{p.title}</h2>
      
      {/* Main Image Gallery */}
      {p.images && p.images.length > 0 && (
        <div className="image-gallery">
          <div className="main-image-container">
            <img 
              src={p.images[currentImageIndex]} 
              alt={`${p.title} - Image ${currentImageIndex + 1}`} 
              className="main-image"
            />
            
            {/* Navigation Arrows */}
            {p.images.length > 1 && (
              <>
                <button 
                  className="nav-arrow nav-arrow-left" 
                  onClick={prevImage}
                  aria-label="Previous image"
                  title="Previous image (←)"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button 
                  className="nav-arrow nav-arrow-right" 
                  onClick={nextImage}
                  aria-label="Next image"
                  title="Next image (→)"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </>
            )}
            
            {/* Image Counter */}
            <div className="image-counter">
              {currentImageIndex + 1} / {p.images.length}
            </div>
          </div>
          
          {/* Thumbnail Navigation */}
          {p.images.length > 1 && (
            <div className="thumbnail-container">
              {p.images.map((src, idx) => (
                <div 
                  key={idx} 
                  className={`thumbnail ${idx === currentImageIndex ? 'active' : ''}`}
                  onClick={() => goToImage(idx)}
                  title={`Go to image ${idx + 1}`}
                >
                  <img 
                    src={src} 
                    alt={`Thumbnail ${idx + 1}`} 
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* Navigation Instructions */}
          {p.images.length > 1 && (
            <div className="navigation-hint">
              <i className="fas fa-info-circle"></i>
              
            </div>
          )}
        </div>
      )}

      <div className="property-info">
        <div className="info-item">
          <strong>Address</strong>
          <span><i className="fas fa-map-marker-alt"></i> {p.address}</span>
        </div>
        
        <div className="info-item">
          <strong>Monthly Rent</strong>
          <span><i className="fas fa-money-bill-wave"></i> ₹{p.pricePerMonth}</span>
        </div>
        
        <div className="info-item">
          <strong>Advance Payment</strong>
          <span><i className="fas fa-money-bill-wave"></i> ₹{p.advanceAmount}</span>
        </div>
        
        <div className="info-item">
          <strong>Total Area</strong>
          <span><i className="fas fa-ruler-combined"></i> {p.totalAreaSqFt} sq ft</span>
        </div>
        
        <div className="info-item">
          <strong>Facing</strong>
          <span><i className="fas fa-compass"></i> {p.facing}</span>
        </div>
        
        <div className="info-item">
          <strong>Rooms</strong>
          <span><i className="fas fa-bed"></i> {p.rooms}</span>
        </div>
      </div>

      {p.description && (
        <div className="info-item">
          <strong>Description</strong>
          <span>{p.description}</span>
        </div>
      )}

      <div className="admin-actions" style={{paddingTop: 0}}>
        <button className="action-btn view-btn" onClick={() => setShowBooking(true)}>
          <i className="fas fa-calendar-check"></i>
          <span>Book Property</span>
        </button>
      </div>

      {showBooking && (
        <div className="page-container" style={{maxWidth: 700, marginTop: '1rem'}}>
          <div className="form">
            <h2><i className="fas fa-calendar-check"></i> Booking Request</h2>
            {bookingSuccess && <div className="success">{bookingSuccess}</div>}
            {bookingError && <div className="error">{bookingError}</div>}
            <div className="input-group">
              <label><i className="fas fa-user"></i> Full Name</label>
              <input value={booking.name} onChange={(e)=>setBooking({...booking, name:e.target.value})} placeholder="Your name" />
            </div>
            <div className="input-group">
              <label><i className="fas fa-envelope"></i> Email</label>
              <input type="email" value={booking.email} onChange={(e)=>setBooking({...booking, email:e.target.value})} placeholder="you@example.com" />
            </div>
            <div className="input-group">
              <label><i className="fas fa-phone"></i> Phone</label>
              <input value={booking.phone} onChange={(e)=>setBooking({...booking, phone:e.target.value})} placeholder="Mobile number" />
            </div>
            <div className="input-group">
              <label><i className="fas fa-calendar-day"></i> Preferred Start Date</label>
              <input type="date" value={booking.startDate} onChange={(e)=>setBooking({...booking, startDate:e.target.value})} />
            </div>
            <div className="input-group">
              <label><i className="fas fa-comment"></i> Message (optional)</label>
              <textarea rows={3} value={booking.message} onChange={(e)=>setBooking({...booking, message:e.target.value})} placeholder="Any notes or questions" />
            </div>
            <div style={{display:'flex', gap:'1rem'}}>
              <button onClick={async ()=>{
                setBookingError("");
                setBookingSuccess("");
                setBookingLoading(true);
                try {
                  const token = localStorage.getItem('token');
                  if (!token) throw new Error('Please login to book.');
                  await PropertiesAPI.book(p._id, booking, token);
                  setBookingSuccess('Booking requested successfully! We\'ll contact you soon.');
                } catch (e) {
                  setBookingError(e.message);
                } finally {
                  setBookingLoading(false);
                }
              }} disabled={bookingLoading}>
                <i className="fas fa-paper-plane"></i>
                {bookingLoading ? 'Sending...' : 'Submit Request'}
              </button>
              <button className="reject-btn" onClick={()=>setShowBooking(false)}>
                <i className="fas fa-times"></i>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetails;
