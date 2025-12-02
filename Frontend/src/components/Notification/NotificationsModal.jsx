// NotificationModal.js

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import React from "react";
import { useNotification } from "../NotificationContext";
import PreviewModal from "../Project/PreviewModal";

// Configuration for all tabs and sub-tabs
const allTabsConfig = {
  All: null,
  Activity: {
    tabs: ["Po (Purchase Order)", "Invoice", "Quotation", "Budgetary"],
    subTabsConfig: {
      "Po (Purchase Order)": ["Requested", "Approved", "Rejected"],
      Invoice: ["Requested", "Approved", "Rejected"],
      Quotation: ["Requested", "Approved", "Rejected"],
      Budgetary: ["Requested", "Approved", "Rejected"],
    },
  },
  Projects: {
    tabs: ["ROI", "Others"],
    subTabsConfig: {
      ROI: ["Requested", "Approved", "Rejected"],
    },
  },
  Calendar: null,
};

// Currency symbols for display
const currencyOptions = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
};

// Create a cache service
const apiCache = (() => {
  const cache = new Map();
  const MAX_AGE = 15 * 60 * 1000; // 15 minutes

  return {
    get: (key) => {
      const item = cache.get(key);
      if (!item) return null;
      if (Date.now() - item.timestamp > MAX_AGE) {
        cache.delete(key);
        return null;
      }
      return item.data;
    },
    set: (key, value) => {
      cache.set(key, { data: value, timestamp: Date.now() });
    },
    clear: () => cache.clear(),
  };
})();

// Helper function to format time (e.g., "02:30 PM")
const formatTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// Helper function to calculate age of a notification (e.g., "5 mins ago")
const calculateAge = (timestamp) => {
  if (!timestamp) return "";
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  const weeks = Math.floor(diffDays / 7);
  if (weeks < 4) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  const months = Math.floor(diffDays / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(diffDays / 365);
  return `${years} year${years > 1 ? "s" : ""} ago`;
};

// Helper function to get the correct timestamp for a notification
const getNotificationTime = (notification) => {
  const isFinalized =
    notification.budgetarySubType === "Approved" ||
    notification.budgetarySubType === "Rejected" ||
    notification.activitySubType === "Approved" ||
    notification.activitySubType === "Rejected";

  const timestamp =
    isFinalized && notification.updatedAt
      ? notification.updatedAt
      : notification.createdAt || notification.timestamp;

  return {
    time: formatTime(timestamp),
    age: calculateAge(timestamp),
  };
};

// Helper function to check for admin access rights
const checkClientAccess = async (clientId, userId) => {
  if (!clientId || !userId) return false;

  const cacheKey = `clientAccess_${clientId}_${userId}`;
  const cachedResult = apiCache.get(cacheKey);
  if (cachedResult !== null) return cachedResult;

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/notification/client/${clientId}`
    );

    if (!response.ok) {
      apiCache.set(cacheKey, false);
      return false;
    }

    const data = await response.json();
    const clientData = data.data || data;

    if (
      clientData?.accessGrantedTo &&
      Array.isArray(clientData.accessGrantedTo)
    ) {
      const hasAccess = clientData.accessGrantedTo.some(
        (access) => access?.employeeId === userId
      );
      apiCache.set(cacheKey, hasAccess);
      return hasAccess;
    }

    apiCache.set(cacheKey, false);
    return false;
  } catch (error) {
    console.error("Error checking client access:", error);
    apiCache.set(cacheKey, false);
    return false;
  }
};

// Helper function to verify if the current user can see the notification
const hasNotificationAccess = (notification, userId, accessMap) => {
  if (
    !notification.employeeId &&
    !notification.clientId &&
    !notification.projectId
  )
    return false;
  if (notification.employeeId === userId) return true;
  return accessMap.get(notification.id) || false;
};

// Debounce utility
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

const TabsBar = React.memo(
  ({ tabs, activeTab, onTabClick, isSubTabs = false, counts = {} }) => {
    const [indicatorStyle, setIndicatorStyle] = useState({});
    const tabsRef = useRef(null);

    useEffect(() => {
      if (!activeTab) return;
      const activeTabElement = tabsRef.current?.querySelector(
        `[data-tab="${activeTab}"]`
      );
      if (activeTabElement) {
        const { offsetLeft, offsetWidth } = activeTabElement;
        setIndicatorStyle({ left: offsetLeft, width: offsetWidth });
        activeTabElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }, [activeTab, tabs]);

    return (
      <div
        className={`relative ${!isSubTabs ? "border-b" : ""} border-gray-200`}
      >
        <div
          ref={tabsRef}
          className={`flex space-x-[0.5vw] px-[0.8vw] overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
            isSubTabs ? "bg-gray-100/70" : ""
          }`}
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              data-tab={tab}
              onClick={() => onTabClick(tab)}
              className={`flex items-center gap-[0.3vw] flex-shrink-0 cursor-pointer whitespace-nowrap px-[0.8vw] py-[0.8vw] text-[0.9vw] font-medium transition-colors duration-200 outline-none ${
                activeTab === tab
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab}
              {counts[tab] > 0 && (
                <span
                  className={`px-[0.4vw] py-[0.1vw] rounded-full text-[0.7vw] font-bold min-w-[1vw] text-center ${
                    activeTab === tab
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {counts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>
        <div
          className="absolute bottom-[-0.11vh] h-[0.3vh] bg-blue-600 rounded-t-full transition-all duration-300 ease-in-out"
          style={indicatorStyle}
        />
      </div>
    );
  }
);

const ChipTabsBar = React.memo(({ tabs, activeTab, onTabClick, counts }) => (
  <div className="bg-gray-50/50 px-[0.8vw] py-[0.8vw]">
    <div className="flex gap-[0.5vw] flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabClick(tab)}
          className={`flex items-center cursor-pointer gap-[0.4vw] px-[0.8vw] py-[0.5vw] rounded-full text-[0.85vw] font-medium transition-all duration-200 ${
            activeTab === tab
              ? "bg-blue-600 text-white shadow-md"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          {tab}
          {counts[tab] > 0 && (
            <span
              className={`px-[0.4vw] py-[0.15vw] rounded-full text-[0.7vw] font-bold min-w-[1.2vw] text-center ${
                activeTab === tab
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {counts[tab]}
            </span>
          )}
        </button>
      ))}
    </div>
  </div>
));

const ToggleSwitch = React.memo(({ isChecked, onToggle }) => (
  <div className="flex items-center">
    <span className="mr-[0.5vw] text-[0.9vw] font-medium text-gray-500">
      Only Show Unread
    </span>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={onToggle}
        className="sr-only peer"
      />
      <div className="w-[3vw] h-[1.6vw] bg-gray-200 rounded-full peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-[1.4vw] peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[0.15vw] after:left-[0.15vw] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-[1.3vw] after:w-[1.3vw] after:transition-all"></div>
    </label>
  </div>
));

const imageCache = new Map();
const OptimizedIcon = React.memo(({ src, index, alt = "icon" }) => {
  const [iconSrc, setIconSrc] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isActive = true;
    let objectUrl = null;
    const loadImage = async () => {
      if (!src) return;
      if (imageCache.has(src)) {
        const blob = imageCache.get(src);
        objectUrl = URL.createObjectURL(blob);
        if (isActive) setIconSrc(objectUrl);
        return;
      }
      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error("Network response was not ok");
        const blob = await response.blob();
        imageCache.set(src, blob);
        objectUrl = URL.createObjectURL(blob);
        if (isActive) setIconSrc(objectUrl);
      } catch (e) {
        if (isActive) setError(true);
        console.error("Failed to load icon:", src, e);
      }
    };
    loadImage();
    return () => {
      isActive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (error) return <span className="text-[1.5vw]">🔔</span>;
  if (!iconSrc)
    return (
      <div className="w-full h-full rounded-full bg-gray-200 animate-pulse"></div>
    );
  const loadingStrategy = index !== undefined && index < 10 ? "eager" : "lazy";
  return (
    <img
      src={iconSrc}
      alt={alt}
      className="w-full h-full rounded-full object-cover"
      loading={loadingStrategy}
    />
  );
});

const NotificationListItem = React.memo(
  ({ notification, onClick, userRole, activeTab, index }) => {
    const [employeeData, setEmployeeData] = useState(null);
    const [clientData, setClientData] = useState(null);
    const [loading, setLoading] = useState(true);
    const itemRef = useRef(null);

    useEffect(() => {
      if (!itemRef.current) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              fetchData();
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(itemRef.current);
      return () => {
        if (itemRef.current) {
          observer.unobserve(itemRef.current);
        }
      };
    }, [notification.id]);

    const fetchData = useCallback(async () => {
      setLoading(true);
      try {
        const promises = [];

        if (notification.employeeId) {
          const cacheKey = `employee_${notification.employeeId}`;
          const cachedEmployee = apiCache.get(cacheKey);
          if (cachedEmployee) {
            setEmployeeData(cachedEmployee);
          } else {
            promises.push(
              fetch(
                `${import.meta.env.VITE_API_BASE_URL}/notification/${
                  notification.employeeId
                }`
              )
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => {
                  const result = data?.data || null;
                  if (result) apiCache.set(cacheKey, result);
                  setEmployeeData(result);
                  return result;
                })
                .catch(() => null)
            );
          }
        }

        const idForClientFetch =
          notification.clientId || notification.projectId;
        if (idForClientFetch) {
          const cacheKey = notification.projectId
            ? `project_display_data_${notification.projectId}`
            : `client_display_data_${notification.clientId}`;
          const cachedClient = apiCache.get(cacheKey);
          if (cachedClient) {
            setClientData(cachedClient);
          } else {
            const clientDataPromise = (async () => {
              try {
                if (notification.projectId) {
                  const projectResponse = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/projects/${
                      notification.projectId
                    }`
                  );
                  if (!projectResponse.ok) return null;
                  const projectData = await projectResponse.json();
                  const clientId =
                    projectData?.clientId || projectData?.data?.clientId;
                  if (!clientId) return null;
                  const clientResponse = await fetch(
                    `${
                      import.meta.env.VITE_API_BASE_URL
                    }/notification/client/${clientId}`
                  );
                  if (!clientResponse.ok) return null;
                  const finalClientData = await clientResponse.json();
                  const result =
                    finalClientData.data || finalClientData || null;
                  if (result) {
                    apiCache.set(cacheKey, result);
                    setClientData(result);
                  }
                  return result;
                } else {
                  const response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/notification/client/${
                      notification.clientId
                    }`
                  );
                  if (!response.ok) return null;
                  const data = await response.json();
                  const result = data?.data || data || null;
                  if (result) {
                    apiCache.set(cacheKey, result);
                    setClientData(result);
                  }
                  return result;
                }
              } catch (e) {
                return null;
              }
            })();
            promises.push(clientDataPromise);
          }
        }

        await Promise.all(promises);
      } catch (error) {
        console.error("Error fetching notification data:", error);
      } finally {
        setLoading(false);
      }
    }, [
      notification.employeeId,
      notification.clientId,
      notification.projectId,
    ]);

    const employeeName =
      employeeData?.name ||
      employeeData?.employeeName ||
      notification.employeeName ||
      "Unknown";
    const projectName =
      clientData?.projectName ||
      clientData?.name ||
      notification.projectName ||
      notification.clientId ||
      notification.projectId;
    const companyName = clientData?.companyName;
    const timeData = getNotificationTime(notification);
    const isAdmin = userRole?.toLowerCase() === "admin";

    const getStatusBadge = () => {
      const status =
        notification.budgetarySubType || notification.activitySubType;
      if (status === "Approved") {
        return (
          <span className="px-[0.6vw] py-[0.2vw] text-[0.7vw] font-medium text-green-600 bg-green-100 rounded-full">
            Approved
          </span>
        );
      }
      if (status === "Rejected") {
        return (
          <span className="px-[0.6vw] py-[0.2vw] text-[0.7vw] font-medium text-red-600 bg-red-100 rounded-full">
            Rejected
          </span>
        );
      }
      return null;
    };

    const renderIcon = () => {
      if (
        typeof notification.icon === "string" &&
        notification.icon.startsWith("/")
      ) {
        return (
          <OptimizedIcon src={notification.icon} index={index} alt="profile" />
        );
      }
      return (
        <span
          className="text-[1.5vw]"
          style={{ fontFamily: "Emoji, sans-serif" }}
        >
          {notification.icon || "🔔"}
        </span>
      );
    };

    return (
      <div
        ref={itemRef}
        onClick={onClick}
        className={`flex items-center justify-between p-[0.7vw] mx-[0.8vw] my-[0.3vw] rounded-lg hover:bg-gray-100 cursor-pointer transition-colors shadow-sm`}
      >
        <div className="flex items-center gap-4">
          <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 relative">
            {renderIcon()}
          </div>
          <div className="flex-1">
            {loading ? (
              <>
                {!isAdmin && (
                  <div className="animate-pulse mb-[0.2vh]">
                    <div className="h-[0.85vw] w-[12vw] bg-gray-200 rounded"></div>
                  </div>
                )}
                <div className="animate-pulse mb-[0.2vh]">
                  <div className="h-[0.75vw] w-[15vw] bg-gray-200 rounded"></div>
                </div>
                <div className="animate-pulse">
                  <div className="h-[0.7vw] w-[8vw] bg-gray-200 rounded"></div>
                </div>
              </>
            ) : (
              <>
                {!isAdmin && (
                  <p className="text-[0.85vw] text-gray-900 font-semibold">
                    Request from {employeeName}
                    {activeTab === "All" && notification.subType && (
                      <span className="font-normal text-gray-600">
                        {" "}
                        - {notification.subType}
                      </span>
                    )}
                  </p>
                )}
                <p className="text-[0.75vw] text-gray-800 font-medium">
                  {projectName}
                  {companyName && (
                    <span className="text-gray-600"> - {companyName}</span>
                  )}
                </p>
                <p className="text-[0.7vw] text-gray-500">
                  {timeData.time} · {timeData.age}
                </p>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-[0.8vw] pl-[0.5vw]">
          {getStatusBadge()}
          {notification.unread && (
            <div className="w-[0.5vw] h-[0.5vw] bg-blue-500 rounded-full flex-shrink-0"></div>
          )}
        </div>
      </div>
    );
  }
);

const NotificationDetailView = React.memo(
  ({
    notification,
    onBack,
    onAccept,
    onReject,
    userRole,
    user,
    notify,
    onMarkAsRead,
  }) => {
    const [employeeData, setEmployeeData] = useState(null);
    const [loadingEmployee, setLoadingEmployee] = useState(false);
    const [clientData, setClientData] = useState(null);
    const [loadingClient, setLoadingClient] = useState(false);
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [showPreviousRequests, setShowPreviousRequests] = useState(false);
    const [previousRequestsData, setPreviousRequestsData] = useState([]);
    const [loadingPrevious, setLoadingPrevious] = useState(false);
    const [acceptedCount, setAcceptedCount] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [historyModalFile, setHistoryModalFile] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const detailRef = useRef(null);

    console.log("notify", notification);

    // This is the simplest and most robust way to prevent the infinite loop.
    // The logic is now stable because the onMarkAsRead function passed from the parent is stable.
    useEffect(() => {
      if (userRole?.toLowerCase() === "admin" && notification.unread === true) {
        onMarkAsRead(notification);
      }
    }, [notification, userRole, onMarkAsRead]);

    const totalAmount = useMemo(() => {
      if (!notification.items || notification.items.length === 0) return 0;
      return notification.items.reduce(
        (sum, item) => sum + parseFloat(item.amount || 0),
        0
      );
    }, [notification.items]);

    const isBudgetaryNotification = notification.subType === "Budgetary";
    const isDocumentNotification = [
      "Po (Purchase Order)",
      "Invoice",
      "Quotation",
    ].includes(notification.subType);
    const isRoiNotification = notification.subType === "ROI";

    const getStatus = () => {
      const status =
        notification.activitySubType || notification.budgetarySubType;
      return {
        isRequested: status === "Requested",
        isApproved: status === "Approved",
        isRejected: status === "Rejected",
      };
    };

    const { isRequested, isApproved, isRejected } = getStatus();
    const timeData = getNotificationTime(notification);
    const isAdmin = userRole?.toLowerCase() === "admin";
    const currencySymbol =
      currencyOptions[notification.costType] || notification.costType || "₹";

    const getRequestTimeData = (request) => ({
      time: formatTime(request.updatedAt || request.createdAt),
      age: calculateAge(request.updatedAt || request.createdAt),
    });

    const calculateTotal = (items) => {
      if (!items || items.length === 0) return 0;
      return items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    };

    const calculateMonthlyRoi = (totalBudget, roiPeriod) => {
      const budget = parseFloat(totalBudget);
      const months = parseFloat(roiPeriod);
      if (!isNaN(budget) && !isNaN(months) && months > 0) {
        return budget / months;
      }
      return null;
    };

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        },
        { threshold: 0.1 }
      );
      if (detailRef.current) observer.observe(detailRef.current);
      return () => {
        if (detailRef.current) observer.unobserve(detailRef.current);
      };
    }, []);

    useEffect(() => {
      if (!isVisible) return;

      const fetchClientDetails = async () => {
        const idForFetch = notification.clientId || notification.projectId;
        if (!idForFetch) return;
        try {
          setLoadingClient(true);
          const cacheKey = notification.projectId
            ? `project_display_data_${notification.projectId}`
            : `client_display_data_${notification.clientId}`;
          const cachedData = apiCache.get(cacheKey);
          if (cachedData) {
            setClientData(cachedData);
            setLoadingClient(false);
            return;
          }
          let result = null;
          if (notification.projectId) {
            const projectResponse = await fetch(
              `${import.meta.env.VITE_API_BASE_URL}/projects/${
                notification.projectId
              }`
            );
            if (projectResponse.ok) {
              const projectData = await projectResponse.json();
              const clientId =
                projectData?.clientId || projectData?.data?.clientId;
              if (clientId) {
                const clientResponse = await fetch(
                  `${
                    import.meta.env.VITE_API_BASE_URL
                  }/notification/client/${clientId}`
                );
                if (clientResponse.ok) {
                  const data = await clientResponse.json();
                  result = data.data || data;
                }
              }
            }
          } else {
            const response = await fetch(
              `${import.meta.env.VITE_API_BASE_URL}/notification/client/${
                notification.clientId
              }`
            );
            if (response.ok) {
              const data = await response.json();
              result = data.data || data;
            }
          }
          if (result) {
            apiCache.set(cacheKey, result);
            setClientData(result);
          }
        } catch (error) {
          console.error("Error fetching client/project details:", error);
        } finally {
          setLoadingClient(false);
        }
      };

      const fetchEmployeeDetails = async () => {
        if (!notification.employeeId) return;
        try {
          setLoadingEmployee(true);
          const cacheKey = `employeeDetails_${notification.employeeId}`;
          const cachedData = apiCache.get(cacheKey);
          if (cachedData) {
            setEmployeeData(cachedData);
            setLoadingEmployee(false);
            return;
          }
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/notification/${
              notification.employeeId
            }`
          );
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          apiCache.set(cacheKey, data.data);
          setEmployeeData(data.data);
        } catch (error) {
          console.error("Error fetching employee details:", error);
        } finally {
          setLoadingEmployee(false);
        }
      };

      const fetchAcceptedCount = async () => {
        let endpoint = "";
        let cacheKey = "";
        let isRoi = false;
        if (isRoiNotification && notification.projectId) {
          endpoint = `${import.meta.env.VITE_API_BASE_URL}/notification/${
            notification.projectId
          }/ROI/history`;
          cacheKey = `acceptedCount_roi_${notification.projectId}`;
          isRoi = true;
        } else if (
          notification.clientId &&
          (isBudgetaryNotification || isDocumentNotification)
        ) {
          const historyType = isBudgetaryNotification
            ? "costentry"
            : "document";
          endpoint = `${
            import.meta.env.VITE_API_BASE_URL
          }/notification/client/${
            notification.clientId
          }/${historyType}/history`;
          cacheKey = `acceptedCount_${notification.clientId}_${historyType}`;
        } else {
          return;
        }
        try {
          const cachedCount = apiCache.get(cacheKey);
          if (cachedCount !== null) {
            setAcceptedCount(cachedCount);
            return;
          }
          const response = await fetch(endpoint);
          if (!response.ok) return;
          const data = await response.json();
          let historyArray;
          if (isRoi) {
            historyArray = data?.data?.history || [];
          } else {
            historyArray = data.allHistory || data.allDocuments || data || [];
            if (isDocumentNotification && data.allDocuments) {
              const subTypeKeyMap = {
                "Po (Purchase Order)": "po",
                Invoice: "invoice",
                Quotation: "quotation",
              };
              const historyKey = subTypeKeyMap[notification.subType];
              if (historyKey)
                historyArray = data.allDocuments[historyKey]?.history || [];
            }
          }
          if (!Array.isArray(historyArray)) return;
          const acceptedRequests = historyArray.filter(
            (item) =>
              item.status?.toLowerCase() === "accepted" ||
              item.status?.toLowerCase() === "approved"
          );
          apiCache.set(cacheKey, acceptedRequests.length);
          setAcceptedCount(acceptedRequests.length);
        } catch (error) {
          console.error("Error fetching accepted count:", error);
        }
      };

      fetchClientDetails();
      fetchEmployeeDetails();
      fetchAcceptedCount();
    }, [
      isVisible,
      notification,
      isRoiNotification,
      isBudgetaryNotification,
      isDocumentNotification,
    ]);

    const fetchPreviousRequests = async () => {
      setLoadingPrevious(true);
      try {
        if (isRoiNotification && notification.projectId) {
          const cacheKey = `previousRoiRequests_${notification.projectId}`;
          const cachedData = apiCache.get(cacheKey);
          if (cachedData) {
            setPreviousRequestsData(cachedData);
            setShowPreviousRequests(true);
            setLoadingPrevious(false);
            return;
          }
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/notification/${
              notification.projectId
            }/ROI/history`
          );
          if (!response.ok) throw new Error("Failed to fetch ROI history");
          const data = await response.json();
          const historyArray = data?.data?.history || [];
          if (!Array.isArray(historyArray) || historyArray.length === 0) {
            notify({
              title: "Info",
              message: "No previous ROI requests found.",
            });
          } else {
            const acceptedRequests = historyArray.filter(
              (item) =>
                item.status?.toLowerCase() === "accepted" ||
                item.status?.toLowerCase() === "approved"
            );
            if (acceptedRequests.length === 0) {
              notify({
                title: "Info",
                message: "No previous accepted ROI requests found.",
              });
            } else {
              acceptedRequests.sort(
                (a, b) =>
                  new Date(b.updatedAt || b.createdAt) -
                  new Date(a.updatedAt || a.createdAt)
              );
              apiCache.set(cacheKey, acceptedRequests);
              setPreviousRequestsData(acceptedRequests);
              setShowPreviousRequests(true);
            }
          }
        } else if (notification.clientId) {
          const historyType = isBudgetaryNotification
            ? "costentry"
            : "document";
          const cacheKey = `previousRequests_${notification.clientId}_${historyType}`;
          const cachedData = apiCache.get(cacheKey);
          if (cachedData) {
            setPreviousRequestsData(cachedData);
            setShowPreviousRequests(true);
            setLoadingPrevious(false);
            return;
          }
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/notification/client/${
              notification.clientId
            }/${historyType}/history`
          );
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          let historyArray = [];
          if (historyType === "document" && data.allDocuments) {
            const subTypeKeyMap = {
              "Po (Purchase Order)": "po",
              Invoice: "invoice",
              Quotation: "quotation",
            };
            const historyKey = subTypeKeyMap[notification.subType];
            if (historyKey)
              historyArray = data.allDocuments[historyKey]?.history || [];
          } else {
            historyArray = data.allHistory || data.history || data;
          }
          if (!Array.isArray(historyArray) || historyArray.length === 0) {
            notify({ title: "Info", message: "No previous requests found." });
          } else {
            const acceptedRequests = historyArray.filter(
              (item) =>
                item.status?.toLowerCase() === "accepted" ||
                item.status?.toLowerCase() === "approved"
            );
            if (acceptedRequests.length === 0) {
              notify({
                title: "Info",
                message: "No previous accepted requests found.",
              });
            } else {
              acceptedRequests.sort(
                (a, b) =>
                  new Date(b.updatedAt || b.createdAt) -
                  new Date(a.updatedAt || a.createdAt)
              );
              apiCache.set(cacheKey, acceptedRequests);
              setPreviousRequestsData(acceptedRequests);
              setShowPreviousRequests(true);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching previous requests:", error);
        notify({
          title: "Error",
          message: "Failed to fetch previous requests.",
        });
      } finally {
        setLoadingPrevious(false);
      }
    };

    const handlePreviousRequestsToggle = () => {
      if (showPreviousRequests) {
        setShowPreviousRequests(false);
      } else {
        previousRequestsData.length > 0
          ? setShowPreviousRequests(true)
          : fetchPreviousRequests();
      }
    };

    const handleRejectClick = () => setShowRejectInput(true);
    const handleCancelReject = () => setShowRejectInput(false);

    const handleSubmitReject = () => {
      if (!rejectionReason.trim()) {
        notify({
          title: "Warning",
          message: "Please provide a reason for rejection.",
        });
        return;
      }
      onReject && onReject(notification.id, rejectionReason);
      setShowRejectInput(false);
    };

    const handleDownload = async (e, documentPath, filename) => {
      e.preventDefault();
      if (!documentPath) {
        notify({
          title: "Warning",
          message: "No document path available to download.",
        });
        return;
      }
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/${documentPath.replace(
            /^\/+/,
            ""
          )}`
        );
        if (!response.ok) throw new Error("Network response was not ok");
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename || "document");
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Download failed:", error);
        notify({
          title: "Error",
          message: "Download failed. Please try again.",
        });
      }
    };

    const renderActionButtons = () => {
      if (!isRequested) return null;
      return (
        <div className="mt-[2vh] pt-[2vh] border-t border-gray-200">
          {showRejectInput && (
            <div className="mb-[1.5vh] animate-fade-in">
              <label className="block text-[0.8vw] font-semibold text-gray-700 mb-[0.5vh]">
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a detailed reason..."
                className="w-full text-black px-[0.8vw] py-[0.6vh] text-[0.75vw] border border-gray-300 rounded-lg"
                rows={4}
                autoFocus
              />
            </div>
          )}
          <div className="flex justify-end gap-[0.8vw]">
            <button
              onClick={
                showRejectInput
                  ? handleCancelReject
                  : () => onAccept && onAccept(notification.id)
              }
              className={`px-[1.2vw] cursor-pointer py-[0.8vh] text-[0.8vw] font-medium rounded-full shadow-sm transition-colors ${
                showRejectInput
                  ? "bg-gray-600 text-white hover:bg-gray-700"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {showRejectInput ? "Cancel" : "Accept"}
            </button>
            <button
              onClick={showRejectInput ? handleSubmitReject : handleRejectClick}
              className={`px-[1.2vw] py-[0.8vh] text-[0.8vw] cursor-pointer font-medium rounded-full shadow-sm transition-colors ${
                showRejectInput
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              {showRejectInput ? "Submit Rejection" : "Reject"}
            </button>
          </div>
        </div>
      );
    };

    const renderRoiView = () => {
      const statusColor = isApproved ? "green" : isRejected ? "red" : "blue";
      const monthlyRoi = calculateMonthlyRoi(
        notification.totalBudget,
        notification.roiPeriod
      );
      return (
        <>
          <div className="mb-[2vh]">
            <h4 className="text-[0.9vw] font-semibold text-gray-800 mb-[1vh] flex items-center gap-[0.5vw]">
              <svg
                className="w-[1vw] h-[1vw] text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
              Return on Investment (ROI) Request
            </h4>
            <div
              className={`border-l-4 border-${statusColor}-500 rounded-r-lg shadow-sm bg-gray-50`}
            >
              <div className="p-[1vw] grid grid-cols-3 gap-x-[2vw] gap-y-[1.5vh]">
                <div>
                  <p className="text-[0.7vw] text-gray-500 font-medium">
                    Total Budget
                  </p>
                  <p className="text-[0.9vw] text-gray-800 font-semibold">
                    {currencySymbol}{" "}
                    {parseFloat(notification.totalBudget).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[0.7vw] text-gray-500 font-medium">
                    ROI Period
                  </p>
                  <p className="text-[0.9vw] text-gray-800 font-semibold">
                    {notification.roiPeriod} Months
                  </p>
                </div>
                {monthlyRoi !== null && (
                  <div>
                    <p className="text-[0.7vw] text-gray-500 font-medium">
                      Monthly ROI
                    </p>
                    <p className="text-[0.9vw] text-gray-800 font-semibold">
                      {currencySymbol}{" "}
                      {monthlyRoi.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
            {notification.remarks && isRejected && (
              <div className="mt-[1.5vh] p-[0.8vw] bg-red-50 border border-red-200 rounded-lg">
                <p className="text-[0.75vw] font-semibold text-red-700">
                  Rejection Reason:{" "}
                  <span className="font-normal text-red-600">
                    {notification.remarks}
                  </span>
                </p>
              </div>
            )}
          </div>
          {renderActionButtons()}
        </>
      );
    };

    const renderDocumentView = () => {
      const getDocumentTypeLabel = () => {
        if (notification.subType === "Po (Purchase Order)")
          return "Purchase Order";
        if (notification.subType === "Invoice") return "Invoice";
        if (notification.subType === "Quotation") return "Quotation";
        return "Document";
      };
      const statusColor = isApproved ? "green" : isRejected ? "red" : "blue";
      return (
        <>
          <div className="mb-[2vh]">
            <h4 className="text-[0.9vw] font-semibold text-gray-800 mb-[1vh] flex items-center gap-[0.5vw]">
              {showPreviousRequests
                ? `Current ${getDocumentTypeLabel()}`
                : getDocumentTypeLabel()}
            </h4>
            <div
              className={`border-1 border-${statusColor}-200 rounded-lg shadow-sm bg-${statusColor}-50`}
            >
              <div className="p-[1vw] grid grid-cols-2 gap-x-[2vw] gap-y-[1.5vh]">
                <div>
                  <p className="text-[0.7vw] text-gray-500 font-medium">
                    File name
                  </p>
                  <p className="text-[0.8vw] text-gray-800 font-semibold truncate max-w-[15vw]">
                    {notification.filename || ""}
                  </p>
                </div>
                <div>
                  <p className="text-[0.7vw] text-gray-500 font-medium">
                    Actions
                  </p>
                  {notification.documentPath ? (
                    <div className="mt-1 flex items-center gap-[0.5vw]">
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex cursor-pointer items-center gap-[0.5vw] px-[1vw] py-[0.6vh] bg-blue-600 text-white text-[0.75vw] font-medium rounded-full hover:bg-blue-700 transition-colors"
                      >
                        <svg
                          className="w-[1vw] h-[1vw]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        View
                      </button>
                      <a
                        href="#"
                        onClick={(e) =>
                          handleDownload(
                            e,
                            notification.documentPath,
                            notification.filename
                          )
                        }
                        className="flex cursor-pointer items-center gap-[0.5vw] px-[1vw] py-[0.6vh] bg-green-600 text-white text-[0.75vw] font-medium rounded-full hover:bg-green-700 transition-colors"
                      >
                        <svg
                          className="w-[1vw] h-[1vw]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        Download
                      </a>
                    </div>
                  ) : (
                    <p className="text-[0.8vw] text-gray-500 mt-1">
                      No document attached.
                    </p>
                  )}
                </div>
              </div>
            </div>
            {notification.remarks && isRejected && (
              <div className="mt-[1.5vh] p-[0.8vw] bg-red-50 border border-red-200 rounded-lg">
                <p className="text-[0.75vw] font-semibold text-red-700">
                  Rejection Reason:{" "}
                  <span className="font-normal text-red-600">
                    {notification.remarks}
                  </span>
                </p>
              </div>
            )}
          </div>
          {renderActionButtons()}
        </>
      );
    };

    // ✅ --- THIS FUNCTION IS FIXED --- ✅
    const renderBudgetaryView = () => (
      <>
        <div className="mb-[2vh]">
          <h4 className="text-[0.9vw] font-semibold text-gray-800 mb-[1vh] flex items-center gap-[0.5vw]">
            <svg
              className="w-[1vw] h-[1vw] text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            {showPreviousRequests ? "Current Budget Request" : "Budget"}
          </h4>
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-[1vw] py-[0.8vh] text-left text-[0.75vw] font-semibold text-gray-700">
                    Category
                  </th>
                  <th className="px-[1vw] py-[0.8vh] text-left text-[0.75vw] font-semibold text-gray-700">
                    Item
                  </th>
                  <th className="px-[1vw] py-[0.8vh] text-right text-[0.75vw] font-semibold text-gray-700">
                    Amount ({notification.costType || "INR"})
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {notification.items.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="px-[1vw] py-[0.8vh] text-[0.75vw] text-gray-600">
                      {item.category}
                    </td>
                    <td className="px-[1vw] py-[0.8vh] text-[0.75vw] text-gray-800">
                      {item.item}
                    </td>
                    <td className="px-[1vw] py-[0.8vh] text-[0.75vw] text-gray-800 text-right font-medium">
                      {currencySymbol}{" "}
                      {parseFloat(item.amount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot
                className={`border-t-2 border-gray-300 ${
                  isApproved
                    ? "bg-green-50"
                    : isRejected
                    ? "bg-red-50"
                    : "bg-blue-50"
                }`}
              >
                <tr>
                  <td
                    colSpan="2"
                    className="px-[1vw] py-[0.8vh] text-[0.8vw] font-semibold text-gray-800"
                  >
                    Total Amount
                  </td>
                  <td
                    className={`px-[1vw] py-[0.8vh] text-[0.8vw] font-bold text-right ${
                      isApproved
                        ? "text-green-600"
                        : isRejected
                        ? "text-red-600"
                        : "text-blue-600"
                    }`}
                  >
                    {currencySymbol} {totalAmount.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ✅ --- THIS BLOCK WAS MISSING --- ✅ */}
          {notification.remarks && isRejected && (
            <div className="mt-[1.5vh] p-[0.8vw] bg-red-50 border border-red-200 rounded-lg">
              <p className="text-[0.75vw] font-semibold text-red-700">
                Rejection Reason:{" "}
                <span className="font-normal text-red-600">
                  {notification.remarks}
                </span>
              </p>
            </div>
          )}
          {/* ✅ --- END OF FIX --- ✅ */}
        </div>
        {renderActionButtons()}
      </>
    );
    // ✅ --- END OF FIXED FUNCTION --- ✅

    const renderPreviousRequests = () => {
      if (!showPreviousRequests || previousRequestsData.length === 0)
        return null;

      if (isRoiNotification) {
        const roiHistoryItems = previousRequestsData.map((request, index) => {
          const requestTimeData = getRequestTimeData(request);
          const monthlyRoi = calculateMonthlyRoi(
            request.totalBudget,
            request.roiPeriod
          );

          return (
            <div
              key={request._id || index}
              className="border border-green-200 rounded-lg overflow-hidden shadow-sm bg-green-50/20"
            >
              <div className="bg-green-100/50 px-[1vw] py-[0.6vh] border-b border-green-200 flex items-center justify-between">
                <div className="flex items-center gap-[0.5vw]">
                  <span className="px-[0.6vw] py-[0.2vh] bg-green-600 text-white text-[0.7vw] font-bold rounded-full">
                    {previousRequestsData.length - index}
                  </span>
                  <span className="text-[0.75vw] font-semibold text-green-700">
                    Accepted ROI Request
                  </span>
                </div>
                <span className="text-[0.7vw] text-gray-600">
                  {requestTimeData.time} · {requestTimeData.age}
                </span>
              </div>
              <div className="p-[1vw] grid grid-cols-3 gap-x-[2vw] gap-y-[1.5vh]">
                <div>
                  <p className="text-[0.7vw] text-gray-500 font-medium">
                    Total Budget
                  </p>
                  <p className="text-[0.8vw] text-gray-800 font-semibold">
                    {currencySymbol}{" "}
                    {parseFloat(request.totalBudget).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[0.7vw] text-gray-500 font-medium">
                    ROI Period
                  </p>
                  <p className="text-[0.8vw] text-gray-800 font-semibold">
                    {request.roiPeriod} Months
                  </p>
                </div>
                {monthlyRoi !== null && (
                  <div>
                    <p className="text-[0.7vw] text-gray-500 font-medium">
                      Monthly ROI
                    </p>
                    <p className="text-[0.8vw] text-gray-800 font-semibold">
                      {currencySymbol}{" "}
                      {monthlyRoi.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        });

        return (
          <div className="pt-[2vh] border-t-2 border-gray-200 mt-[2vh]">
            <h4 className="text-[1vw] font-bold text-gray-800 mb-[1.5vh] flex items-center gap-[0.5vw]">
              <svg
                className="w-[1.2vw] h-[1.2vw] text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Previous Accepted ROI Requests ({previousRequestsData.length})
            </h4>
            <div className="space-y-[2vh]">{roiHistoryItems}</div>
          </div>
        );
      }

      if (isBudgetaryNotification) {
        const budgetaryHistoryItems = previousRequestsData.map(
          (request, index) => {
            const requestTimeData = getRequestTimeData(request);
            const requestTotal = calculateTotal(request.items);
            return (
              <div
                key={request._id || index}
                className="border border-green-200 rounded-lg overflow-hidden shadow-sm bg-green-50/20"
              >
                <div className="bg-green-100/50 px-[1vw] py-[0.6vh] border-b border-green-200 flex items-center justify-between">
                  <div className="flex items-center gap-[0.5vw]">
                    <span className="px-[0.6vw] py-[0.2vh] bg-green-600 text-white text-[0.7vw] font-bold rounded-full">
                      {previousRequestsData.length - index}
                    </span>
                    <span className="text-[0.75vw] font-semibold text-green-700">
                      Accepted Request
                    </span>
                  </div>
                  <span className="text-[0.7vw] text-gray-600">
                    {requestTimeData.time} · {requestTimeData.age}
                  </span>
                </div>
                <table className="w-full">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="px-[1vw] py-[0.8vh] text-left text-[0.7vw] font-semibold text-gray-700 border-b border-green-200">
                        Category
                      </th>
                      <th className="px-[1vw] py-[0.8vh] text-left text-[0.7vw] font-semibold text-gray-700 border-b border-green-200">
                        Item
                      </th>
                      <th className="px-[1vw] py-[0.8vh] text-right text-[0.7vw] font-semibold text-gray-700 border-b border-green-200">
                        Amount ({request.costType || "INR"})
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {request.items &&
                      request.items.map((item, itemIndex) => (
                        <tr
                          key={itemIndex}
                          className="border-b border-green-100 last:border-b-0 hover:bg-green-50"
                        >
                          <td className="px-[1vw] py-[0.7vh] text-[0.7vw] text-gray-600">
                            {item.category}
                          </td>
                          <td className="px-[1vw] py-[0.7vh] text-[0.7vw] text-gray-800">
                            {item.item}
                          </td>
                          <td className="px-[1vw] py-[0.7vh] text-[0.7vw] text-gray-800 text-right font-medium">
                            {currencySymbol}{" "}
                            {parseFloat(item.amount).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot className="bg-green-100/50">
                    <tr>
                      <td
                        colSpan="2"
                        className="px-[1vw] py-[0.7vh] text-[0.75vw] font-semibold text-gray-800 border-t-2 border-green-300"
                      >
                        Total Amount
                      </td>
                      <td className="px-[1vw] py-[0.7vh] text-[0.75vw] font-bold text-green-600 text-right border-t-2 border-green-300">
                        {currencySymbol} {requestTotal.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            );
          }
        );
        return (
          <div className="pt-[2vh] border-t-2 border-gray-200 mt-[2vh]">
            <h4 className="text-[1vw] font-bold text-gray-800 mb-[1.5vh] flex items-center gap-[0.5vw]">
              <svg
                className="w-[1.2vw] h-[1.2vw] text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Previous Accepted Requests ({previousRequestsData.length})
            </h4>
            <div className="space-y-[2vh]">{budgetaryHistoryItems}</div>
          </div>
        );
      }

      if (isDocumentNotification) {
        const documentHistoryItems = previousRequestsData.map(
          (request, index) => {
            const requestTimeData = getRequestTimeData(request);
            const subType =
              request.subType ||
              (request.path?.includes("_PO/")
                ? "PO"
                : request.path?.includes("_Invoice/")
                ? "Invoice"
                : "Quotation");
            return (
              <div
                key={request._id || index}
                className="border border-green-200 rounded-lg overflow-hidden shadow-sm bg-white"
              >
                <div className="bg-green-100/50 px-[1vw] py-[0.6vh] border-b border-green-200 flex items-center justify-between">
                  <div className="flex items-center gap-[0.5vw]">
                    <span className="px-[0.6vw] py-[0.2vh] bg-green-600 text-white text-[0.7vw] font-bold rounded-full">
                      {previousRequestsData.length - index}
                    </span>
                    <span className="text-[0.75vw] font-semibold text-green-700">
                      Previously Approved {subType}
                    </span>
                  </div>
                  <span className="text-[0.7vw] text-gray-600">
                    {requestTimeData.time} · {requestTimeData.age}
                  </span>
                </div>
                <div className="p-[1vw] grid grid-cols-2 gap-x-[2vw]">
                  <div>
                    <p className="text-[0.7vw] text-gray-500 font-medium">
                      Filename
                    </p>
                    <p className="text-[0.8vw] text-gray-800 font-semibold">
                      {request.filename || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.7vw] text-gray-500 font-medium">
                      Actions
                    </p>
                    <div className="mt-1 flex items-center gap-[0.5vw]">
                      <button
                        onClick={() => setHistoryModalFile(request.path)}
                        className="flex items-center gap-[0.5vw] px-[0.8vw] py-[0.5vh] bg-blue-600 text-white text-[0.7vw] font-medium rounded-full"
                      >
                        View
                      </button>
                      <a
                        href="#"
                        onClick={(e) =>
                          handleDownload(e, request.path, request.filename)
                        }
                        className="flex items-center gap-[0.5vw] px-[0.8vw] py-[0.5vh] bg-green-600 text-white text-[0.7vw] font-medium rounded-full"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
        );
        return (
          <div className="pt-[2vh] border-t-2 border-gray-200 mt-[2vh]">
            <h4 className="text-[1vw] font-bold text-gray-800 mb-[1.5vh] flex items-center gap-[0.5vw]">
              <svg
                className="w-[1.2vw] h-[1.2vw] text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Previous Approved Documents ({previousRequestsData.length})
            </h4>
            <div className="space-y-[1.5vh]">{documentHistoryItems}</div>
          </div>
        );
      }
      return null;
    };

    return (
      <div ref={detailRef} className="flex flex-col h-full overflow-hidden">
        <div className="flex-shrink-0 bg-white border-b border-gray-200 p-[1vw]">
          <button
            onClick={onBack}
            className="flex cursor-pointer items-center text-[0.9vw] font-medium text-gray-600 hover:text-gray-900"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-[1.2vw] w-[1.2vw] mr-[0.3vw]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to all notifications
          </button>
        </div>
        <div className="flex-shrink-0 bg-white border-b border-gray-200 p-[1vw]">
          <div className="flex items-center gap-[1vw]">
            <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              {typeof notification.icon === "string" &&
              notification.icon.startsWith("/") ? (
                <img
                  src={notification.icon}
                  alt="profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-[1.5vw]">{notification.icon}</span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-[1vw]">
                <div className="flex-1">
                  {loadingEmployee || loadingClient ? (
                    <div className="animate-pulse space-y-2">
                      {!isAdmin && (
                        <div className="h-[1vw] w-[12vw] bg-gray-200 rounded"></div>
                      )}
                      <div className="h-[0.8vw] w-[15vw] bg-gray-200 rounded"></div>
                      <div className="h-[0.7vw] w-[10vw] bg-gray-200 rounded"></div>
                    </div>
                  ) : (
                    <>
                      {!isAdmin && (
                        <h2 className="text-[0.9vw] font-bold text-gray-900">
                          Request from {employeeData?.employeeName || "Unknown"}
                        </h2>
                      )}
                      <h3
                        className={`text-[0.85vw] font-semibold text-gray-800 ${
                          isAdmin ? "text-[1vw]" : ""
                        }`}
                      >
                        {clientData?.projectName ||
                          clientData?.name ||
                          notification.clientId ||
                          notification.projectId}{" "}
                        {clientData?.companyName && (
                          <span className="text-gray-500">
                            - {clientData.companyName}
                          </span>
                        )}
                      </h3>
                      <p className="text-[0.7vw] text-gray-500">
                        {timeData.time} · {timeData.age}
                      </p>
                    </>
                  )}
                </div>
                <div className="flex-shrink-0 flex items-center gap-[0.5vw]">
                  {isApproved && (
                    <span className="inline-flex items-center px-[0.8vw] py-[0.4vh] rounded-full text-[0.75vw] font-medium bg-green-100 text-green-800">
                      <svg
                        className="w-[0.8vw] h-[0.8vw] mr-[0.3vw]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Approved
                    </span>
                  )}
                  {isRejected && (
                    <span className="inline-flex items-center px-[0.8vw] py-[0.4vh] rounded-full text-[0.75vw] font-medium bg-red-100 text-red-800">
                      <svg
                        className="w-[0.8vw] h-[0.8vw] mr-[0.3vw]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Rejected
                    </span>
                  )}
                  {isRequested && acceptedCount > 0 && (
                    <button
                      onClick={handlePreviousRequestsToggle}
                      disabled={loadingPrevious}
                      className={`flex cursor-pointer items-center text-[0.75vw] font-medium transition-colors px-[0.8vw] py-[0.4vh] rounded-full ${
                        showPreviousRequests
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      } ${
                        loadingPrevious ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {loadingPrevious ? (
                        "Loading..."
                      ) : (
                        <>
                          <span className="font-bold mr-[0.3vw]">
                            {showPreviousRequests ? "" : acceptedCount}
                          </span>
                          {showPreviousRequests
                            ? "Hide Accepted"
                            : "Show Accepted"}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-[1vw] custom-scrollbar">
          {isDocumentNotification && renderDocumentView()}
          {isBudgetaryNotification && renderBudgetaryView()}
          {isRoiNotification && renderRoiView()}
          {renderPreviousRequests()}
          {isModalOpen && (
            <PreviewModal
              file={`${notification.documentPath.replace(/^\/+/, "")}`}
              docment={true}
              onClose={() => setIsModalOpen(false)}
            />
          )}
          {historyModalFile && (
            <PreviewModal
              file={`${historyModalFile.replace(/^\/+/, "")}`}
              docment={true}
              onClose={() => setHistoryModalFile(null)}
            />
          )}
        </div>
      </div>
    );
  }
);

// Main NotificationsModal Component
export default function NotificationsModal({
  onClose,
  notifications,
  userRole,
  user,
  onStatusUpdate,
  onAdminMarkAsRead,
  onRefresh,
  loading: initialLoading,
}) {
  const [activeTab, setActiveTab] = useState("All");
  const [activeSubTab, setActiveSubTab] = useState(null);
  const [activeActivitySubTab, setActiveActivitySubTab] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [sortOrder, setSortOrder] = useState("newest");
  const [accessCheckedNotifications, setAccessCheckedNotifications] = useState(
    new Map()
  );
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [listKey, setListKey] = useState(0);

  const { notify } = useNotification();
  const listRef = useRef(null);
  const itemsPerPage = 20;

  useEffect(() => {
    if (selectedNotification) {
      const updatedNotification = notifications.find(
        (n) => n.id === selectedNotification.id
      );
      if (updatedNotification) {
        setSelectedNotification(updatedNotification);
      }
    }
  }, [notifications]);

  useEffect(() => {
    const checkAllNotificationsAccess = async () => {
      if (userRole.toLowerCase() === "super admin") {
        setAccessCheckedNotifications(
          new Map(notifications.map((n) => [n.id, true]))
        );
        return;
      }
      if (userRole.toLowerCase() === "admin" && user?.id) {
        setIsCheckingAccess(true);
        const finalAccessMap = new Map();
        const directClientNotifications = new Map();
        const projectNotificationsToResolve = new Map();
        notifications.forEach((n) => {
          if (n.employeeId === user.id) {
            finalAccessMap.set(n.id, true);
          } else if (n.clientId) {
            if (!directClientNotifications.has(n.clientId))
              directClientNotifications.set(n.clientId, []);
            directClientNotifications.get(n.clientId).push(n.id);
          } else if (n.projectId) {
            if (!projectNotificationsToResolve.has(n.projectId))
              projectNotificationsToResolve.set(n.projectId, []);
            projectNotificationsToResolve.get(n.projectId).push(n.id);
          }
        });
        const clientAccessPromises = Array.from(
          directClientNotifications.entries()
        ).map(async ([clientId, notifIds]) => {
          const hasAccess = await checkClientAccess(clientId, user.id);
          notifIds.forEach((notifId) => finalAccessMap.set(notifId, hasAccess));
        });
        const projectAccessPromises = Array.from(
          projectNotificationsToResolve.entries()
        ).map(async ([projectId, notifIds]) => {
          let hasAccess = false;
          try {
            const projectResponse = await fetch(
              `${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}`
            );
            if (projectResponse.ok) {
              const projectData = await projectResponse.json();
              const resolvedClientId =
                projectData?.clientId || projectData?.data?.clientId;
              if (resolvedClientId) {
                hasAccess = await checkClientAccess(resolvedClientId, user.id);
              }
            }
          } catch (error) {
            console.error(`Failed to resolve project ID ${projectId}`, error);
          }
          notifIds.forEach((notifId) => finalAccessMap.set(notifId, hasAccess));
        });
        await Promise.all([...clientAccessPromises, ...projectAccessPromises]);
        setAccessCheckedNotifications(finalAccessMap);
        setIsCheckingAccess(false);
      } else {
        setAccessCheckedNotifications(
          new Map(notifications.map((n) => [n.id, true]))
        );
      }
    };
    if (notifications.length > 0) {
      checkAllNotificationsAccess();
      setTimeout(() => setIsInitialLoad(false), 500);
    } else {
      setIsInitialLoad(false);
    }
  }, [notifications, userRole, user]);

  const markAdminNotificationAsRead = useCallback(
    async (notification) => {
      if (!notification || !user) return;

      try {
        let endpoint = "";
        let requestBody = {};
        const isRoi = notification.subType === "ROI";

        if (isRoi) {
          // ✅ MODIFIED: This now matches the Budgetary payload structure
          endpoint = `${
            import.meta.env.VITE_API_BASE_URL
          }/ReturnInvestment/status`;
          requestBody = {
            projectId: notification.projectId,
            status: "requested", // ✅ Send 'requested' to signify flag-only update
            historyId: notification.historyId,
            historyIndex: notification.historyIndex,
            adminId: user.id, // ✅ User performing the action
            notificationFlag: [
              // ✅ Send flag array
              {
                employeeId: user.id,
                flag: false, // ✅ Mark ROI as read for *this* user
              },
            ],
          };
        } else {
          // ✅ Budgetary, PO, Invoice, Quotation use notificationFlag array
          endpoint = `${
            import.meta.env.VITE_API_BASE_URL
          }/client_Budgetary/status`;
          const backendType =
            notification.subType === "Budgetary"
              ? "costEntry"
              : notification.subType === "Po (Purchase Order)"
              ? "po"
              : notification.subType === "Invoice"
              ? "invoice"
              : "quotation";

          requestBody = {
            clientId: notification.clientId,
            type: backendType,
            status: "requested", // ✅ CORRECTED: Was notification.status, now "requested"
            historyId: notification.historyId,
            historyIndex: notification.historyIndex,
            notificationFlag: [
              {
                employeeId: user.id,
                flag: false, // ✅ Mark only current admin as read
              },
            ],
          };
        }

        const response = await fetch(endpoint, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update status");
        }

        console.log("Notification marked as read:", response);
        onAdminMarkAsRead(notification.id);
      } catch (error) {
        console.error("Error in markAdminNotificationAsRead:", error);
        notify({
          title: "Error",
          message: `Could not mark notification as read: ${error.message}`,
        });
      }
    },
    [user, onAdminMarkAsRead, notify]
  );

  const updateBudgetaryStatus = async (
    notification,
    status,
    user,
    remarks = ""
  ) => {
    try {
      const typeMap = {
        Budgetary: "costEntry",
        "Po (Purchase Order)": "po",
        Invoice: "invoice",
      };

      // Always include clientOwnerId (notification.employeeId)
      // Add any accessGrantedTo employeeIds if available
      const flagEmployeeIds = [
        notification.employeeId,
        ...(notification.accessGrantedTo?.map((emp) => emp.employeeId) || []),
      ];

      // Remove duplicates, just in case
      const uniqueEmployeeIds = [...new Set(flagEmployeeIds)];

      const notificationFlag = uniqueEmployeeIds.map((employeeId) => ({
        employeeId,
        flag: true,
      }));

      const requestBody = {
        clientId: notification.clientId,
        type: typeMap[notification.subType] || "quotation",
        historyIndex: notification.historyIndex,
        status,
        remarks,
        updatedBy: user.id,
        finalizedBy: user.id,
        historyId: notification.historyId,
        updatedAt: new Date().toISOString(),
        notificationFlag, // ✅ includes clientOwnerId + accessGrantedTo
      };

      const endpoint = `${
        import.meta.env.VITE_API_BASE_URL
      }/client_Budgetary/status`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating budgetary/document status:", error);
      throw error;
    }
  };

  const updateRoiStatus = async (notification, status, remarks = "") => {
    try {
      // ✅ Build the notificationFlag array for the original employee
      const flagEmployeeIds = [
        notification.employeeId,
        ...(notification.accessGrantedTo?.map((emp) => emp.employeeId) || []),
      ];
      const uniqueEmployeeIds = [...new Set(flagEmployeeIds)];
      const notificationFlag = uniqueEmployeeIds.map((employeeId) => ({
        employeeId,
        flag: true, // Notify them of the update
      }));

      const requestBody = {
        projectId: notification.projectId,
        status,
        adminId: user.id, // User performing the action
        adminRemarks: remarks,
        historyIndex: notification.historyIndex,
        historyId: notification.historyId,
        updatedBy: user.id,
        notificationFlag, // ✅ Send the new flag array
        updatedAt: new Date().toISOString(),
      };

      const endpoint = `${
        import.meta.env.VITE_API_BASE_URL
      }/ReturnInvestment/status`;
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }
      return await response.json();
    } catch (error) {
      console.error("Error updating ROI status:", error);
      throw error;
    }
  };

  const handleAcceptRequest = async (notificationId) => {
    const notification = notifications.find((n) => n.id === notificationId);
    if (!notification) return;
    try {
      if (notification.subType === "ROI") {
        await updateRoiStatus(
          notification,
          "accepted",
          "Approved by " + userRole
        );
      } else {
        // ✅ CORRECTED: Added the 'user' object as the third argument
        await updateBudgetaryStatus(notification, "accepted", user, "");
      }
      onStatusUpdate(notificationId, "accepted");
      setSelectedNotification(null);
      notify({
        title: "Success",
        message: `${notification.subType} request accepted!`,
      });
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error accepting request:", error);
      notify({
        title: "Error",
        message: `Failed to accept request: ${error.message}`,
      });
    }
  };

  const handleRejectRequest = async (notificationId, remarks) => {
    const notification = notifications.find((n) => n.id === notificationId);
    if (!notification) return;
    try {
      if (notification.subType === "ROI") {
        await updateRoiStatus(
          notification,
          "denied",
          remarks || "Rejected by " + userRole
        );
      } else {
        // ✅ CORRECTED: Added the 'user' object as the third argument
        await updateBudgetaryStatus(
          notification,
          "denied",
          user,
          remarks || "Rejected by " + userRole
        );
      }
      onStatusUpdate(notificationId, "denied");
      setSelectedNotification(null);
      notify({
        title: "Success",
        message: `${notification.subType} request rejected!`,
      });
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error rejecting request:", error);
      notify({
        title: "Error",
        message: `Failed to reject request: ${error.message}`,
      });
    }
  };

  const handleBackFromDetail = () => {
    setSelectedNotification(null);
    setListKey((prev) => prev + 1);
  };

  const visibleTabsConfig = useMemo(() => {
    const role = userRole.toLowerCase();
    if (role === "employee")
      return { All: null, Calendar: allTabsConfig.Calendar };
    return {
      All: null,
      Activity: allTabsConfig.Activity,
      Projects: allTabsConfig.Projects,
      Calendar: allTabsConfig.Calendar,
    };
  }, [userRole]);

  const mainTabs = useMemo(
    () => Object.keys(visibleTabsConfig),
    [visibleTabsConfig]
  );

  const mainTabCounts = useMemo(() => {
    const counts = {};
    mainTabs.forEach((tab) => {
      let tabNotifications = notifications.filter(
        (n) =>
          userRole.toLowerCase() !== "admin" ||
          hasNotificationAccess(n, user?.id, accessCheckedNotifications)
      );
      counts[tab] = tabNotifications.filter(
        (n) => n.unread && (tab === "All" || n.type === tab)
      ).length;
    });
    return counts;
  }, [mainTabs, notifications, userRole, user, accessCheckedNotifications]);

  const subTabCounts = useMemo(() => {
    let filtered = notifications.filter(
      (n) =>
        userRole.toLowerCase() !== "admin" ||
        hasNotificationAccess(n, user?.id, accessCheckedNotifications)
    );
    return filtered.reduce((acc, notification) => {
      if (notification.unread && notification.subType) {
        acc[notification.subType] = (acc[notification.subType] || 0) + 1;
      }
      return acc;
    }, {});
  }, [notifications, userRole, user, accessCheckedNotifications]);

  const subTabs = useMemo(() => {
    if (!activeTab || activeTab === "All") return null;
    return visibleTabsConfig[activeTab]?.tabs || null;
  }, [activeTab, visibleTabsConfig]);

  const activitySubTabs = useMemo(() => {
    if (!activeTab || !activeSubTab || activeTab === "All") return null;
    const config = visibleTabsConfig[activeTab]?.subTabsConfig;
    if (!config) return null;
    const subTabsForType = config[activeSubTab];
    if (!subTabsForType) return null;
    if (userRole.toLowerCase() === "admin")
      return subTabsForType.filter(
        (tab) => tab === "Approved" || tab === "Rejected"
      );
    return subTabsForType;
  }, [activeTab, activeSubTab, visibleTabsConfig, userRole]);

  const activitySubTabCounts = useMemo(() => {
    if (!activitySubTabs) return {};
    let filtered = notifications.filter(
      (n) =>
        userRole.toLowerCase() !== "admin" ||
        hasNotificationAccess(n, user?.id, accessCheckedNotifications)
    );
    const counts = {};
    activitySubTabs.forEach((subTab) => {
      counts[subTab] = filtered.filter((n) => {
        if (!n.unread || n.type !== activeTab || n.subType !== activeSubTab)
          return false;
        const status = n.activitySubType || n.budgetarySubType;
        return status === subTab;
      }).length;
    });
    return counts;
  }, [
    activitySubTabs,
    notifications,
    userRole,
    user,
    accessCheckedNotifications,
    activeSubTab,
    activeTab,
  ]);

  const filteredNotifications = useMemo(() => {
    const getSortableTimestamp = (notification) =>
      new Date(
        (notification.budgetarySubType === "Approved" ||
          notification.budgetarySubType === "Rejected" ||
          notification.activitySubType === "Approved" ||
          notification.activitySubType === "Rejected") &&
        notification.updatedAt
          ? notification.updatedAt
          : notification.createdAt || notification.timestamp || 0
      ).getTime();
    const filtered = notifications.filter((n) => {
      if (
        userRole.toLowerCase() === "admin" &&
        !hasNotificationAccess(n, user?.id, accessCheckedNotifications)
      )
        return false;
      if (activeTab !== "All" && n.type !== activeTab) return false;
      if (activeSubTab && n.subType !== activeSubTab) return false;
      if (activeActivitySubTab) {
        const status = n.activitySubType || n.budgetarySubType;
        if (status !== activeActivitySubTab) return false;
      }
      if (showOnlyUnread && !n.unread) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (a.unread !== b.unread) return a.unread ? -1 : 1;
      const timeA = getSortableTimestamp(a);
      const timeB = getSortableTimestamp(b);
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });
  }, [
    activeTab,
    activeSubTab,
    activeActivitySubTab,
    notifications,
    showOnlyUnread,
    userRole,
    user,
    accessCheckedNotifications,
    sortOrder,
  ]);

  const paginatedNotifications = useMemo(
    () => filteredNotifications.slice(0, page * itemsPerPage),
    [filteredNotifications, page]
  );

  useEffect(() => {
    setHasMore(paginatedNotifications.length < filteredNotifications.length);
  }, [paginatedNotifications, filteredNotifications]);

  useEffect(() => {
    if (!listRef.current) return;
    const handleScroll = () => {
      if (
        listRef.current.scrollTop + listRef.current.clientHeight >=
          listRef.current.scrollHeight - 100 &&
        hasMore &&
        !initialLoading &&
        !isCheckingAccess
      ) {
        setPage((prev) => prev + 1);
      }
    };
    listRef.current.addEventListener("scroll", handleScroll);
    return () => {
      if (listRef.current)
        listRef.current.removeEventListener("scroll", handleScroll);
    };
  }, [hasMore, initialLoading, isCheckingAccess]);

  const handleMainTabClick = useCallback(
    debounce((tab) => {
      setActiveTab(tab);
      setPage(1);
      const firstSubTab = visibleTabsConfig[tab]?.tabs?.[0] || null;
      setActiveSubTab(firstSubTab);
      const role = userRole.toLowerCase();
      if (firstSubTab && (tab === "Activity" || tab === "Projects")) {
        const subTabsConfig = visibleTabsConfig[tab]?.subTabsConfig;
        if (subTabsConfig?.[firstSubTab]) {
          setActiveActivitySubTab(role === "admin" ? "Approved" : "Requested");
        } else {
          setActiveActivitySubTab(null);
        }
      } else {
        setActiveActivitySubTab(null);
      }
    }, 100),
    [visibleTabsConfig, userRole]
  );

  const handleSubTabClick = useCallback(
    debounce((subTab) => {
      setActiveSubTab(subTab);
      setPage(1);
      const role = userRole.toLowerCase();
      const subTabsConfig = visibleTabsConfig[activeTab]?.subTabsConfig;
      if (subTabsConfig?.[subTab]) {
        setActiveActivitySubTab(role === "admin" ? "Approved" : "Requested");
      } else {
        setActiveActivitySubTab(null);
      }
    }, 100),
    [visibleTabsConfig, userRole, activeTab]
  );

  const handleActivitySubTabClick = useCallback((subTab) => {
    setActiveActivitySubTab(subTab);
    setPage(1);
  }, []);

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute top-full right-[-1.2vw] mt-4 w-[35vw] bg-white rounded-xl shadow-2xl border border-gray-200 z-30 overflow-visible">
        <div
          className="absolute -top-2 right-[1.5vw] w-[1.8vw] h-[1.8vw] transform rotate-45 bg-white border-t border-l border-gray-200"
          aria-hidden="true"
        />

        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-[1.2vw] font-bold text-gray-800">
            Notifications
          </h2>
          <div className="flex items-center gap-[1vw]">
            <button
              onClick={() =>
                setSortOrder(sortOrder === "newest" ? "oldest" : "newest")
              }
              className="flex items-center cursor-pointer gap-[0.3vw] px-[0.6vw] py-[0.3vh] text-[0.8vw] text-gray-600 hover:text-gray-900 rounded-lg transition-colors"
              title={sortOrder === "newest" ? "Newest first" : "Oldest first"}
            >
              <svg
                className={`w-[1vw] h-[1vw] transition-transform ${
                  sortOrder === "oldest" ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                />
              </svg>
              {sortOrder === "newest" ? "Sort: Asc" : "Sort: Des"}
            </button>
            <ToggleSwitch
              isChecked={showOnlyUnread}
              onToggle={() => {
                setShowOnlyUnread(!showOnlyUnread);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="max-h-[55vh] min-h-[40vh] flex flex-col overflow-hidden">
          {initialLoading || isCheckingAccess ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[40vh]">
              <div className="w-[3vw] h-[3vw] border-[0.3vw] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 mt-[1vh] text-[0.9vw] font-medium">
                {isCheckingAccess
                  ? "Checking access..."
                  : "Loading notifications..."}
              </p>
            </div>
          ) : selectedNotification ? (
            <NotificationDetailView
              notification={selectedNotification}
              onBack={handleBackFromDetail}
              onAccept={handleAcceptRequest}
              onReject={handleRejectRequest}
              userRole={userRole}
              user={user}
              notify={notify}
              onMarkAsRead={markAdminNotificationAsRead}
            />
          ) : (
            <div
              key={listKey}
              className="animate-fade-in flex flex-col flex-1 min-h-0"
            >
              <div className="flex-shrink-0">
                <TabsBar
                  tabs={mainTabs}
                  activeTab={activeTab}
                  onTabClick={handleMainTabClick}
                  counts={mainTabCounts}
                />
                {subTabs && (
                  <div className="pt-0">
                    <TabsBar
                      tabs={subTabs}
                      activeTab={activeSubTab}
                      onTabClick={handleSubTabClick}
                      isSubTabs={true}
                      counts={subTabCounts}
                    />
                  </div>
                )}
                {activitySubTabs && (
                  <ChipTabsBar
                    tabs={activitySubTabs}
                    activeTab={activeActivitySubTab}
                    onTabClick={handleActivitySubTabClick}
                    counts={activitySubTabCounts}
                  />
                )}
              </div>
              <div
                ref={listRef}
                className="flex-1 overflow-y-auto min-h-0"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#CBD5E0 #F7FAFC",
                }}
              >
                {paginatedNotifications.length > 0 ? (
                  <>
                    {paginatedNotifications.map((notification, index) => (
                      <NotificationListItem
                        key={notification.id}
                        notification={notification}
                        index={index}
                        onClick={() => setSelectedNotification(notification)}
                        userRole={userRole}
                        activeTab={activeTab}
                      />
                    ))}
                    {hasMore && (
                      <div className="flex justify-center p-2">
                        <div className="w-[2vw] h-[2vw] border-[0.2vw] border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <svg
                      className="w-[4vw] h-[4vw] text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    <h3 className="mt-2 text-[1vw] font-semibold text-gray-800">
                      No Notifications Here
                    </h3>
                    <p className="mt-1 text-[0.8vw] text-gray-500">
                      You're all caught up! There are no notifications that
                      match your current filters.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
