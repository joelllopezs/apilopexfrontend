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
import CancelAppointment from "./pages/CancelAppointment";
import Subscription from "./pages/Subscription";
import AuditLogs from "./pages/AuditLogs";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("@lopex:token");

  if (!token) {
    return <Navigate to="/" />;
  }

  return children;
}

function RedirectUnknownRoute() {
  const token = localStorage.getItem("@lopex:token");

  if (token) {
    return <Navigate to="/dashboard" />;
  }

  return <Navigate to="/" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register-company" element={<RegisterCompany />} />
        <Route path="/agendar/:slug" element={<PublicBooking />} />
        <Route
          path="/agendar/cancelar/:id/:cancelToken"
          element={<CancelAppointment />}
        />

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
          path="/audit-logs"
          element={
            <PrivateRoute>
              <AuditLogs />
            </PrivateRoute>
          }
        />

        <Route
          path="/subscription"
          element={
            <PrivateRoute>
              <Subscription />
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

        <Route path="*" element={<RedirectUnknownRoute />} />
      </Routes>
    </BrowserRouter>
  );
}