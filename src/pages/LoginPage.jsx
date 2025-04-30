import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer"; // ✅ Import Footer
import Get from "../components/Get";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Clear previous errors

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("user", JSON.stringify({ email })); // Store user data
        // alert("Login Successful!");
        navigate("/user"); // Redirect to User page
      } else {
        setErrorMessage(data.error || "Invalid credentials. Please try again.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      setErrorMessage("Server error. Try again!");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="bg-white shadow-lg rounded-2xl flex w-full max-w-5xl overflow-hidden">
          
          {/* Left: Login Form */}
          <div className="w-full md:w-1/2 p-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
            <p className="text-gray-600 mb-6">Login to continue to Inspectify</p>

            {/* Email & Password Form */}
            <form className="space-y-5" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {/* Display error messages */}
              {errorMessage && (
                <p className="text-sm text-red-600">{errorMessage}</p>
              )}

              <button
                type="submit"
 
              >
                <Get>Login </Get>
              </button>
            </form>

            <p className="text-sm text-gray-500 mt-6">
  Don’t have an account?{" "}
  <span
    className="text-indigo-600 cursor-pointer hover:underline"
    onClick={() => navigate("/signup")} // ✅ Navigate to SignupPage
  >
    Sign Up
  </span>
</p>

          </div>

          {/* Right: Login Illustration */}
          <div className="hidden md:flex w-1/2 bg-indigo-100 items-center justify-center p-6">
            <img
              src="/lag.svg" // ✅ Ensure this file is in public/ or use import if in src/
              alt="Login Illustration"
              className="w-3/4 h-auto"
            />
          </div>
        </div>
      </div>
      <Footer /> {/* ✅ Footer included properly */}
    </div>
  );
};

export default LoginPage;
