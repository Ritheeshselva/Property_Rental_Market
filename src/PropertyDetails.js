import React from "react";
import { useParams, Link } from "react-router-dom";
import properties from "./data";
import "./App.css";

function PropertyDetails() {
  const { id } = useParams();
  const property = properties.find((p) => p.id === parseInt(id));

  if (!property) return <h2>Property not found</h2>;

  return (
    <div className="details-container">
      <Link to="/" className="back-btn">⬅ Back</Link>

      <img src={property.image} alt={property.title} className="details-img" />
      <h2>{property.title}</h2>
      <p className="price">{property.price}</p>
      <p><strong>Location:</strong> {property.location}</p>
      <p><strong>Facing:</strong> {property.facing}</p>
      <p><strong>Size:</strong> {property.sqft}</p>
      <p><strong>Nearby:</strong> {property.nearby}</p>

      <div className="owner-info">
        <h3>Owner Details</h3>
        <p><strong>Name:</strong> {property.owner.name}</p>
        <p><strong>Contact:</strong> {property.owner.contact}</p>
      </div>
    </div>
  );
}

export default PropertyDetails;
