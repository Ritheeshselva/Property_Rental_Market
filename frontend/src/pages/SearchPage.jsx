import { useState, useEffect } from "react";
import { SearchAPI } from "../api";

const SearchPage = () => {
  const [searchParams, setSearchParams] = useState({
    location: '',
    minPrice: '',
    maxPrice: '',
    propertyType: '',
    rooms: '',
    amenities: [],
    facing: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadFilters();
    performSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFilters = async () => {
    try {
      const filtersData = await SearchAPI.getFilters();
      setFilters(filtersData);
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };

  const performSearch = async (page = 1) => {
    setLoading(true);
    try {
      console.log('Searching with params:', { ...searchParams, page, limit: 12 });
      const searchData = await SearchAPI.searchProperties({
        ...searchParams,
        page,
        limit: 12
      });
      
      console.log('Search results:', searchData);
      setProperties(searchData.properties || []);
      setPagination(searchData.pagination || {});
    } catch (error) {
      console.error('Error searching properties:', error);
      setProperties([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAmenityChange = (amenity) => {
    setSearchParams(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch();
  };

  const handleLocationInput = async (e) => {
    const value = e.target.value;
    setSearchParams(prev => ({ ...prev, location: value }));
    
    if (value.length >= 2) {
      try {
        const suggestionsData = await SearchAPI.getSuggestions(value);
        setSuggestions(suggestionsData.suggestions || []);
      } catch (error) {
        console.error('Error getting suggestions:', error);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchParams(prev => ({ ...prev, location: suggestion.value }));
    setSuggestions([]);
  };

  const clearFilters = () => {
    setSearchParams({
      location: '',
      minPrice: '',
      maxPrice: '',
      propertyType: '',
      rooms: '',
      amenities: [],
      facing: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  return (
    <div className="page-container">
      <div className="search-header">
        <h1>
          <i className="fas fa-search"></i>
          Find Your Perfect Property
        </h1>
        <p>Search through thousands of properties to find your ideal home</p>
      </div>

      <div className="search-container">
        {/* Search Form */}
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-row">
            <div className="search-field location-field">
              <label>
                <i className="fas fa-map-marker-alt"></i>
                Location
              </label>
              <div className="suggestion-container">
                <input
                  type="text"
                  placeholder="Enter city, area, or landmark"
                  value={searchParams.location}
                  onChange={handleLocationInput}
                />
                {suggestions.length > 0 && (
                  <div className="suggestions-dropdown">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="suggestion-item"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <i className="fas fa-map-marker-alt"></i>
                        {suggestion.value}
                        <span className="suggestion-count">({suggestion.count} properties)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="search-field">
              <label>
                <i className="fas fa-home"></i>
                Property Type
              </label>
              <select
                name="propertyType"
                value={searchParams.propertyType}
                onChange={handleInputChange}
              >
                <option value="">Any Type</option>
                {filters.propertyTypes?.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="search-field">
              <label>
                <i className="fas fa-bed"></i>
                Rooms
              </label>
              <select
                name="rooms"
                value={searchParams.rooms}
                onChange={handleInputChange}
              >
                <option value="">Any</option>
                {Array.from({ length: filters.roomRange?.max || 5 }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>
                    {num}+ rooms
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="search-btn">
              <i className="fas fa-search"></i>
              Search
            </button>
          </div>

          <div className="search-actions">
            <button
              type="button"
              className="filter-toggle"
              onClick={() => setShowFilters(!showFilters)}
            >
              <i className="fas fa-filter"></i>
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
            <button
              type="button"
              className="clear-filters"
              onClick={clearFilters}
            >
              <i className="fas fa-times"></i>
              Clear All
            </button>
          </div>
        </form>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="advanced-filters">
            <h3>Advanced Filters</h3>
            <div className="filters-grid">
              <div className="filter-group">
                <label>Price Range (₹)</label>
                <div className="price-range">
                  <input
                    type="number"
                    placeholder="Min"
                    name="minPrice"
                    value={searchParams.minPrice}
                    onChange={handleInputChange}
                  />
                  <span>to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    name="maxPrice"
                    value={searchParams.maxPrice}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="filter-group">
                <label>Facing</label>
                <select
                  name="facing"
                  value={searchParams.facing}
                  onChange={handleInputChange}
                >
                  <option value="">Any Direction</option>
                  {filters.facings?.map(facing => (
                    <option key={facing} value={facing}>{facing}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Sort By</label>
                <select
                  name="sortBy"
                  value={searchParams.sortBy}
                  onChange={handleInputChange}
                >
                  <option value="createdAt">Newest First</option>
                  <option value="pricePerMonth">Price: Low to High</option>
                  <option value="-pricePerMonth">Price: High to Low</option>
                  <option value="title">Name: A to Z</option>
                </select>
              </div>
            </div>

            <div className="amenities-filter">
              <label>Amenities</label>
              <div className="amenities-grid">
                {filters.amenities?.map(amenity => (
                  <label key={amenity} className="amenity-checkbox">
                    <input
                      type="checkbox"
                      checked={searchParams.amenities.includes(amenity)}
                      onChange={() => handleAmenityChange(amenity)}
                    />
                    <span>{amenity}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="search-results">
          <div className="results-header">
            <h2>
              {loading ? 'Searching...' : `${pagination.totalCount || 0} Properties Found`}
            </h2>
            <div className="results-actions">
              <button
                className="view-toggle active"
                onClick={() => {/* Toggle to grid view */}}
              >
                <i className="fas fa-th"></i>
              </button>
              <button
                className="view-toggle"
                onClick={() => {/* Toggle to list view */}}
              >
                <i className="fas fa-list"></i>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Searching properties...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="fas fa-home"></i>
              </div>
              <h3>No Properties Found</h3>
              <p>Try adjusting your search criteria or filters</p>
            </div>
          ) : (
            <>
              <div className="properties-grid">
                {properties.map(property => (
                  <div key={property._id} className="property-card">
                    <div className="property-image">
                      <img 
                        src={property.images?.[0]?.startsWith('http') 
                          ? property.images[0] 
                          : `${process.env.REACT_APP_API_BASE}${property.images?.[0] || '/placeholder-property.jpg'}`} 
                        alt={property.title}
                      />
                      {property.hasSubscription && (
                        <div className="property-badge premium">
                          <i className="fas fa-crown"></i>
                          Premium
                        </div>
                      )}
                    </div>
                    <div className="property-content">
                      <h3 className="property-title">{property.title}</h3>
                      <div className="property-price">
                        <span className="price-amount">₹{property.pricePerMonth}</span>
                        <span className="price-period">/month</span>
                      </div>
                      <div className="property-location">
                        <i className="fas fa-map-marker-alt"></i>
                        {property.address}
                      </div>
                      <div className="property-features">
                        <div className="feature">
                          <i className="fas fa-bed"></i>
                          <span>{property.rooms} rooms</span>
                        </div>
                        <div className="feature">
                          <i className="fas fa-ruler-combined"></i>
                          <span>{property.totalAreaSqFt} sq ft</span>
                        </div>
                        <div className="feature">
                          <i className="fas fa-compass"></i>
                          <span>{property.facing}</span>
                        </div>
                      </div>
                      <button 
                        className="rent-btn"
                        onClick={() => window.location.href = `/property/${property._id}`}
                      >
                        <i className="fas fa-eye"></i>
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    disabled={!pagination.hasPrev}
                    onClick={() => performSearch(pagination.currentPage - 1)}
                  >
                    <i className="fas fa-chevron-left"></i>
                    Previous
                  </button>
                  
                  <div className="pagination-info">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </div>
                  
                  <button
                    className="pagination-btn"
                    disabled={!pagination.hasNext}
                    onClick={() => performSearch(pagination.currentPage + 1)}
                  >
                    Next
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .search-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .search-header h1 {
          color: #333;
          margin-bottom: 0.5rem;
        }

        .search-header p {
          color: #666;
          font-size: 1.1rem;
        }

        .search-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .search-form {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          margin-bottom: 2rem;
        }

        .search-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr auto;
          gap: 1rem;
          align-items: end;
        }

        .search-field {
          display: flex;
          flex-direction: column;
        }

        .search-field label {
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: #333;
        }

        .search-field label i {
          color: #007bff;
          margin-right: 0.5rem;
        }

        .search-field input,
        .search-field select {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
        }

        .search-field input:focus,
        .search-field select:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }

        .suggestion-container {
          position: relative;
        }

        .suggestions-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ddd;
          border-top: none;
          border-radius: 0 0 6px 6px;
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000;
        }

        .suggestion-item {
          padding: 0.75rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-bottom: 1px solid #f0f0f0;
        }

        .suggestion-item:hover {
          background: #f8f9fa;
        }

        .suggestion-item i {
          color: #007bff;
        }

        .suggestion-count {
          margin-left: auto;
          color: #666;
          font-size: 0.9rem;
        }

        .search-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          height: fit-content;
        }

        .search-btn:hover {
          background: #0056b3;
        }

        .search-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
          justify-content: center;
        }

        .filter-toggle,
        .clear-filters {
          background: #6c757d;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .filter-toggle:hover,
        .clear-filters:hover {
          background: #545b62;
        }

        .advanced-filters {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 2rem;
        }

        .advanced-filters h3 {
          margin: 0 0 1rem 0;
          color: #333;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
        }

        .filter-group label {
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: #333;
        }

        .price-range {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .price-range input {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .amenities-filter {
          margin-top: 1rem;
        }

        .amenities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .amenity-checkbox {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .amenity-checkbox input {
          margin: 0;
        }

        .search-results {
          margin-top: 2rem;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .results-header h2 {
          margin: 0;
          color: #333;
        }

        .results-actions {
          display: flex;
          gap: 0.5rem;
        }

        .view-toggle {
          background: #f8f9fa;
          border: 1px solid #ddd;
          padding: 0.5rem;
          border-radius: 4px;
          cursor: pointer;
        }

        .view-toggle.active {
          background: #007bff;
          color: white;
        }

        .properties-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
        }

        .pagination-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .pagination-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .pagination-info {
          color: #666;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .search-row {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .search-actions {
            flex-direction: column;
          }

          .filters-grid {
            grid-template-columns: 1fr;
          }

          .amenities-grid {
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          }
        }
      `}</style>
    </div>
  );
};

export default SearchPage;
