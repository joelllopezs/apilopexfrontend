import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import Services from "./pages/Services";
import Professionals from "./pages/Professionals";
import Clients from "./pages/Clients";
import BusinessHours from "./pages/BusinessHours";
import Company from "./pages/Company";
import RegisterCompany from "./pages/RegisterCompany";
import PublicBooking from "./pages/PublicBooking";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("@lopex:token");

  if (!token) {
    return <Navigate to="/" />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register-company" element={<RegisterCompany />} />
        <Route path="/agendar/:slug" element={<PublicBooking />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
          <PrivateRoute>
            <Admin />
          </PrivateRoute>
            }
          />
        <Route
          path="/services"
          element={
            <PrivateRoute>
              <Services />
            </PrivateRoute>
          }
        />

        <Route
          path="/professionals"
          element={
            <PrivateRoute>
              <Professionals />
            </PrivateRoute>
          }
        />

        <Route
          path="/clients"
          element={
            <PrivateRoute>
              <Clients />
            </PrivateRoute>
          }
        />

        <Route
          path="/business-hours"
          element={
            <PrivateRoute>
              <BusinessHours />
            </PrivateRoute>
          }
        />

        <Route
          path="/appointments"
          element={
            <PrivateRoute>
              <Appointments />
            </PrivateRoute>
          }
        />

        <Route
          path="/company"
          element={
            <PrivateRoute>
              <Company />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}