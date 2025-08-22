import React, { useState } from "react";
import properties from "./data";
import "./App.css";

function App() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <h1 className="logo">🏠 RentEasy</h1>
        <div className="nav-links">
          <a href="#">Login</a>
          <a href="#">Register</a>
          <a href="#">Admin</a>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <h2>Find Your Perfect Rental Home</h2>
        <p>Browse apartments, studios, and villas across India</p>
        <input
          type="text"
          placeholder="Search by city or type..."
          className="search-bar"
        />
      </header>

      {/* Property Listings */}
      <div className="property-grid">
        {properties.map((property) => (
          <div
            key={property.id}
            className="card"
            onClick={() => setSelected(property)}
          >
            <img src={property.image} alt={property.title} />
            <div className="card-content">
              <h3>{property.title}</h3>
              <p className="location">{property.location}</p>
              <p className="price">{property.price}</p>
              <button className="rent-btn">View Details</button>
            </div>
          </div>
        ))}
      </div>

      {/* Property Details Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelected(null)}>
              ✖
            </button>
            <img
              src={selected.image}
              alt={selected.title}
              className="modal-img"
            />
            <h2>{selected.title}</h2>
            <p>{selected.location}</p>
            <p className="price">{selected.price}</p>
            <button className="contact-btn">Contact Owner</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
