import React, { useState } from 'react';

const SupportRequestForm = ({ propertyId, bookingId, onSubmit, onCancel }) => {
  const [issueType, setIssueType] = useState('maintenance');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [contactPreference, setContactPreference] = useState('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!description.trim()) {
      setError('Please provide a description of your issue');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    const supportRequest = {
      propertyId,
      bookingId,
      issueType,
      priority,
      description: description.trim(),
      contactPreference,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    onSubmit(supportRequest);
  };

  return (
    <div className="support-request-form">
      <h3>Submit Support Request</h3>
      
      <p className="form-info">
        Please provide details about your issue and we'll respond as quickly as possible.
      </p>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label><i className="fas fa-tag"></i> Issue Type</label>
          <select 
            value={issueType} 
            onChange={(e) => setIssueType(e.target.value)}
          >
            <option value="maintenance">Maintenance Issue</option>
            <option value="payment">Payment Problem</option>
            <option value="booking">Booking Question</option>
            <option value="emergency">Emergency</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div className="form-group">
          <label><i className="fas fa-exclamation-circle"></i> Priority</label>
          <div className="priority-selector">
            <label className={`priority-option ${priority === 'low' ? 'selected' : ''}`}>
              <input 
                type="radio" 
                name="priority" 
                value="low" 
                checked={priority === 'low'}
                onChange={() => setPriority('low')} 
              />
              <span className="priority-icon low"><i className="fas fa-arrow-down"></i></span>
              <span>Low</span>
            </label>
            
            <label className={`priority-option ${priority === 'medium' ? 'selected' : ''}`}>
              <input 
                type="radio" 
                name="priority" 
                value="medium" 
                checked={priority === 'medium'}
                onChange={() => setPriority('medium')} 
              />
              <span className="priority-icon medium"><i className="fas fa-minus"></i></span>
              <span>Medium</span>
            </label>
            
            <label className={`priority-option ${priority === 'high' ? 'selected' : ''}`}>
              <input 
                type="radio" 
                name="priority" 
                value="high" 
                checked={priority === 'high'}
                onChange={() => setPriority('high')} 
              />
              <span className="priority-icon high"><i className="fas fa-arrow-up"></i></span>
              <span>High</span>
            </label>
            
            <label className={`priority-option ${priority === 'emergency' ? 'selected' : ''}`}>
              <input 
                type="radio" 
                name="priority" 
                value="emergency" 
                checked={priority === 'emergency'}
                onChange={() => setPriority('emergency')} 
              />
              <span className="priority-icon emergency"><i className="fas fa-exclamation"></i></span>
              <span>Emergency</span>
            </label>
          </div>
        </div>
        
        <div className="form-group">
          <label><i className="fas fa-comment-alt"></i> Description</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="5"
            placeholder="Please describe your issue in detail"
          ></textarea>
        </div>
        
        <div className="form-group">
          <label><i className="fas fa-phone-alt"></i> Preferred Contact Method</label>
          <select 
            value={contactPreference} 
            onChange={(e) => setContactPreference(e.target.value)}
          >
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="sms">SMS</option>
          </select>
        </div>
        
        {priority === 'emergency' && (
          <div className="emergency-notice">
            <i className="fas fa-bell"></i>
            <p>
              <strong>Emergency Notice:</strong> For true emergencies requiring immediate assistance (fire, flood, security breach), 
              please also call our 24/7 emergency hotline at <strong>1-800-PROPERTY</strong> after submitting this form.
            </p>
          </div>
        )}
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-btn" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Submitting...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane"></i>
                Submit Request
              </>
            )}
          </button>
          
          <button 
            type="button" 
            className="cancel-btn" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <i className="fas fa-times"></i>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default SupportRequestForm;