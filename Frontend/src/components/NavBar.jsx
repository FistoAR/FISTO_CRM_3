import { useState, useEffect, useRef } from "react";
import NotificationIcon from "../assets/NavIcons/Notification.svg";
import AddEmployee from "../assets/NavIcons/addEmployee.webp";
import RegisterPage from "../components/EmployeeManagement/ManagementLayout";
import ProfilePage from "../components/Profile";
import Attendance from "../components/Attendance";

export default function NavBar({ type }) {
  const [user, setUser] = useState(null);
  const [openRegister, setOpenRegister] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [openAttendance, setOpenAttendance] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const notificationRef = useRef(null);
  const unreadCount = 1;

  const storedUser =
    localStorage.getItem("user") || sessionStorage.getItem("user");

  useEffect(() => {
    const storedUserData =
      sessionStorage.getItem("user") || localStorage.getItem("user");
    if (storedUserData) {
      setUser(JSON.parse(storedUserData));
    }
  }, []);

  const userRole = user?.role || "";

  const handleRegister = () => setOpenRegister((prev) => !prev);
  const handleProfile = () => setOpenProfile((prev) => !prev);
  const handleNotifications = () => setOpenNotifications((prev) => !prev);
  const handleAttendance = () => setOpenAttendance((prev) => !prev);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setOpenNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (openRegister) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm py-6 px-2">
        <div className="rounded-xl w-[85%] h-[95%] shadow-xl flex flex-col items-center bg-[#e9effc] relative overflow-hidden">
          <RegisterPage onclose={handleRegister} />
        </div>
      </div>
    );
  }

  if (openProfile) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm py-6 px-2">
        <div className="rounded-xl w-[40vw] h-[95%] shadow-xl flex flex-col items-center bg-[#e9effc] relative overflow-hidden">
          <ProfilePage onclose={handleProfile} />
        </div>
      </div>
    );
  }

  if (openAttendance) {
    return (
      <div className="fixed inset-0 z-50">
        <Attendance onClose={handleAttendance} />
      </div>
    );
  }

  return (
    <>
      <div className={`sticky top-0 py-[0.3vw] z-48 min-h-[6vh] max-h-[6vh]`}>
        <div className="flex justify-between items-start">
          <div className="text-[1vw] ml-[0.3vw] font-semibold text-gray-700">{type}</div>
          <div className={`flex gap-[0.8vw] items-center`}>
            <div className="flex items-center space-x-3 bg-white border border-gray-300 rounded-full px-[0.4vw] py-[0.33vw] hover:shadow-md hover:border-gray-400 transition-all duration-200">
              
              <div
                title="Mark Attendance"
                className="w-[1.7vw] h-[1.7vw] cursor-pointer hover:scale-110 transition-transform duration-200 rounded-full bg-sky-100 flex items-center justify-center text-[1vw] font-bold"
                onClick={handleAttendance}
              >
                🕐
              </div>

              <div className="relative" ref={notificationRef} title="Notification">
                <img
                  src={NotificationIcon}
                  alt="Notification"
                  className="w-[1.7vw] h-[1.7vw] rounded-full cursor-pointer hover:scale-110 transition-transform duration-200"
                  title="Notifications"
                  onClick={handleNotifications}
                />
                {unreadCount > 0 && (
                  <span className="absolute -top-[0.4vw] -right-[0.4vw] flex items-center justify-center h-[1.2vw] min-w-[1.2vw] px-[0.2vw] bg-red-500 text-white text-[0.65vw] font-bold rounded-full leading-none pointer-events-none">
                    {unreadCount}
                  </span>
                )}
              </div>

              {/* {userRole !== "Employee" && (
                <img
                  src={AddEmployee}
                  title="Add Employee"
                  alt="Add Employee"
                  className="w-[1.7vw] h-[1.7vw] cursor-pointer border border-gray-500 hover:scale-110 transition-transform duration-200 rounded-full p-[0.3vw]"
                  onClick={handleRegister}
                />
              )} */}

              {(() => {
                const user = storedUser ? JSON.parse(storedUser) : null;
                const hasProfile = user?.profile;
                return (
                  <div
                    className="relative w-[1.7vw] h-[1.7vw] cursor-pointer hover:scale-110 transition-transform duration-200"
                    title="Profile"
                  >
                    {hasProfile && (
                      <img
                        src={import.meta.env.VITE_API_BASE_URL1 + user.profile}
                        alt={user.employeeName}
                        className="w-full h-full rounded-full object-cover shadow-sm"
                        onClick={() => handleProfile()}
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.classList.remove("hidden");
                        }}
                      />
                    )}
                    <div
                      className={`absolute inset-0 bg-gray-800 text-white rounded-full flex items-center justify-center font-medium text-[0.9vw] ${
                        hasProfile ? "hidden" : ""
                      }`}
                      onClick={() => handleProfile()}
                    >
                      {user?.employeeName?.[0]?.toUpperCase() || "?"}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
