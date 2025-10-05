import React, { useState } from 'react';

const TermsAndConditions = ({ onAccept, onReject }) => {
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  
  const handleScroll = (e) => {
    const element = e.target;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 5;
    
    if (isAtBottom && !isScrolledToBottom) {
      setIsScrolledToBottom(true);
    }
  };
  
  return (
    <div className="terms-and-conditions">
      <h3>Property Rental Terms and Conditions</h3>
      
      <div className="terms-content" onScroll={handleScroll}>
        <div className="terms-notice">
          <i className="fas fa-info-circle"></i>
          <p>Please read the following terms and conditions carefully before accepting.</p>
        </div>
        
        <section>
          <h4>1. Booking and Payment</h4>
          <ol className="terms-list">
            <li>
              <strong>Booking Confirmation:</strong> A booking is confirmed only after the advance 
              payment (25% of the total rent) is received and acknowledged.
            </li>
            <li>
              <strong>Payment Schedule:</strong> The remaining amount must be paid before or at the time 
              of check-in as agreed in the rental agreement.
            </li>
            <li>
              <strong>Cancellation Policy:</strong>
              <ul>
                <li>Cancellation 30+ days before check-in: Full refund of advance payment</li>
                <li>Cancellation 15-29 days before check-in: 50% refund of advance payment</li>
                <li>Cancellation less than 15 days before check-in: No refund</li>
              </ul>
            </li>
          </ol>
        </section>
        
        <section>
          <h4>2. Check-in and Check-out</h4>
          <ol className="terms-list">
            <li>
              <strong>Check-in Time:</strong> Standard check-in time is 2:00 PM. Early check-in may be 
              available upon request but cannot be guaranteed.
            </li>
            <li>
              <strong>Check-out Time:</strong> Standard check-out time is 11:00 AM. Late check-out may 
              incur additional charges.
            </li>
            <li>
              <strong>ID Verification:</strong> All guests must present valid government-issued photo 
              identification at check-in.
            </li>
          </ol>
        </section>
        
        <section>
          <h4>3. Property Use and Care</h4>
          <ol className="terms-list">
            <li>
              <strong>Maximum Occupancy:</strong> The number of guests must not exceed the maximum 
              occupancy stated in the property listing.
            </li>
            <li>
              <strong>Property Condition:</strong> Guests agree to maintain the property in the same 
              condition as when they arrived.
            </li>
            <li>
              <strong>Damages:</strong> Any damages beyond normal wear and tear will be charged to the 
              guest's account.
            </li>
            <li>
              <strong>Prohibited Activities:</strong> Parties, events, or commercial activities are not 
              permitted without prior written approval.
            </li>
          </ol>
        </section>
        
        <section>
          <h4>4. Maintenance and Issues</h4>
          <ol className="terms-list">
            <li>
              <strong>Reporting Issues:</strong> Guests should report any issues with the property 
              within 24 hours of check-in.
            </li>
            <li>
              <strong>Maintenance Access:</strong> Property owners or their representatives may enter 
              the property for emergency maintenance with reasonable notice.
            </li>
            <li>
              <strong>Support Requests:</strong> For emergency situations, support is available 24/7 
              through our emergency contact line.
            </li>
          </ol>
        </section>
        
        <section>
          <h4>5. Liability and Insurance</h4>
          <ol className="terms-list">
            <li>
              <strong>Personal Property:</strong> The property owner and management are not responsible 
              for the loss or damage of personal belongings.
            </li>
            <li>
              <strong>Guest Liability:</strong> Guests are responsible for securing the property and 
              following all safety guidelines during their stay.
            </li>
          </ol>
        </section>
        
        <section>
          <h4>6. Termination</h4>
          <ol className="terms-list">
            <li>
              <strong>Violation of Terms:</strong> Violation of any of these terms may result in immediate 
              termination of the rental agreement without refund.
            </li>
          </ol>
        </section>
      </div>
      
      <div className="terms-actions">
        <div className="scroll-notice">
          {!isScrolledToBottom && (
            <p><i className="fas fa-arrow-down"></i> Please scroll down to read all terms</p>
          )}
        </div>
        
        <div className="action-buttons">
          <button 
            onClick={onAccept} 
            disabled={!isScrolledToBottom}
            className={`accept-btn ${isScrolledToBottom ? 'enabled' : 'disabled'}`}
          >
            <i className="fas fa-check-circle"></i>
            I Accept the Terms & Conditions
          </button>
          
          <button onClick={onReject} className="reject-btn">
            <i className="fas fa-times-circle"></i>
            I Do Not Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;