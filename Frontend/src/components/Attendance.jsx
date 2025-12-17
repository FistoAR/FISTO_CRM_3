import React, { useState, useEffect } from "react";
import { Clock, ChevronDown } from "lucide-react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/attendance`;

// Toast Notification Component
const Notification = ({ title, message, duration = 5000, onClose }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - 100 / (duration / 100);
        return newProgress <= 0 ? 0 : newProgress;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [duration]);

  useEffect(() => {
    if (progress <= 0) onClose?.();
  }, [progress, onClose]);

  const typeStyles = {
    Success: {
      border: "border-green-300 border-[2px]",
      bg: "bg-green-50",
      text: "text-green-800",
      circle: "bg-[#4edd64]",
      icon: "✔",
    },
    Warning: {
      border: "border-yellow-400 border-[2px]",
      bg: "bg-yellow-50",
      text: "text-yellow-800",
      circle: "bg-yellow-500",
      icon: "!",
    },
    Error: {
      border: "border-red-400 border-[2px]",
      bg: "bg-red-50",
      text: "text-red-800",
      circle: "bg-red-500",
      icon: "✖",
    },
    Info: {
      border: "border-blue-400 border-[2px]",
      bg: "bg-blue-50",
      text: "text-blue-800",
      circle: "bg-blue-500",
      icon: "ℹ",
    },
  };

  const styles = typeStyles[title];

  return (
    <div className="fixed top-[0.8vw] right-[0.8vw] z-[9999]">
      <div
        className={`flex items-center gap-[0.5vw] p-[0.8vw] rounded-xl shadow-lg w-[22vw] relative border ${styles?.bg || 'bg-gray-50'} ${styles?.border || 'border-gray-300'} ${styles?.text || 'text-gray-800'}`}
      >
        <div className={`flex items-center justify-center w-[1.8vw] h-[1.8vw] rounded-full ${styles?.circle || 'bg-gray-400'}`}>
          <span className="text-white text-[0.7vw] font-bold">{styles?.icon || "ℹ"}</span>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-black text-[0.85vw]">{title}</p>
          <p className="text-[0.75vw] opacity-90 text-gray-600 whitespace-pre-line">{message}</p>
        </div>
        <button 
          className="text-[0.85vw] font-bold px-[0.4vw] text-gray-600 cursor-pointer hover:text-gray-800 hover:bg-gray-100 rounded-full p-[0.2vw] transition-all" 
          onClick={onClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// Field Component
const Field = ({
  label,
  placeholder,
  type = "text",
  value,
  disabled = false,
}) => {
  const isRequired = label.trim().endsWith("*");
  const labelText = isRequired ? label.trim().slice(0, -1) : label;

  return (
    <div className="flex flex-col">
      <label className={`text-[0.8vw] text-gray-900 font-medium mb-[0.3vw] ${isRequired ? "-mt-[0.4vw]" : ""}`}>
        {labelText}
        {isRequired && <span className="text-red-500 text-[1vw] ml-[0.2vw]">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        className={`border px-[0.6vw] py-[0.4vw] rounded-lg text-[0.8vw] transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 placeholder:text-[0.75vw] ${
          disabled
            ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
            : "border-gray-300 hover:border-gray-400 focus:border-blue-400"
        }`}
      />
    </div>
  );
};

const Attendance = ({ onClose }) => {
  const [currentTime, setCurrentTime] = useState("");
  const [formData, setFormData] = useState({
    userName: "",
    employeeName: "",
    date: new Date().toISOString().split("T")[0],
    loginTime: "",
    attendanceType: "",
    action: "",
  });
  
  const [attendanceStatus, setAttendanceStatus] = useState({
    morning: { in: null, out: null },
    afternoon: { in: null, out: null },
  });
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ HELPER: Get LAST ACTION time (Morning In → Out → Afternoon In → Out)
  const getLastActionTime = () => {
    const actions = [
      attendanceStatus.morning.in,
      attendanceStatus.morning.out,
      attendanceStatus.afternoon.in,
      attendanceStatus.afternoon.out
    ].filter(Boolean);
    
    return actions[actions.length - 1] || currentTime;
  };

  // Real-time clock (12h format)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      const timeString = `${hours}:${minutes}:${seconds} ${ampm}`;
      setCurrentTime(timeString);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load user data from storage
  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem("user") || localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setFormData((prev) => ({
          ...prev,
          userName: user.employee_id || user.userName || "EMP001",
          employeeName: user.name || user.employeeName || "John Doe",
        }));
      }
    } catch (error) {
      console.warn("Could not load user data:", error);
    }
  }, []);

  // Load today's attendance status from backend
  useEffect(() => {
    const loadAttendance = async () => {
      if (!formData.userName) return;
      
      try {
        const response = await fetch(
          `${API_BASE_URL}?employee_id=${formData.userName}&date=${formData.date}`
        );
        
        if (!response.ok) {
          console.warn(`HTTP ${response.status}: ${response.statusText}`);
          return;
        }
        
        const data = await response.json();
        
        if (data.status && data.data) {
          const record = data.data;
          setAttendanceStatus({
            morning: {
              in: record.morning_in ? formatTime(record.morning_in) : null,
              out: record.morning_out ? formatTime(record.morning_out) : null
            },
            afternoon: {
              in: record.afternoon_in ? formatTime(record.afternoon_in) : null,
              out: record.afternoon_out ? formatTime(record.afternoon_out) : null
            }
          });
        }
      } catch (error) {
        if (error.message.includes("Unexpected token '<'")) {
          console.error("API endpoint not found - check backend route mounting");
        } else {
          console.warn("Could not load attendance:", error);
        }
      }
    };
    
    loadAttendance();
  }, [formData.userName, formData.date, API_BASE_URL]);

  // Helper to format MySQL TIME back to 12h format
  const formatTime = (timeStr) => {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    const displayHours = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${displayHours}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')} ${ampm}`;
  };

  // Helper to convert 12h time string to MySQL TIME format
  const parseTimeString = (timeStr) => {
    const [time, ampm] = timeStr.split(' ');
    let [hours, minutes, seconds] = time.split(':').map(Number);
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const showToast = (title, message) => {
    setNotificationData({ title, message });
    setShowNotification(true);
  };

  const getNextAction = () => {
    if (!attendanceStatus.morning.in) return { type: "Morning", action: "In" };
    if (!attendanceStatus.morning.out) return { type: "Morning", action: "Out" };
    if (!attendanceStatus.afternoon.in) return { type: "Afternoon", action: "In" };
    if (!attendanceStatus.afternoon.out) return { type: "Afternoon", action: "Out" };
    return null;
  };

  const nextAction = getNextAction();
  const allComplete = !nextAction;

  const isActionAllowed = (type, action) => {
    const next = getNextAction();
    if (!next) return false;
    return next.type === type && next.action === action;
  };

  const handleTypeChange = (e) => {
    const type = e.target.value;
    if (!type) return;

    if (allComplete) {
      showToast("Info", "All attendance for today is already recorded!");
      return;
    }
    if (nextAction && type !== nextAction.type) {
      showToast("Warning", `Please complete ${nextAction.type} ${nextAction.action} first`);
      return;
    }
    setFormData({
      ...formData,
      attendanceType: type,
      action: nextAction?.action || "",
      loginTime: currentTime,
    });
  };

  const handleActionChange = (action) => {
    setFormData({
      ...formData,
      action: action,
      loginTime: currentTime,
    });
  };

  // Backend-integrated submit
  const handleSubmit = async () => {
    if (!formData.attendanceType || !formData.action) {
      showToast("Warning", "Please select Attendance Type and Action");
      return;
    }
    
    const type = formData.attendanceType.toLowerCase();
    const action = formData.action.toLowerCase();
    const actionField = `${type}_${action}`; // "morning_in", etc.
    
    if (!isActionAllowed(formData.attendanceType, formData.action)) {
      showToast("Error", "Invalid action sequence");
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: formData.userName,
          employee_name: formData.employeeName,
          login_date: formData.date,
          action: actionField,
          time: currentTime  // ✅ Uses CURRENT TIME for new action
        })
      });
      
      const data = await response.json();
      
      if (data.status) {
        // Update local state with real data
        setAttendanceStatus((prev) => ({
          ...prev,
          [type]: { ...prev[type], [action]: currentTime }
        }));
        
        showToast("Success", data.message);
        setFormData(prev => ({ 
          ...prev, 
          attendanceType: "", 
          action: "", 
          loginTime: "" 
        }));
        setTimeout(() => onClose?.(), 1500);
      } else {
        showToast("Error", data.message || "Failed to record attendance");
      }
    } catch (error) {
      console.error("Attendance submit error:", error);
      showToast("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isMorningComplete = attendanceStatus.morning.in && attendanceStatus.morning.out;
  const isAfternoonComplete = attendanceStatus.afternoon.in && attendanceStatus.afternoon.out;

  return (
    <>
      {showNotification && notificationData && (
        <Notification
          title={notificationData.title}
          message={notificationData.message}
          duration={3000}
          onClose={() => setShowNotification(false)}
        />
      )}

      <div className="fixed inset-0 bg-black/25 backdrop-blur-[2px] flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-2xl w-[65vw] h-[55vh] flex flex-col max-w-[850px]" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-[1.2vw] py-[0.8vw] border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
            <h2 className="text-[1.1vw] font-semibold text-gray-900">Record Attendance</h2>
            <span className="text-[0.95vw] font-medium text-gray-700 bg-white px-[0.6vw] py-[0.2vw] rounded-md shadow-sm">
              {currentTime}
            </span>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto px-[1.2vw] py-[1.5vw]">
            <div className="space-y-[1.5vw]">
              {/* Form Details */}
              <div className="grid grid-cols-2 gap-[1vw]">
                <Field label="Employee ID" value={formData.userName} disabled />
                <Field label="Employee Name" value={formData.employeeName} disabled />
                <Field label="Date" type="date" value={formData.date} disabled />
                {/* ✅ LAST ACTION TIME FIELD */}
                <Field 
                  label="Login Time" 
                  value={getLastActionTime()} 
                  disabled 
                />
              </div>

              {/* Controls */}
              <div className="grid grid-cols-2 gap-[1.5vw]">
                <div className="flex flex-col">
                  <label className="text-[0.8vw] text-gray-900 font-medium mb-[0.3vw]">
                    Attendance Type
                  </label>
                  <div className="relative">
                    <select
                      value={formData.attendanceType}
                      onChange={handleTypeChange}
                      disabled={allComplete}
                      className={`w-full appearance-none border px-[0.6vw] py-[0.4vw] pr-[2vw] rounded-lg text-[0.8vw] transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${
                        allComplete
                          ? "opacity-50 cursor-not-allowed border-gray-200 text-gray-500"
                          : "border-gray-300 hover:border-gray-400 focus:border-blue-400 cursor-pointer"
                      }`}
                    >
                      <option value="">Select...</option>
                      <option value="Morning" disabled={nextAction && nextAction.type !== "Morning"}>
                        Morning {isMorningComplete ? "(✓ Completed)" : ""}
                      </option>
                      <option value="Afternoon" disabled={nextAction && nextAction.type !== "Afternoon"}>
                        Afternoon {isAfternoonComplete ? "(✓ Completed)" : ""}
                      </option>
                    </select>
                    <ChevronDown className="absolute right-[0.5vw] top-1/2 -translate-y-1/2 w-[1vw] h-[1vw] text-gray-400 pointer-events-none" />
                  </div>
                  {allComplete && (
                    <span className="text-[0.7vw] text-green-600 mt-[0.3vw] font-medium">
                      ✓ All sessions completed
                    </span>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="text-[0.8vw] text-gray-900 font-medium mb-[0.3vw]">Action:</label>
                  <div className="flex items-center gap-[2vw] h-[2.2vw]">
                    <label className="flex items-center gap-[0.4vw] cursor-pointer group">
                      <input
                        type="radio"
                        name="action"
                        value="In"
                        checked={formData.action === "In"}
                        onChange={() => handleActionChange("In")}
                        disabled={!formData.attendanceType || (nextAction && nextAction.action !== "In")}
                        className="w-[1vw] h-[1vw] text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className={`text-[0.85vw] ${
                        formData.action === "In" ? "text-gray-900 font-semibold" : "text-gray-600"
                      } ${!formData.attendanceType || (nextAction && nextAction.action !== "In") ? "opacity-50" : ""}`}>
                        In
                      </span>
                    </label>
                    <label className="flex items-center gap-[0.4vw] cursor-pointer group">
                      <input
                        type="radio"
                        name="action"
                        value="Out"
                        checked={formData.action === "Out"}
                        onChange={() => handleActionChange("Out")}
                        disabled={!formData.attendanceType || (nextAction && nextAction.action !== "Out")}
                        className="w-[1vw] h-[1vw] text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className={`text-[0.85vw] ${
                        formData.action === "Out" ? "text-gray-900 font-semibold" : "text-gray-600"
                      } ${!formData.attendanceType || (nextAction && nextAction.action !== "Out") ? "opacity-50" : ""}`}>
                        Out
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-[1.2vw] border-t border-gray-200 flex justify-end gap-[0.8vw] bg-gray-50 rounded-b-xl">
            <button
              onClick={onClose}
              className="px-[1.5vw] py-[0.5vw] rounded-lg text-[0.9vw] text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 font-semibold hover:shadow-sm transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.attendanceType || !formData.action || allComplete}
              className="px-[2vw] py-[0.5vw] rounded-lg text-[0.9vw] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-[0.4vw]"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-[1vw] w-[1vw] border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <span className="text-[0.95vw]">✓</span>
                  Record {formData.action}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Attendance;
