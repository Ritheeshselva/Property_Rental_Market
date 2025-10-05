import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PropertiesAPI } from "../api";
import TermsAndConditions from "../components/TermsAndConditions";
import PaymentForm from "../components/PaymentForm";
import SupportRequestForm from "../components/SupportRequestForm";
import "../components/BookingProcess.css";
import "../components/BookingProcessExtra.css";
import "../components/TermsVisibility.css";

const PropertyDetails = () => {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState("");
  const [bookingError, setBookingError] = useState("");
  
  // Booking flow states
  const [bookingStep, setBookingStep] = useState(1); // 1: Form, 2: Terms, 3: Payment, 4: Success
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState(null);
  
  const [booking, setBooking] = useState({
    name: localStorage.getItem('userName') || "",
    email: localStorage.getItem('userEmail') || "",
    phone: "",
    startDate: "",
    message: "",
    termsAccepted: false
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
          {/* Booking Steps Indicator */}
          <div className="booking-steps">
            <div className="step-item">
              <div className={`step-circle ${bookingStep >= 1 ? 'active' : ''} ${bookingStep > 1 ? 'completed' : ''}`}>
                {bookingStep > 1 ? <i className="fas fa-check"></i> : 1}
              </div>
              <div className={`step-label ${bookingStep >= 1 ? 'active' : ''} ${bookingStep > 1 ? 'completed' : ''}`}>
                Details
              </div>
            </div>
            
            <div className="step-item">
              <div className={`step-circle ${bookingStep >= 2 ? 'active' : ''} ${bookingStep > 2 ? 'completed' : ''}`}>
                {bookingStep > 2 ? <i className="fas fa-check"></i> : 2}
              </div>
              <div className={`step-label ${bookingStep >= 2 ? 'active' : ''} ${bookingStep > 2 ? 'completed' : ''}`}>
                Terms
              </div>
            </div>
            
            <div className="step-item">
              <div className={`step-circle ${bookingStep >= 3 ? 'active' : ''} ${bookingStep > 3 ? 'completed' : ''}`}>
                {bookingStep > 3 ? <i className="fas fa-check"></i> : 3}
              </div>
              <div className={`step-label ${bookingStep >= 3 ? 'active' : ''} ${bookingStep > 3 ? 'completed' : ''}`}>
                Payment
              </div>
            </div>
            
            <div className="step-item">
              <div className={`step-circle ${bookingStep >= 4 ? 'active' : ''}`}>
                4
              </div>
              <div className={`step-label ${bookingStep >= 4 ? 'active' : ''}`}>
                Confirmation
              </div>
            </div>
          </div>
          
          <div className="form">
            {/* Step 1: Booking Form */}
            {bookingStep === 1 && (
              <>
                <h2><i className="fas fa-calendar-check"></i> Booking Request</h2>
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
                  <button 
                    onClick={() => {
                      // Validate form
                      if (!booking.name.trim()) {
                        setBookingError("Please enter your name");
                        return;
                      }
                      if (!booking.email.trim()) {
                        setBookingError("Please enter your email");
                        return;
                      }
                      if (!booking.phone.trim()) {
                        setBookingError("Please enter your phone number");
                        return;
                      }
                      if (!booking.startDate) {
                        setBookingError("Please select a start date");
                        return;
                      }
                      
                      // Proceed to terms & conditions
                      setBookingError("");
                      setBookingStep(2);
                    }}
                  >
                    <i className="fas fa-arrow-right"></i>
                    Continue to Terms & Conditions
                  </button>
                  <button className="reject-btn" onClick={() => setShowBooking(false)}>
                    <i className="fas fa-times"></i>
                    Cancel
                  </button>
                </div>
              </>
            )}
            
            {/* Step 2: Terms & Conditions */}
            {bookingStep === 2 && (
              <TermsAndConditions 
                onAccept={() => {
                  setBooking({...booking, termsAccepted: true});
                  setBookingStep(3);
                }} 
                onReject={() => {
                  setBookingError("You must accept the terms and conditions to proceed.");
                  setBookingStep(1);
                }}
              />
            )}
            
            {/* Step 3: Payment */}
            {bookingStep === 3 && (
              <PaymentForm 
                advanceAmount={p.advanceAmount || 5000}
                onPaymentComplete={async (paymentDetails) => {
                  setBookingError("");
                  setBookingLoading(true);
                  try {
                    const token = localStorage.getItem('token');
                    if (!token) throw new Error('Please login to book.');
                    
                    const bookingData = {
                      ...booking,
                      paymentDetails,
                      termsAccepted: true,
                    };
                    
                    // Show loading state
                    setBookingSuccess('Processing your payment and booking...');
                    
                    // Process the booking
                    const response = await PropertiesAPI.book(p._id, bookingData, token);
                    
                    // Set the booking ID from the response
                    setCurrentBookingId(response.id || response.bookingId);
                    setBookingSuccess('Booking confirmed successfully!');
                    setBookingStep(4);
                  } catch (e) {
                    setBookingError(e.message);
                    setBookingStep(1);
                  } finally {
                    setBookingLoading(false);
                  }
                }}
                onCancel={() => setBookingStep(1)}
              />
            )}
            
            {/* Step 4: Success & Support Options */}
            {bookingStep === 4 && (
              <div className="booking-success">
                <div className="success-header">
                  <i className="fas fa-check-circle"></i>
                  <h3>Booking Confirmed!</h3>
                </div>
                
                <div className="payment-confirmation">
                  <i className="fas fa-shield-check payment-confirmation-icon"></i>
                  <h4>Payment Processed Successfully</h4>
                  <p>Your advance payment has been received.</p>
                  <div className="payment-reference">
                    BOOKING-{currentBookingId?.substring(0, 8).toUpperCase()}
                  </div>
                </div>
                
                <div className="booking-details-summary">
                  <h4>Booking Summary</h4>
                  <div className="booking-details-item">
                    <span className="booking-details-label">Property</span>
                    <span className="booking-details-value">{p.title}</span>
                  </div>
                  <div className="booking-details-item">
                    <span className="booking-details-label">Name</span>
                    <span className="booking-details-value">{booking.name}</span>
                  </div>
                  <div className="booking-details-item">
                    <span className="booking-details-label">Start Date</span>
                    <span className="booking-details-value">{new Date(booking.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="booking-details-item">
                    <span className="booking-details-label">Amount Paid</span>
                    <span className="booking-details-value">₹{p.advanceAmount || 5000} (Advance)</span>
                  </div>
                </div>
                
                {!showSupportForm ? (
                  <div className="support-options">
                    <h4>Need assistance with your booking?</h4>
                    <button 
                      className="support-btn"
                      onClick={() => setShowSupportForm(true)}
                    >
                      <i className="fas fa-headset"></i>
                      Request Support
                    </button>
                    
                    <div className="emergency-contact">
                      <h4>For emergencies:</h4>
                      <p><i className="fas fa-phone-alt"></i> Call our 24/7 helpline: <strong>1-800-PROPERTY</strong></p>
                    </div>
                  </div>
                ) : (
                  <SupportRequestForm 
                    propertyId={p._id}
                    bookingId={currentBookingId}
                    onSubmit={async (supportRequest) => {
                      try {
                        const token = localStorage.getItem('token');
                        if (!token) throw new Error('Please login to submit a support request.');
                        
                        await PropertiesAPI.submitSupportRequest(currentBookingId, supportRequest, token);
                        setBookingSuccess('Support request submitted successfully! Our team will contact you shortly.');
                        setShowSupportForm(false);
                      } catch (e) {
                        setBookingError(e.message);
                      }
                    }}
                    onCancel={() => setShowSupportForm(false)}
                  />
                )}
                
                <div className="booking-actions">
                  <button 
                    className="done-btn"
                    onClick={() => {
                      setShowBooking(false);
                      setBookingStep(1);
                      setShowSupportForm(false);
                    }}
                  >
                    <i className="fas fa-check"></i>
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetails;
