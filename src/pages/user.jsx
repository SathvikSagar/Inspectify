import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Dashboard from "../components/Dashboard";

const User = () => {
  const [username, setUsername] = useState("");

  useEffect(() => {
    // Fetch username from localStorage, API, or context
    const storedUser = localStorage.getItem("username") || "User";
    setUsername(storedUser);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800">Welcome, {username}!</h1>
      </div>
      <Dashboard />
    </div>
  );
};

export default User;
