<<<<<<< HEAD
import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
=======
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import properties from "./data";
import PropertyDetails from "./PropertyDetails";
import Login from "./Login";
import Register from "./Register";
import Admin from "./Admin";
import "./App.css";

function App() {
  return (
    <Router>
      {/* Navbar */}
      <nav className="navbar">
        <h1 className="logo">🏠 RentEasy</h1>
        <div className="nav-links">
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
          <Link to="/admin">Admin</Link>
        </div>
      </nav>

      <Routes>
        {/* Home Page */}
        <Route
          path="/"
          element={
            <div>
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
                  <Link
                    to={`/property/${property.id}`}
                    key={property.id}
                    className="card"
                  >
                    <img src={property.image} alt={property.title} />
                    <div className="card-content">
                      <h3>{property.title}</h3>
                      <p className="location">{property.location}</p>
                      <p className="price">{property.price}</p>
                      <button className="rent-btn">View Details</button>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          }
        />

        {/* Property Details Page */}
        <Route path="/property/:id" element={<PropertyDetails />} />

        {/* Extra Pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
       <footer className="footer">
              <p>Made  for Property Rentals</p>
              </footer>
    </Router>

   
>>>>>>> e8e238b4a92abbabddd93f0d2143f75833f734c0
  );
}

export default App;
