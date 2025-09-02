import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PropertiesAPI } from "../api";

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
  const [files, setFiles] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Personal info fields
  const [ownerName, setOwnerName] = useState("");
  const [ownerContact, setOwnerContact] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMsg('Please login first to register a property.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  }, [navigate]);

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
      
      // Add personal info
      formData.append("ownerName", ownerName);
      formData.append("ownerContact", ownerContact);
      formData.append("ownerEmail", ownerEmail);

      files.forEach((file) => {
        formData.append("images", file);
      });

      // Pass the token to the API call
      await PropertiesAPI.create(formData, token);
      setMsg("Property registered successfully! Waiting for admin approval.");
      
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
      setOwnerName("");
      setOwnerContact("");
      setOwnerEmail("");
      
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
    </div>
  );
};

export default RegisterProperty;
