import React, { useState } from 'react';

const PaymentForm = ({ advanceAmount, onPaymentComplete, onCancel }) => {
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [transactionId, setTransactionId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // This is a simulated payment - in a real app this would connect to a payment gateway
  const processPayment = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Validate form
    if (paymentMethod === 'credit_card' && (!cardNumber || !cardName || !expiryDate || !cvv)) {
      setError('Please fill out all credit card details');
      setIsLoading(false);
      return;
    }
    
    if (paymentMethod === 'bank_transfer' && !transactionId) {
      setError('Please enter your transaction ID');
      setIsLoading(false);
      return;
    }
    
    // Simulate payment processing with a timeout
    setTimeout(() => {
      // Generate a fake transaction ID if using credit card
      const generatedTransactionId = paymentMethod === 'credit_card' 
        ? `CC-${Date.now().toString().substring(8)}`
        : transactionId;
        
      setIsLoading(false);
      onPaymentComplete({
        paymentMethod,
        paymentTransactionId: generatedTransactionId
      });
    }, 2000);
  };
  
  return (
    <div className="payment-form">
      <h3>Complete Advance Payment</h3>
      <div className="payment-amount">
        <div className="amount-badge">
          <i className="fas fa-money-bill-wave"></i>
          <span>₹{advanceAmount}</span>
        </div>
        <p>Please complete the advance payment to confirm your booking.</p>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={processPayment}>
        <div className="payment-methods">
          <div className="payment-method-selector">
            <label>
              <input
                type="radio"
                name="paymentMethod"
                value="credit_card"
                checked={paymentMethod === 'credit_card'}
                onChange={() => setPaymentMethod('credit_card')}
              />
              <i className="fas fa-credit-card"></i>
              Credit/Debit Card
            </label>
            
            <label>
              <input
                type="radio"
                name="paymentMethod"
                value="bank_transfer"
                checked={paymentMethod === 'bank_transfer'}
                onChange={() => setPaymentMethod('bank_transfer')}
              />
              <i className="fas fa-university"></i>
              Bank Transfer
            </label>
            
            <label>
              <input
                type="radio"
                name="paymentMethod"
                value="upi"
                checked={paymentMethod === 'upi'}
                onChange={() => setPaymentMethod('upi')}
              />
              <i className="fas fa-mobile-alt"></i>
              UPI Payment
            </label>
          </div>
        </div>
        
        {paymentMethod === 'credit_card' && (
          <div className="credit-card-details">
            <div className="input-group">
              <label><i className="fas fa-credit-card"></i> Card Number</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="1234 5678 9012 3456"
                maxLength="19"
              />
            </div>
            
            <div className="input-group">
              <label><i className="fas fa-user"></i> Name on Card</label>
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            
            <div className="form-row">
              <div className="input-group">
                <label><i className="fas fa-calendar"></i> Expiry Date</label>
                <input
                  type="text"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  placeholder="MM/YY"
                  maxLength="5"
                />
              </div>
              
              <div className="input-group">
                <label><i className="fas fa-lock"></i> CVV</label>
                <input
                  type="text"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  placeholder="123"
                  maxLength="4"
                />
              </div>
            </div>
          </div>
        )}
        
        {paymentMethod === 'bank_transfer' && (
          <div className="bank-transfer-details">
            <div className="bank-info">
              <h4>Bank Account Details</h4>
              <p><strong>Account Name:</strong> Property Rental Services</p>
              <p><strong>Account Number:</strong> 1234567890</p>
              <p><strong>IFSC Code:</strong> PROP0001234</p>
              <p><strong>Bank:</strong> Property National Bank</p>
            </div>
            
            <div className="input-group">
              <label><i className="fas fa-receipt"></i> Enter Transaction ID</label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter your transaction reference"
              />
            </div>
          </div>
        )}
        
        {paymentMethod === 'upi' && (
          <div className="upi-details">
            <div className="upi-info">
              <h4>UPI Payment Details</h4>
              <div className="qr-code">
                <i className="fas fa-qrcode fa-5x"></i>
                <p>Scan QR Code to Pay</p>
              </div>
              <p><strong>UPI ID:</strong> property@upi</p>
            </div>
            
            <div className="input-group">
              <label><i className="fas fa-receipt"></i> Enter UPI Transaction ID</label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter your UPI reference number"
              />
            </div>
          </div>
        )}
        
        <div className="payment-actions">
          <button type="submit" className="action-btn" disabled={isLoading}>
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Processing Payment...
              </>
            ) : (
              <>
                <i className="fas fa-check-circle"></i>
                Complete Payment
              </>
            )}
          </button>
          
          <button type="button" className="reject-btn" onClick={onCancel} disabled={isLoading}>
            <i className="fas fa-times-circle"></i>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;