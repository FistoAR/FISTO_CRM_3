import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { clearUser } from "../redux/slices/userslice";
import { Mail, Award, LogOut, Shield, ShieldCheck, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Profile = ({ onclose }) => {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get user data from Redux store
  const userData = useSelector((state) => state.user);

  useEffect(() => {
    setMounted(true);
  }, []);

  const closeProfile = () => {
    onclose();
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      // Clear Redux state
      dispatch(clearUser());
      
      // Clear localStorage/sessionStorage
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      
      setTimeout(() => {
        setIsLoading(false);
        closeProfile();
        navigate("/");
      }, 1500);
    } catch (error) {
      setIsLoading(false);
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-black from-blue-500 via-purple-500 to-pink-500 relative overflow-hidden text-gray-700 fixed top-0 left-0 z-50">
      <div className="absolute inset-0 bg-black from-blue-400 via-purple-500 to-pink-500">
        <div className="absolute inset-0 bg-black from-cyan-400 via-blue-500 to-purple-600 opacity-80"></div>
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-[0.5vw] h-[0.5vw] bg-white bg-opacity-20 rounded-full transition-all duration-[6000ms] ${
                mounted ? "animate-pulse" : ""
              }`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            ></div>
          ))}
        </div>
      </div>

      <button
        onClick={closeProfile}
        className="absolute z-10 top-[1vw] right-[1vw] p-[0.4vw] bg-white/20 rounded-full hover:bg-white/40 transition cursor-pointer"
      >
        <X className="w-[1.5vw] h-[1.5vw] text-white" />
      </button>

      <div className="relative z-10 w-full max-w-[35%] h-[90%]">
        <div
          className={`transition-all duration-1000 w-full h-full flex items-center ${
            mounted
              ? "transform translate-y-0 opacity-100"
              : "transform translate-y-8 opacity-0"
          }`}
        >
          <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl shadow-2xl w-full h-full overflow-hidden flex flex-col">
            {/* Header with Profile Picture */}
            <div className="h-[15%] w-full bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 relative flex flex-col items-center justify-center">
              <div className="relative w-[6vw] h-[6vw] mx-auto">
                <div className="w-[7vw] h-[7vw] absolute left-1/2 -translate-x-1/2 bottom-[-2.5vw] shadow-2xl rounded-full ">
                  {userData.profile ? (
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL1}${userData.profile}`}
                      alt={userData.employeeName}
                      className="w-full h-full absolute rounded-full object-cover border-4 border-white border-opacity-80"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : null}
                  <div
                    className="absolute inset-0 bg-blue-500 text-white rounded-full flex items-center justify-center font-medium text-[2.5vw] border-4 border-white border-opacity-80"
                    style={{ display: userData.profile ? "none" : "flex" }}
                  >
                    {userData.employeeName?.[0]?.toUpperCase() || "?"}
                  </div>
                </div>
              </div>
            </div>

            {/* Name */}
            <h1 className="text-[1.8vw] font-semibold text-gray-700 text-center mt-[3vw]">
              {userData.employeeName || "Guest User"}
            </h1>
            <p className="text-[0.9vw] text-gray-500 text-center">
              @{userData.userName || "username"}
            </p>

            {/* User Details */}
            <div className="flex-1 p-[2vw] space-y-[1.2vw] overflow-y-auto">
              {/* Email */}
              <div className="flex items-center space-x-[0.8vw] p-[0.8vw] bg-gray-50 bg-opacity-60 rounded-lg border border-gray-200 border-opacity-40">
                <div className="flex items-center justify-center w-[2vw] h-[2vw] bg-blue-100 rounded-full">
                  <Mail className="text-blue-600" size="1vw" />
                </div>
                <div className="flex-1">
                  <p className="text-[0.7vw] text-gray-500 font-medium mb-[0.1vw]">
                    Email
                  </p>
                  <p className="text-[0.8vw] text-gray-800 font-semibold break-all">
                    {userData.emailOfficial || "No email provided"}
                  </p>
                </div>
              </div>

              {/* Designation */}
              <div className="flex items-center space-x-[0.8vw] p-[0.8vw] bg-gray-50 bg-opacity-60 rounded-lg border border-gray-200 border-opacity-40">
                <div className="flex items-center justify-center w-[2vw] h-[2vw] bg-orange-100 rounded-full">
                  <Award className="text-orange-600" size="1vw" />
                </div>
                <div className="flex-1">
                  <p className="text-[0.7vw] text-gray-500 font-medium mb-[0.1vw]">
                    Designation
                  </p>
                  <p className="text-[0.8vw] text-gray-800 font-semibold">
                    {userData.designation || "Not assigned"}
                  </p>
                </div>
              </div>

              {/* Team Head Status */}
              <div className="flex items-center space-x-[0.8vw] p-[0.8vw] bg-gray-50 bg-opacity-60 rounded-lg border border-gray-200 border-opacity-40">
                <div className={`flex items-center justify-center w-[2vw] h-[2vw] rounded-full ${
                  userData.teamHead ? "bg-green-100" : "bg-gray-100"
                }`}>
                  {userData.teamHead ? (
                    <ShieldCheck className="text-green-600" size="1vw" />
                  ) : (
                    <Shield className="text-gray-600" size="1vw" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-[0.7vw] text-gray-500 font-medium mb-[0.1vw]">
                    Team Head
                  </p>
                  <p className={`text-[0.8vw] font-semibold ${
                    userData.teamHead ? "text-green-600" : "text-gray-600"
                  }`}>
                    {userData.teamHead ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <div className="p-[1.5vw] pt-[0.8vw] border-t border-gray-200 border-opacity-50">
              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-[0.6vw] px-[0.8vw] rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center text-[0.9vw]"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-[1vw] h-[1vw] border-2 border-white border-t-transparent rounded-full animate-spin mr-[0.4vw]"></div>
                    Logging out...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <LogOut size="1vw" className="mr-[0.4vw]" />
                    Logout
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
