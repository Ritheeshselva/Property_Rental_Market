# React Concepts Used in the Project

## 1. Functional Components

- **Files**: Most components in `frontend/src/components/` and `frontend/src/pages/` are functional components.
- **Concept**:
  - Functional components are JavaScript functions that return JSX.
  - They are used to define reusable UI elements.
  - Example: `Navbar.jsx`, `Footer.jsx`, `PropertyDetails.jsx`.

---

## 2. JSX (JavaScript XML)

- **Files**: All `.jsx` files in the `src/` folder.
- **Concept**:
  - JSX is a syntax extension for JavaScript that allows you to write HTML-like code inside JavaScript.
  - It makes it easier to define the structure of React components.
  - Example:
    ```jsx
    <div className="navbar">
      <h1>Property Rental Market</h1>
    </div>
    ```

---

## 3. React Router

- **Files**: `App.jsx`, `frontend/src/pages/`
- **Concept**:
  - React Router is used for client-side routing.
  - It allows navigation between different pages without reloading the browser.
  - Example:
    - `App.jsx` sets up routes for pages like `Home`, `Login`, `AdminDashboard`, etc.
    - Dynamic routing is used for pages like `PropertyDetails` (e.g., `/property/:id`).

---

## 4. State Management

- **Files**: `AuthContext.jsx`, individual components
- **Concept**:
  - React's `useState` hook is used to manage local state within components.
  - Example:
    ```jsx
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    ```

---

## 5. Context API

- **Files**: `AuthContext.jsx`
- **Concept**:
  - The Context API is used to manage global state, such as authentication status, across the app.
  - It avoids "prop drilling" by providing a way to pass data through the component tree without manually passing props.
  - Example:
    - `AuthContext` provides the `user` and `token` to all components that need it.

---

## 6. Props

- **Files**: All components in `components/` and `pages/`
- **Concept**:
  - Props are used to pass data from parent components to child components.
  - Example:
    ```jsx
    <Navbar title="Home" />
    ```

---

## 7. Hooks

- **Files**: `AuthContext.jsx`, `components/`, `pages/`
- **Concept**:
  - React hooks are used to manage state and lifecycle methods in functional components.
  - Common hooks used:
    - **`useState`**: For managing local state.
    - **`useEffect`**: For side effects like fetching data or subscribing to events.
    - **`useContext`**: For accessing context values.
  - Example:
    ```jsx
    useEffect(() => {
      fetchData();
    }, []);
    ```

---

## 8. Event Handling

- **Files**: `SupportRequestForm.jsx`, `PaymentForm.jsx`, etc.
- **Concept**:
  - React uses synthetic events to handle user interactions.
  - Example:
    ```jsx
    const handleSubmit = (e) => {
      e.preventDefault();
      console.log("Form submitted");
    };
    ```

---

## 9. Conditional Rendering

- **Files**: `AuthContext.jsx`, `Navbar.jsx`, `AdminDashboard.jsx`
- **Concept**:
  - Conditional rendering is used to display different UI elements based on the state or props.
  - Example:
    ```jsx
    {
      isLoggedIn ? <Dashboard /> : <Login />;
    }
    ```

---

## 10. Forms and Controlled Components

- **Files**: `PaymentForm.jsx`, `SupportRequestForm.jsx`
- **Concept**:
  - Controlled components are used to manage form inputs with React state.
  - Example:
    ```jsx
    const [email, setEmail] = useState("");
    const handleChange = (e) => setEmail(e.target.value);
    ```

---

## 11. API Integration

- **Files**: `api.js`, `pages/`
- **Concept**:
  - Axios is used to make HTTP requests to the backend.
  - Example:
    ```jsx
    const fetchProperties = async () => {
      const response = await axios.get("/api/properties");
      setProperties(response.data);
    };
    ```

---

## 12. CSS Modules

- **Files**: `BookingProcess.css`, `TermsVisibility.css`
- **Concept**:
  - CSS modules are used to scope styles locally to components.
  - Example:
    ```css
    .booking-container {
      background-color: #f5f5f5;
    }
    ```

---

## 13. Component Lifecycle

- **Files**: `AuthContext.jsx`, `pages/`
- **Concept**:
  - React's `useEffect` hook is used to mimic lifecycle methods like `componentDidMount` and `componentWillUnmount`.
  - Example:
    ```jsx
    useEffect(() => {
      console.log("Component mounted");
      return () => console.log("Component unmounted");
    }, []);
    ```

---

## 14. Error Handling

- **Files**: `api.js`, `pages/`
- **Concept**:
  - Errors from API calls are caught and handled gracefully.
  - Example:
    ```jsx
    try {
      const response = await axios.get("/api/properties");
    } catch (error) {
      console.error("Error fetching properties", error);
    }
    ```

---

## 15. Static Assets

- **Files**: `public/`, `images/`
- **Concept**:
  - Static assets like images and icons are served from the `public/` folder.
  - Example:
    ```jsx
    <img src="/images/logo.png" alt="Logo" />
    ```

---

## 16. Responsive Design

- **Files**: CSS files in `components/` and `pages/`
- **Concept**:
  - CSS is used to ensure the app is responsive and works on different screen sizes.
