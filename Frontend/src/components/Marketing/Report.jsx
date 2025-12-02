import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Eye,
  Clock,
  X,
  AlertCircle,
} from "lucide-react";


const RECORDS_PER_PAGE = 8;
const API_REPORT_TASKS = `${import.meta.env.VITE_API_BASE_URL}/marketing/report-tasks`;


// ---------- helpers ----------


// get logged-in user info from sessionStorage
const getLoggedInUser = () => {
  const raw = sessionStorage.getItem("user");
  console.log("RAW session user in Report.jsx:", raw); // DEBUG


  if (!raw) {
    return { employeeId: null, employeeName: null };
  }


  let userData = {};
  try {
    userData = JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse session user JSON:", e);
    return { employeeId: null, employeeName: null };
  }


  // use userName as employeeId (your example object)
  const employeeId = userData.userName || null;
  const employeeName = userData.employeeName || null;


  console.log("Parsed user in Report.jsx:", { employeeId, employeeName }); // DEBUG


  return { employeeId, employeeName };
};



// MySQL/ISO -> "DD/MM/YYYY"
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB");
};


const isTaskOverdue = (taskDate, timeRange) => {
  if (!taskDate) return false;
  const [day, month, year] = taskDate.split("/");
  const d = new Date(year, month - 1, day);
  d.setHours(0, 0, 0, 0);


  const today = new Date();
  today.setHours(0, 0, 0, 0);


  if (timeRange === "today") return d < today;


  if (timeRange === "weekly") {
    const currentDay = today.getDay();
    const monday = new Date(today);
    const diff = currentDay === 0 ? 6 : currentDay - 1;
    monday.setDate(today.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    return d < monday;
  }


  if (timeRange === "monthly") {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    first.setHours(0, 0, 0, 0);
    return d < first;
  }


  return false;
};


// ---------- Modal ----------


const AddReportModal = ({ isOpen, onClose, task, onSuccess, isCompleted }) => {
  const [showHistory, setShowHistory] = useState(isCompleted);
  const [formData, setFormData] = useState({
    progress: "",
    status: "In Progress",
    remarks: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [history, setHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);


// In AddReportModal component, update the useEffect:

useEffect(() => {
  if (task && isOpen) {
    setFormData({
      progress: task.progress || "",
      status: task.status || "In Progress",
      remarks: "",
    });
    setShowHistory(isCompleted);
    setHistory([]);
    
    // ✅ Auto-fetch history when opening a completed task
    if (isCompleted && task?.id) {
      fetchHistory(task.id);
    }
  }
}, [task, isOpen, isCompleted]);


  if (!isOpen) return null;


  const getMinPercentage = () => task?.progress || 0;


  const handlePercentageChange = (e) => {
    const value = e.target.value;
    const min = getMinPercentage();
    const errors = { ...validationErrors };


    if (value === "") {
      delete errors.progress;
    } else {
      const n = Number(value);
      if (n < min || n > 100) {
        errors.progress = `Please enter percentage between ${min} to 100`;
      } else {
        delete errors.progress;
      }
    }


    setValidationErrors(errors);
    const newStatus = Number(value) === 100 ? "Completed" : formData.status;
    setFormData((prev) => ({ ...prev, progress: value, status: newStatus }));
  };


  const handleStatusChange = (status) => {
    const progress = status === "Completed" ? 100 : formData.progress;
    const errors = { ...validationErrors };


    if (status === "Completed" && Number(progress) !== 100) {
      errors.progress = "Completed status requires 100% progress";
    } else {
      delete errors.progress;
    }


    setValidationErrors(errors);
    setFormData((prev) => ({ ...prev, status, progress }));
  };


  const validateForm = () => {
    const errors = {};
    const min = getMinPercentage();
    const pct = Number(formData.progress);


    if (formData.progress === "") {
      errors.progress = "Percentage is required";
    } else if (pct < min || pct > 100) {
      errors.progress = `Please enter percentage between ${min} to 100`;
    }


    if (formData.status === "Completed" && pct !== 100) {
      errors.progress = "Completed status requires 100% progress";
    }


    if (!formData.remarks.trim()) {
      errors.remarks = "Remarks is required";
    }


    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const getCurrentDateTime = () => {
    const now = new Date();
    return now
      .toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .replace(",", " |");
  };


  const fetchHistory = async (taskId) => {
    if (!taskId) return;
    try {
      setIsHistoryLoading(true);
      const res = await fetch(`${API_REPORT_TASKS}/${taskId}/history`);
      const data = await res.json();
      if (data.status) setHistory(data.history || []);
      else setHistory([]);
    } catch (e) {
      console.error("History load error:", e);
      setHistory([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!task?.id) return;


    const { employeeId, employeeName } = getLoggedInUser();
    if (!employeeId || !employeeName) {
      alert("Login user not found in sessionStorage");
      return;
    }


    setIsSubmitting(true);
    try {
      const body = {
        progress: Number(formData.progress),
        status: formData.status,
        remarks: formData.remarks,
        employee_id: employeeId,
        employee_name: employeeName,
      };


      const res = await fetch(`${API_REPORT_TASKS}/${task.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.status) {
        console.error("Report save error:", data.message);
        alert(data.message || "Failed to save report");
      } else {
        onSuccess?.(body);
      }
    } catch (err) {
      console.error("Report save error:", err);
      alert("Failed to save report");
    } finally {
      setIsSubmitting(false);
      setFormData({ progress: "", status: "In Progress", remarks: "" });
      setValidationErrors({});
      setShowHistory(false);
      setHistory([]);
      onClose();
    }
  };


  const handleClose = () => {
    setFormData({ progress: "", status: "In Progress", remarks: "" });
    setValidationErrors({});
    setShowHistory(false);
    setHistory([]);
    onClose();
  };


  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[55vw] max-h-[90vh] overflow-hidden shadow-xl">
        {!showHistory ? (
          <>
            <div className="bg-gray-100 px-[1.5vw] py-[1vw] flex justify-between items-center border-b">
              <div>
                <h2 className="text-[1.1vw] font-semibold text-gray-800">
                  Marketing Report
                </h2>
                <p className="text-[0.8vw] text-gray-600">{getCurrentDateTime()}</p>
              </div>
              <button onClick={handleClose} className="text-gray-600 hover:text-gray-800">
                <X size={"1.5vw"} />
              </button>
            </div>


            <form onSubmit={handleSubmit} className="p-[1.5vw]">
              <div className="mb-[1vw] space-y-[0.5vw]">
                <div>
                  <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                    Task Name
                  </label>
                  <input
                    type="text"
                    value={task?.task_name || ""}
                    disabled
                    className="w-full px-[0.8vw] py-[0.5vw] border border-gray-300 rounded-lg text-[0.85vw] bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                    Task Description
                  </label>
                  <input
                    type="text"
                    value={task?.task_description || ""}
                    disabled
                    className="w-full px-[0.8vw] py-[0.5vw] border border-gray-300 rounded-lg text-[0.85vw] bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>
              </div>


              <div className="grid grid-cols-2 gap-[1vw] mb-[1vw]">
                <div>
                  <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                    Progress (%)
                  </label>
                  <input
                    type="number"
                    min={getMinPercentage()}
                    max="100"
                    value={formData.progress}
                    onChange={handlePercentageChange}
                    className={`w-full px-[0.8vw] py-[0.5vw] border rounded-lg text-[0.85vw] focus:outline-none focus:ring-2 ${
                      validationErrors.progress
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    placeholder="Enter progress percentage"
                  />
                  {validationErrors.progress && (
                    <p className="text-red-500 text-[0.7vw] mt-[0.3vw]">
                      {validationErrors.progress}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full px-[0.8vw] py-[0.5vw] border border-gray-300 rounded-lg text-[0.85vw] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>


              <div className="mb-[1vw]">
                <label className="block text-[0.85vw] font-medium text-gray-700 mb-[0.3vw]">
                  Remarks
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, remarks: e.target.value }))
                  }
                  className={`w-full px-[0.8vw] py-[0.5vw] border rounded-lg text-[0.85vw] min-h-[6vw] resize-none focus:outline-none focus:ring-2 ${
                    validationErrors.remarks
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  placeholder="Add remarks"
                />
                {validationErrors.remarks && (
                  <p className="text-red-500 text-[0.7vw] mt-[0.3vw]">
                    {validationErrors.remarks}
                  </p>
                )}
              </div>


              <div className="flex justify-between items-center pt-[1vw] border-t">
                <button
                  type="button"
                  onClick={async () => {
                    if (task?.id) await fetchHistory(task.id);
                    setShowHistory(true);
                  }}
                  className="flex items-center gap-[0.3vw] text-[0.85vw] text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <Clock size={"1vw"} />
                  History
                </button>
                <div className="flex gap-[0.5vw]">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-[1.2vw] py-[0.5vw] bg-gray-200 text-gray-700 rounded-lg text-[0.85vw] hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-[1.2vw] py-[0.5vw] bg-blue-600 text-white rounded-lg text-[0.85vw] hover:bg-blue-700 flex items-center gap-[0.3vw] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-[0.9vw] w-[0.9vw] border-b-2 border-white" />
                        Submitting...
                      </>
                    ) : (
                      "Submit"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="bg-gray-100 px-[1.5vw] py-[1vw] flex justify-between items-center border-b">
              <div>
                <h2 className="text-[1.1vw] font-semibold text-gray-800">
                  Marketing Report
                </h2>
                <p className="text-[0.8vw] text-gray-600">{getCurrentDateTime()}</p>
              </div>
              <button onClick={handleClose} className="text-gray-600 hover:text-gray-800">
                <X size={"1.5vw"} />
              </button>
            </div>


            <div className="p-[1.5vw] max-h-[70vh] overflow-auto">
              <h3 className="text-[1vw] font-semibold mb-[1vw] text-gray-800">
                Previous Reports
              </h3>
              {isHistoryLoading ? (
                <div className="text-center py-[3vw] text-gray-500 text-[0.9vw]">
                  Loading history...
                </div>
              ) : history.length ? (
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-[0.8vw] py-[0.5vw] text-[0.85vw] border-b text-left">
                          S.No
                        </th>
                        <th className="px-[0.8vw] py-[0.5vw] text-[0.85vw] border-b text-left">
                          Employee
                        </th>
                        <th className="px-[0.8vw] py-[0.5vw] text-[0.85vw] border-b text-left">
                          Progress
                        </th>
                        <th className="px-[0.8vw] py-[0.5vw] text-[0.85vw] border-b text-left">
                          Status
                        </th>
                        <th className="px-[0.8vw] py-[0.5vw] text-[0.85vw] border-b text-left">
                          Remarks
                        </th>
                        <th className="px-[0.8vw] py-[0.5vw] text-[0.85vw] border-b text-left">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h, i) => (
                        <tr key={h.id} className="hover:bg-gray-50">
                          <td className="px-[0.8vw] py-[0.5vw] text-[0.85vw] border-b">
                            {i + 1}
                          </td>
                          <td className="px-[0.8vw] py-[0.5vw] text-[0.85vw] border-b">
                            {h.employee_name} ({h.employee_id})
                          </td>
                          <td className="px-[0.8vw] py-[0.5vw] text-[0.85vw] border-b">
                            {h.progress}%
                          </td>
                          <td className="px-[0.8vw] py-[0.5vw] text-[0.85vw] border-b">
                            {h.status}
                          </td>
                          <td className="px-[0.8vw] py-[0.5vw] text-[0.85vw] border-b">
                            {h.remarks}
                          </td>
                          <td className="px-[0.8vw] py-[0.5vw] text-[0.85vw] border-b">
                            {h.submitted_at}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-[3vw] text-gray-500 text-[0.9vw]">
                  No previous reports found
                </div>
              )}
            </div>


            <div className="px-[1.5vw] py-[1vw] border-t flex justify-end">
              <button
                onClick={handleClose}
                className="flex items-center gap-[0.3vw] px-[1.2vw] py-[0.5vw] text-[0.85vw] bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};


// ---------- main Report ----------


const Report = () => {
  const [timeRange, setTimeRange] = useState("today");
  const [subTab, setSubTab] = useState("inProgress");
  const [tasks, setTasks] = useState({
    today: { inProgress: [], completed: [] },
    weekly: { inProgress: [], completed: [] },
    monthly: { inProgress: [], completed: [] },
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isLoading, setIsLoading] = useState(false);


  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const employeeName = userData.employeeName || null;


  useEffect(() => {
  if (!employeeName) return;

  const load = async () => {
    try {
      setIsLoading(true);

      const fetchJson = async (url) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data.status) throw new Error(data.message || "API error");
        return data.tasks;
      };

      const todayIso = new Date().toISOString().split("T")[0];

      const [con, todaySeq, weeklySeq, monthlySeq] = await Promise.all([
        // concurrent only for today
        fetchJson(
          `${API_REPORT_TASKS}?employee_name=${encodeURIComponent(
            employeeName
          )}&task_type=CONCURRENT&task_date=${todayIso}`
        ),
        // sequential today
        fetchJson(
          `${API_REPORT_TASKS}?employee_name=${encodeURIComponent(
            employeeName
          )}&task_type=SEQUENTIAL&seq_range=TODAY`
        ),
        // sequential weekly
        fetchJson(
          `${API_REPORT_TASKS}?employee_name=${encodeURIComponent(
            employeeName
          )}&task_type=SEQUENTIAL&seq_range=WEEKLY`
        ),
        // sequential monthly
        fetchJson(
          `${API_REPORT_TASKS}?employee_name=${encodeURIComponent(
            employeeName
          )}&task_type=SEQUENTIAL&seq_range=MONTHLY`
        ),
      ]);

      // ✅ FIX: Use actual progress and status from backend
      const mapTask = (t) => ({
        id: t.marketing_task_id,
        date: formatDate(t.task_date || t.created_at),
        task_name: t.task_name,
        task_description: t.task_description,
        progress: t.emp_progress || 0,  // ✅ Use emp_progress
        status: t.emp_status || "In Progress",  // ✅ Use emp_status
      });

      // ✅ FIX: Separate tasks into inProgress and completed
      const separateTasks = (tasks) => {
        const inProgress = [];
        const completed = [];
        
        tasks.forEach(task => {
          if (task.status === "Completed") {
            completed.push(task);
          } else {
            inProgress.push(task);
          }
        });
        
        return { inProgress, completed };
      };

      const todayList = [...con, ...todaySeq].map(mapTask);
      const weeklyList = weeklySeq.map(mapTask);
      const monthlyList = monthlySeq.map(mapTask);

      const todayTasks = separateTasks(todayList);
      const weeklyTasks = separateTasks(weeklyList);
      const monthlyTasks = separateTasks(monthlyList);

      setTasks({
        today: todayTasks,
        weekly: weeklyTasks,
        monthly: monthlyTasks,
      });
    } catch (err) {
      console.error("Report load error", err);
    } finally {
      setIsLoading(false);
    }
  };

  load();
}, [employeeName]);


  const getTimeTabs = () => [
    { key: "today", label: "Today" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
  ];


  const getSubTabs = () => [
    { key: "inProgress", label: "In Progress" },
    { key: "completed", label: "Completed" },
  ];


  const getSortedTasks = (list) => {
    const copy = [...list];
    copy.sort((a, b) => {
      const aOver = isTaskOverdue(a.date, timeRange);
      const bOver = isTaskOverdue(b.date, timeRange);
      if (aOver && !bOver) return -1;
      if (!aOver && bOver) return 1;


      const [da, ma, ya] = a.date.split("/");
      const [db, mb, yb] = b.date.split("/");
      return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
    });
    return copy;
  };


  const currentTasks = getSortedTasks(tasks[timeRange][subTab] || []);
  const totalPages = Math.max(1, Math.ceil(currentTasks.length / RECORDS_PER_PAGE));
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const endIndex = startIndex + RECORDS_PER_PAGE;
  const paginatedTasks = currentTasks.slice(startIndex, endIndex);


  const handlePrevious = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));


  const handleAddReport = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };


  const handleSuccess = (data) => {
    const stamp = new Date()
      .toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .replace(",", " |");


    setTasks((prev) => {
      const copy = structuredClone(prev);
      const list = copy[timeRange][subTab];
      const idx = list.findIndex((t) => t.id === selectedTask.id);
      if (idx === -1) return prev;
      const t = list[idx];
      t.progress = data.progress;
      t.status = data.status;
      t.last_report_at = stamp;


      if (data.status === "Completed") {
        list.splice(idx, 1);
        copy[timeRange].completed.push(t);
        setSubTab("completed");
      }
      return copy;
    });
  };


  return (
    <div className="text-black min-h-[92%] max-h-[100%] w-[100%] max-w-[100%] overflow-hidden">
      <div className="w-[100%] h-[91vh] flex flex-col gap-[1vh]">
        {/* time tabs */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm h-[6%] flex-shrink-0">
          <div className="flex border-b border-gray-200 overflow-x-auto h-full">
            {getTimeTabs().map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setTimeRange(t.key);
                  setSubTab("inProgress");
                  setCurrentPage(1);
                }}
                className={`px-[1.2vw] cursor-pointer font-medium text-[0.85vw] whitespace-nowrap transition-colors ${
                  timeRange === t.key
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>


        {/* sub tabs */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm h-[6%] flex-shrink-0">
          <div className="flex border-b border-gray-200 overflow-x-auto h-full">
            {getSubTabs().map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setSubTab(t.key);
                  setCurrentPage(1);
                }}
                className={`px-[1.2vw] cursor-pointer font-medium text-[0.85vw] whitespace-nowrap transition-colors ${
                  subTab === t.key
                    ? "border-b-2 border-black text-black"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>


        {/* content */}
        <div className="bg-white rounded-xl shadow-sm h-[86%] flex flex-col">
          <div className="flex items-center justify-between p-[0.8vw] h-[10%] flex-shrink-0">
            <div className="flex items-center gap-[0.5vw]">
              <span className="font-medium text-[0.95vw] text-gray-800">
                All Tasks
              </span>
              <span className="text-[0.85vw] text-gray-500">
                ({currentTasks.length})
              </span>
            </div>
          </div>


          <div className="flex-1 min-h-0 relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10">
                <div className="flex items-center gap-[0.5vw]">
                  <div className="animate-spin rounded-full h-[1.5vw] w-[1.5vw] border-b-2 border-gray-900" />
                  <span className="text-[0.95vw] text-gray-700 font-medium">
                    Loading...
                  </span>
                </div>
              </div>
            )}


            {currentTasks.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <svg
                  className="w-[5vw] h-[5vw] mb-[1vw] text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="text-[1.1vw] font-medium mb-[0.5vw]">
                  No tasks found
                </p>
                <p className="text-[1vw] text-gray-400">
                  No tasks available in this category
                </p>
              </div>
            ) : (
              <div className="h-full mr-[0.8vw] mb-[0.8vw] ml-[0.8vw] border border-gray-300 rounded-xl overflow-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-[#E2EBFF] sticky top-0">
                    <tr>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 w-[5%]">
                        S.NO
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 w-[10%]">
                        Date
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 w-[20%]">
                        Task Name
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 w-[30%]">
                        Task Description
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 w-[10%]">
                        Progress
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300 w-[15%]">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTasks.map((task, index) => {
                      const overdue =
                        subTab === "inProgress" &&
                        isTaskOverdue(task.date, timeRange);
                      return (
                        <tr
                          key={task.id}
                          className={`transition-colors ${
                            overdue
                              ? "bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-center text-gray-900 border border-gray-300">
                            {startIndex + index + 1}
                          </td>
                          <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-center border border-gray-300">
                            <div className="flex items-center justify-center gap-[0.3vw]">
                              {overdue && (
                                <AlertCircle
                                  size={"1vw"}
                                  className="text-red-600"
                                />
                              )}
                              <span
                                className={
                                  overdue
                                    ? "text-red-600 font-semibold"
                                    : "text-gray-900"
                                }
                              >
                                {task.date}
                              </span>
                            </div>
                          </td>
                          <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] font-medium text-gray-900 border border-gray-300">
                            {task.task_name}
                          </td>
                          <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-600 border border-gray-300">
                            {task.task_description}
                          </td>
                          <td className="px-[0.7vw] py-[0.56vw] border border-gray-300">
                            <div className="flex items-center justify-center gap-[0.5vw]">
                              <div className="relative w-[5vw] h-[0.8vw] bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    overdue ? "bg-red-600" : "bg-blue-600"
                                  }`}
                                  style={{ width: `${task.progress || 0}%` }}
                                />
                              </div>
                              <span
                                className={`text-[0.8vw] font-semibold ${
                                  overdue ? "text-red-600" : "text-blue-600"
                                }`}
                              >
                                {task.progress || 0}%
                              </span>
                            </div>
                          </td>
                          <td className="px-[0.7vw] py-[0.56vw] border border-gray-300">
                            <div className="flex justify-center">
                              {subTab === "completed" ? (
                                <button
                                  onClick={() => handleAddReport(task)}
                                  className="px-[0.8vw] py-[0.35vw] flex items-center gap-[0.3vw] text-[0.86vw] font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                                >
                                  <Eye size={"0.9vw"} />
                                  View Report
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleAddReport(task)}
                                  className="px-[0.8vw] py-[0.35vw] flex items-center gap-[0.3vw] text-[0.86vw] font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 cursor-pointer"
                                >
                                  <Plus size={"0.9vw"} />
                                  Add Report
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>


          {currentTasks.length > 0 && (
            <div className="flex items-center justify-between px-[0.8vw] py-[0.5vw] h-[10%] flex-shrink-0">
              <div className="text-[0.85vw] text-gray-600">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, currentTasks.length)} of{" "}
                {currentTasks.length} entries
              </div>
              <div className="flex items-center gap-[0.5vw]">
                <button
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  className="px-[0.8vw] py-[0.4vw] flex items-center gap-[0.3vw] bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-[0.85vw]"
                >
                  <ChevronLeft size={"1vw"} />
                  Previous
                </button>
                <span className="text-[0.85vw] text-gray-600 px-[0.5vw]">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  className="px-[0.8vw] py-[0.4vw] flex items-center gap-[0.3vw] bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-[0.85vw]"
                >
                  Next
                  <ChevronRight size={"1vw"} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>


      <AddReportModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onSuccess={handleSuccess}
        isCompleted={subTab === "completed"}
      />
    </div>
  );
};


export default Report;