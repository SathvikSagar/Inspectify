import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardCard from "../components/DashboardCard";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [serverStatus, setServerStatus] = useState("Running");
  const [activeUsers, setActiveUsers] = useState(120);
  const [securityAlerts, setSecurityAlerts] = useState(2);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
      <p className="text-gray-600 mb-6">Manage system health and security</p>
      <div className="grid grid-cols-3 gap-6">
        <DashboardCard title="Server Status" value={serverStatus} status="Healthy" color="blue" />
        <DashboardCard title="Active Users" value={activeUsers} status="Online" color="green" />
        <DashboardCard title="Security Alerts" value={securityAlerts} status="Check Logs" color="red" />
      </div>
    </div>
  );
};
export default AdminDashboard;