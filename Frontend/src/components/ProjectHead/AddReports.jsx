import React, { useEffect, useState } from "react";
import { Edit, Trash2, Save, X } from "lucide-react";
import { useConfirm } from "../ConfirmContext";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/marketing-tasks`;
const API_EMPLOYEES = `${
  import.meta.env.VITE_API_BASE_URL
}/marketing/employees-list`;

// Notification Component
const Notification = ({ title, message, duration = 5000, onClose }) => {
  const [progress, setProgress] = useState(100);

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
    Delete: {
      border: "border-orange-400 border-[2px]",
      bg: "bg-orange-50",
      text: "text-orange-800",
      circle: "bg-orange-500",
      icon: "✔",
    },
    Info: {
      border: "border-blue-400 border-[2px]",
      bg: "bg-blue-50",
      text: "text-blue-800",
      circle: "bg-blue-500",
      icon: "ℹ",
    },
  };

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

  const styles = typeStyles[title];

  return (
    <div className="fixed top-[0.8vw] right-[0.8vw] z-50">
      <div
        className={`flex items-center gap-[0.7vw] p-[0.7vw] rounded-[0.8vw] shadow-lg w-[22vw] relative border ${styles.bg} ${styles.border} ${styles.text}`}
      >
        <div
          className={`flex items-center justify-center w-[2vw] h-[2vw] rounded-full ${styles.circle}`}
        >
          <span className="text-white text-[0.8vw] font-bold">
            {styles.icon}
          </span>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-black text-[0.9vw]">{title}</p>
          <p className="text-[0.8vw] opacity-90 text-gray-600 whitespace-pre-line">
            {message}
          </p>
        </div>
        <button
          className="text-[0.95vw] font-bold px-[0.4vw] text-gray-600 cursor-pointer hover:text-gray-800"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// Multi-Select Employee Component
const MultiSelectEmployee = ({
  employees,
  selectedEmployees,
  setSelectedEmployees,
  label = "Employee",
}) => {
  const handleSelect = (e) => {
    const id = e.target.value;
    if (!id) return;

    const emp = employees.find((x) => x.employee_id === id);
    if (emp && !selectedEmployees.some((s) => s.employee_id === id)) {
      setSelectedEmployees([...selectedEmployees, emp]);
    }
    e.target.value = ""; // Reset dropdown
  };

  const handleRemove = (empId) => {
    setSelectedEmployees(
      selectedEmployees.filter((e) => e.employee_id !== empId)
    );
  };

  // Filter out already selected employees from dropdown
  const availableEmployees = employees.filter(
    (emp) =>
      emp.employee_id &&
      !selectedEmployees.some((s) => s.employee_id === emp.employee_id)
  );

  return (
    <div className="flex flex-col">
      <label className="text-[0.75vw] font-semibold text-[#4B5563] mb-[0.2vw]">
        {label}
      </label>

      {/* Single-click dropdown */}
      <select
        value=""
        onChange={handleSelect}
        className="px-[0.7vw] py-[0.45vw] text-[0.85vw] border border-[#D1D5DB] rounded-[0.35vw] outline-none focus:border-[#2563EB] cursor-pointer"
      >
        <option value="">Select Employee</option>
        {availableEmployees.map((emp) => (
          <option key={emp.employee_id} value={emp.employee_id}>
            {emp.employee_name}
          </option>
        ))}
      </select>

      {/* Selected employees chips */}
      {selectedEmployees.length > 0 && (
        <div className="mt-[0.5vw] p-[0.5vw] border border-[#2563EB]/30 rounded-[0.35vw] bg-[#EFF6FF] max-h-[8vw] overflow-y-auto">
          <div className="flex flex-wrap gap-[0.3vw]">
            {selectedEmployees.map((emp) => (
              <div
                key={emp.employee_id}
                className="flex items-center gap-[0.3vw] bg-white border border-[#2563EB]/30 rounded-[0.3vw] px-[0.5vw] py-[0.25vw] text-[0.75vw] shadow-sm"
              >
                <span className="text-[#374151] font-medium">
                  {emp.employee_name}
                </span>
                <button
                  onClick={() => handleRemove(emp.employee_id)}
                  className="ml-[0.2vw] text-[#6B7280] hover:text-[#EF4444] hover:bg-[#FEE2E2] rounded-full p-[0.1vw] transition-all"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="mt-[0.3vw] text-[0.7vw] text-[#2563EB] font-medium">
            {selectedEmployees.length} employee
            {selectedEmployees.length !== 1 ? "s" : ""} selected
          </div>
        </div>
      )}
    </div>
  );
};

const ReportTasks = () => {
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState("concurrent");
  const [seqRange, setSeqRange] = useState("today");

  // Notification
  const [notification, setNotification] = useState(null);

  // Loading
  const [isLoading, setIsLoading] = useState(true);

  // Date
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Employees list from API
  const [employees, setEmployees] = useState([]);

  // Multi-select employees for Concurrent
  const [selectedConcurrentEmployees, setSelectedConcurrentEmployees] =
    useState([]);

  // Multi-select employees for Sequential
  const [selectedSequentialEmployees, setSelectedSequentialEmployees] =
    useState([]);

  // Category
  const [categories, setCategories] = useState([]);
  const [categoryInput, setCategoryInput] = useState("");
  const [categorySuggestions, setCategorySuggestions] = useState([]);

  // Concurrent
  const [concurrentTasks, setConcurrentTasks] = useState([]);
  const [concurrentTaskName, setConcurrentTaskName] = useState("");
  const [concurrentTaskDescription, setConcurrentTaskDescription] =
    useState("");
  const [editingConcurrentId, setEditingConcurrentId] = useState(null);
  const [editConcurrentData, setEditConcurrentData] = useState(null);
  // Add this with other concurrent states
  const [concurrentDeadlineTime, setConcurrentDeadlineTime] =
    useState("MORNING");

  // Sequential
  const [todayTasks, setTodayTasks] = useState([]);
  const [weeklyTasks, setWeeklyTasks] = useState([]);
  const [monthlyTasks, setMonthlyTasks] = useState([]);
  const [sequentialTaskName, setSequentialTaskName] = useState("");
  const [sequentialTaskDescription, setSequentialTaskDescription] =
    useState("");
  const [editingSequentialId, setEditingSequentialId] = useState(null);
  const [editSequentialData, setEditSequentialData] = useState(null);
  const [deadlineTime, setDeadlineTime] = useState("MORNING");
  const [deadlineDate, setDeadlineDate] = useState("");

  const [assignmentChanges, setAssignmentChanges] = useState({});

  // Show notification helper
  const showNotification = (title, message) => {
    setNotification({ title, message });
  };

  // Helpers for current sequential list
  const getCurrentTaskList = () => {
    if (seqRange === "today") return todayTasks;
    if (seqRange === "weekly") return weeklyTasks;
    return monthlyTasks;
  };
  const setCurrentTaskList = (updater) => {
    if (seqRange === "today") setTodayTasks(updater);
    else if (seqRange === "weekly") setWeeklyTasks(updater);
    else setMonthlyTasks(updater);
  };
  const sequentialTasks = getCurrentTaskList();
  const totalSequentialCount =
    todayTasks.length + weeklyTasks.length + monthlyTasks.length;

  const fetchJson = async (url, options = {}) => {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };

  // Category helpers
  const updateCategorySuggestions = (value) => {
    const v = value.trim().toLowerCase();
    if (!v) {
      setCategorySuggestions([]);
      return;
    }
    const filtered = categories.filter((c) => c.toLowerCase().startsWith(v));
    setCategorySuggestions(filtered);
  };
  const handleCategoryChange = (v) => {
    setCategoryInput(v);
    updateCategorySuggestions(v);
  };
  const handleCategorySelect = (v) => {
    setCategoryInput(v);
    setCategorySuggestions([]);
  };

  // Load employees + tasks
  useEffect(() => {
    const loadAll = async () => {
      try {
        setIsLoading(true);

        // employees
        try {
          const empData = await fetchJson(API_EMPLOYEES);
          if (empData.status) {
            const list = empData.employees || [];
            setEmployees(list);
          }
        } catch (err) {
          console.error("Load employees error", err);
          showNotification("Error", "Failed to load employees");
        }

        // tasks
        try {
          const [con, today, weekly, monthly] = await Promise.all([
            fetchJson(`${API_BASE}?task_type=CONCURRENT`),
            fetchJson(`${API_BASE}?task_type=SEQUENTIAL&seq_range=TODAY`),
            fetchJson(`${API_BASE}?task_type=SEQUENTIAL&seq_range=WEEKLY`),
            fetchJson(`${API_BASE}?task_type=SEQUENTIAL&seq_range=MONTHLY`),
          ]);

          setConcurrentTasks(con || []);
          setTodayTasks(today || []);
          setWeeklyTasks(weekly || []);
          setMonthlyTasks(monthly || []);

          const all = [
            ...(con || []),
            ...(today || []),
            ...(weekly || []),
            ...(monthly || []),
          ];
          const uniq = Array.from(
            new Set(all.map((t) => t.category).filter(Boolean))
          );
          setCategories(uniq);
        } catch (err) {
          console.error("Load tasks error", err);
          showNotification("Error", "Failed to load tasks");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadAll();
  }, []);

  // Get creator name from sessionStorage
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const createdByName = userData.employeeName || null;

  // ===================== CREATE CONCURRENT =====================
  const handleAddConcurrentTask = async () => {
    if (
      !concurrentTaskName.trim() ||
      !concurrentTaskDescription.trim() ||
      selectedConcurrentEmployees.length === 0
    ) {
      showNotification(
        "Warning",
        "Please fill all required fields and select at least one employee"
      );
      return;
    }

    const body = {
      task_name: concurrentTaskName.trim(),
      task_description: concurrentTaskDescription.trim(),
      task_type: "CONCURRENT",
      seq_range: null,
      category: categoryInput.trim() || null,
      assign_status: "ASSIGN",
      created_by: createdByName,
      task_date: selectedDate,
      deadline_time: concurrentDeadlineTime, // NEW
      deadline_date: null, // NULL for concurrent
      employees: selectedConcurrentEmployees.map((emp) => ({
        employee_id: emp.employee_id,
        employee_name: emp.employee_name,
      })),
    };

    try {
      const res = await fetchJson(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const ids = res.ids || [];
      const newTasks = selectedConcurrentEmployees.map((emp, idx) => ({
        marketing_task_id: ids[idx] || Date.now() + idx,
        task_name: body.task_name,
        task_description: body.task_description,
        task_type: body.task_type,
        seq_range: body.seq_range,
        employee_id: emp.employee_id,
        employee_name: emp.employee_name,
        category: body.category,
        assign_status: body.assign_status,
        task_date: body.task_date,
        deadline_time: body.deadline_time, // NEW
        deadline_date: body.deadline_date, // NEW
      }));

      setConcurrentTasks((prev) => [...newTasks, ...prev]);

      if (body.category && !categories.includes(body.category)) {
        setCategories((prev) => [...prev, body.category]);
      }

      // Reset form
      setConcurrentTaskName("");
      setConcurrentTaskDescription("");
      setCategoryInput("");
      setCategorySuggestions([]);
      setSelectedConcurrentEmployees([]);
      setSelectedDate(new Date().toISOString().split("T")[0]);
      setConcurrentDeadlineTime("MORNING"); // NEW

      showNotification(
        "Success",
        `Task added for ${newTasks.length} employee${
          newTasks.length > 1 ? "s" : ""
        }`
      );
    } catch (err) {
      console.error("Create concurrent error", err);
      showNotification("Error", "Failed to add task");
    }
  };

  // ===================== CREATE SEQUENTIAL =====================
  const handleAddSequentialTask = async () => {
    if (
      !sequentialTaskName.trim() ||
      !sequentialTaskDescription.trim() ||
      selectedSequentialEmployees.length === 0
    ) {
      showNotification(
        "Warning",
        "Please fill all required fields and select at least one employee"
      );
      return;
    }

    const seqValue =
      seqRange === "today"
        ? "TODAY"
        : seqRange === "weekly"
        ? "WEEKLY"
        : "MONTHLY";

    const body = {
      task_name: sequentialTaskName.trim(),
      task_description: sequentialTaskDescription.trim(),
      task_type: "SEQUENTIAL",
      seq_range: seqValue,
      category: categoryInput.trim() || null,
      assign_status: "ASSIGN",
      created_by: createdByName,
      deadline_time: deadlineTime, // NEW
      deadline_date:
        seqRange === "weekly" || seqRange === "monthly" ? deadlineDate : null, // NEW
      employees: selectedSequentialEmployees.map((emp) => ({
        employee_id: emp.employee_id,
        employee_name: emp.employee_name,
      })),
    };

    try {
      const res = await fetchJson(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const ids = res.ids || [];
      const newTasks = selectedSequentialEmployees.map((emp, idx) => ({
        marketing_task_id: ids[idx] || Date.now() + idx,
        task_name: body.task_name,
        task_description: body.task_description,
        task_type: body.task_type,
        seq_range: body.seq_range,
        employee_id: emp.employee_id,
        employee_name: emp.employee_name,
        category: body.category,
        assign_status: body.assign_status,
        deadline_time: body.deadline_time, // NEW
        deadline_date: body.deadline_date, // NEW
      }));

      setCurrentTaskList((prev) => [...newTasks, ...prev]);

      if (body.category && !categories.includes(body.category)) {
        setCategories((prev) => [...prev, body.category]);
      }

      // Reset form
      setSequentialTaskName("");
      setSequentialTaskDescription("");
      setCategoryInput("");
      setCategorySuggestions([]);
      setSelectedSequentialEmployees([]);
      setDeadlineTime("MORNING"); // NEW
      setDeadlineDate(""); // NEW

      showNotification(
        "Success",
        `Task added for ${newTasks.length} employee${
          newTasks.length > 1 ? "s" : ""
        }`
      );
    } catch (err) {
      console.error("Create sequential error", err);
      showNotification("Error", "Failed to add task");
    }
  };

  // ===================== UPDATE CONCURRENT =====================
  const handleSaveConcurrent = async () => {
    if (
      !editConcurrentData ||
      !editConcurrentData.task_name?.trim() ||
      !editConcurrentData.task_description?.trim()
    ) {
      showNotification("Warning", "Task name and description are required");
      return;
    }

    try {
      await fetchJson(`${API_BASE}/${editingConcurrentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editConcurrentData), // This already contains deadline_time
      });

      setConcurrentTasks((prev) =>
        prev.map((t) =>
          t.marketing_task_id === editingConcurrentId
            ? { ...t, ...editConcurrentData }
            : t
        )
      );
      setEditingConcurrentId(null);
      setEditConcurrentData(null);
      showNotification("Success", "Task updated successfully");
    } catch (err) {
      console.error("Update concurrent error", err);
      showNotification("Error", "Failed to update task");
    }
  };

  const handleCancelConcurrent = () => {
    setEditingConcurrentId(null);
    setEditConcurrentData(null);
  };

  const handleDeleteConcurrent = async (task) => {
    const ok = await confirm({
      type: "error",
      title: `Are you sure want to delete ${task.task_name} [ ${task.marketing_task_id} ] ?`,
      message: "This action cannot be undone.\nAre you sure?",
      confirmText: "Yes, Delete",
      cancelText: "Cancel",
    });

    if (!ok) return;

    try {
      await fetch(`${API_BASE}/${task.marketing_task_id}`, {
        method: "DELETE",
      });
      setConcurrentTasks((prev) =>
        prev.filter((t) => t.marketing_task_id !== task.marketing_task_id)
      );
      showNotification("Delete", "Task deleted successfully");
    } catch (err) {
      console.error("Delete concurrent error", err);
      showNotification("Error", "Failed to delete task");
    }
  };

  // ===================== UPDATE SEQUENTIAL =====================
  const handleSaveSequential = async () => {
    if (
      !editSequentialData ||
      !editSequentialData.task_name?.trim() ||
      !editSequentialData.task_description?.trim()
    ) {
      showNotification("Warning", "Task name and description are required");
      return;
    }

    try {
      await fetchJson(`${API_BASE}/${editingSequentialId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editSequentialData),
      });

      setCurrentTaskList((prev) =>
        prev.map((t) =>
          t.marketing_task_id === editingSequentialId
            ? { ...t, ...editSequentialData }
            : t
        )
      );
      setEditingSequentialId(null);
      setEditSequentialData(null);
      showNotification("Success", "Task updated successfully");
    } catch (err) {
      console.error("Update sequential error", err);
      showNotification("Error", "Failed to update task");
    }
  };

  const handleCancelSequential = () => {
    setEditingSequentialId(null);
    setEditSequentialData(null);
  };

  const handleDeleteSequential = async (task) => {
    const ok = await confirm({
      type: "error",
      title: `Are you sure want to delete ${task.task_name} [ ${task.marketing_task_id} ] ?`,
      message: "This action cannot be undone.\nAre you sure?",
      confirmText: "Yes, Delete",
      cancelText: "Cancel",
    });

    if (!ok) return;

    try {
      await fetch(`${API_BASE}/${task.marketing_task_id}`, {
        method: "DELETE",
      });
      setCurrentTaskList((prev) =>
        prev.filter((t) => t.marketing_task_id !== task.marketing_task_id)
      );
      setAssignmentChanges((prev) => {
        const c = { ...prev };
        delete c[task.marketing_task_id];
        return c;
      });
      showNotification("Delete", "Task deleted successfully");
    } catch (err) {
      console.error("Delete sequential error", err);
      showNotification("Error", "Failed to delete task");
    }
  };

  // ===================== ASSIGN TOGGLE =====================
  const handleToggleAssign = (taskId, type) => {
    const task = sequentialTasks.find((t) => t.marketing_task_id === taskId);
    if (!task) return;
    const current = assignmentChanges[taskId] ?? task.assign_status;
    if (current === type) return;
    setAssignmentChanges((prev) => ({ ...prev, [taskId]: type }));
  };

  const handleSaveAssignment = async (taskId) => {
    const newType = assignmentChanges[taskId];
    if (!newType) return;
    const task = sequentialTasks.find((t) => t.marketing_task_id === taskId);
    if (!task) return;

    try {
      await fetchJson(`${API_BASE}/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...task, assign_status: newType }),
      });

      setCurrentTaskList((prev) =>
        prev.map((t) =>
          t.marketing_task_id === taskId ? { ...t, assign_status: newType } : t
        )
      );
      setAssignmentChanges((prev) => {
        const c = { ...prev };
        delete c[taskId];
        return c;
      });
      showNotification("Success", "Assignment status updated");
    } catch (err) {
      console.error("Save assign error", err);
      showNotification("Error", "Failed to update assignment");
    }
  };

  const handleCancelAssignment = (taskId) => {
    setAssignmentChanges((prev) => {
      const c = { ...prev };
      delete c[taskId];
      return c;
    });
  };

  // ===================== VALIDATION =====================
  const canAddConcurrent =
    concurrentTaskName.trim() &&
    concurrentTaskDescription.trim() &&
    selectedConcurrentEmployees.length > 0;

  const canAddSequential =
    sequentialTaskName.trim() &&
    sequentialTaskDescription.trim() &&
    selectedSequentialEmployees.length > 0;

  return (
    <div className="min-h-screen bg-[#F3F4F6] py-[1vw]">
      {/* Notification */}
      {notification && (
        <Notification
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Top tabs */}
      <div className="flex bg-white rounded-[0.7vw] shadow-sm border border-[#E5E7EB] pb-[.4vw] mb-[.4vw] max-w-[97vw] mx-auto">
        <button
          onClick={() => setActiveTab("concurrent")}
          className={`px-[1.8vw] py-[0.7vw] text-[0.9vw] font-semibold relative bottom-[-0.12vw] transition-all ${
            activeTab === "concurrent"
              ? "text-[#2563EB] border-b-[0.2vw] border-[#2563EB]"
              : "text-[#6B7280] border-b-[0.2vw] border-transparent hover:text-[#374151]"
          }`}
        >
          Concurrent
        </button>
        <button
          onClick={() => setActiveTab("sequential")}
          className={`px-[1.8vw] py-[0.7vw] text-[0.9vw] font-semibold relative bottom-[-0.12vw] transition-all ${
            activeTab === "sequential"
              ? "text-[#2563EB] border-b-[0.2vw] border-[#2563EB]"
              : "text-[#6B7280] border-b-[0.2vw] border-transparent hover:text-[#374151]"
          }`}
        >
          Sequential
        </button>
      </div>

      <div className="bg-white rounded-[0.7vw] shadow-sm border border-[#E5E7EB] px-[1.2vw] pt-[0.8vw] pb-[1.4vw] max-w-[97vw] mx-auto">
        {/* ===================== CONCURRENT TAB ===================== */}
        {activeTab === "concurrent" && (
          <div>
            {/* Title Row */}
            <div className="flex items-center gap-[0.5vw] mb-[1vw]">
              <h2 className="text-[1.1vw] font-semibold text-[#111827]">
                Today Concurrent Task
              </h2>
              <span className="text-[0.8vw] text-[#6B7280]">
                ({concurrentTasks.length})
              </span>
            </div>

            {/* Date, Employee, Category Row */}
            <div className="flex items-start gap-[0.8vw] mb-[1vw]">
              {/* Date */}
              <div className="flex flex-col">
                <label className="text-[0.75vw] font-semibold text-[#4B5563] mb-[0.2vw]">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-[0.7vw] py-[0.45vw] text-[0.85vw] border border-[#D1D5DB] rounded-[0.35vw] outline-none focus:border-[#2563EB]"
                />
              </div>

              {/* Employee Multi-Select */}
              <MultiSelectEmployee
                employees={employees}
                selectedEmployees={selectedConcurrentEmployees}
                setSelectedEmployees={setSelectedConcurrentEmployees}
                label="Employee"
              />

              {/* Category */}
              <div className="relative flex flex-col">
                <label className="text-[0.75vw] font-semibold text-[#4B5563] mb-[0.2vw]">
                  Category
                </label>
                <input
                  value={categoryInput}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  placeholder="Type category"
                  className="px-[0.7vw] py-[0.45vw] text-[0.85vw] border border-[#D1D5DB] rounded-[0.35vw] outline-none focus:border-[#2563EB]"
                  autoComplete="off"
                />
                {categorySuggestions.length > 0 && (
                  <ul className="absolute top-[4vw] right-0 w-full bg-white border border-[#D1D5DB] rounded-[0.35vw] shadow-sm z-10 max-h-[10vw] overflow-auto text-[0.85vw]">
                    {categorySuggestions.map((c) => (
                      <li
                        key={c}
                        className="px-[0.7vw] py-[0.4vw] hover:bg-[#EFF6FF] cursor-pointer"
                        onClick={() => handleCategorySelect(c)}
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-col">
                <label className="text-[0.75vw] font-semibold text-[#4B5563] mb-[0.2vw]">
                  Deadline
                </label>
                <select
                  value={concurrentDeadlineTime}
                  onChange={(e) => setConcurrentDeadlineTime(e.target.value)}
                  className="px-[0.7vw] py-[0.45vw] text-[0.85vw] border border-[#D1D5DB] rounded-[0.35vw] outline-none focus:border-[#2563EB] cursor-pointer"
                >
                  <option value="MORNING">Morning</option>
                  <option value="EVENING">Evening</option>
                </select>
              </div>
            </div>

            {/* Input row */}
            <div className="flex items-end gap-[0.7vw] mb-[1vw]">
              <div className="flex-1 flex flex-col">
                <label className="text-[0.8vw] font-semibold text-[#4B5563] mb-[0.3vw]">
                  Task Name
                </label>
                <input
                  value={concurrentTaskName}
                  onChange={(e) => setConcurrentTaskName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (canAddConcurrent) handleAddConcurrentTask();
                    }
                  }}
                  placeholder="Enter task name"
                  className="w-full px-[0.7vw] py-[0.55vw] text-[0.85vw] border border-[#D1D5DB] rounded-[0.35vw] outline-none focus:border-[#2563EB] focus:ring-[0.18vw] focus:ring-[#BFDBFE]"
                />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="text-[0.8vw] font-semibold text-[#4B5563] mb-[0.3vw]">
                  Task Description
                </label>
                <textarea
                  value={concurrentTaskDescription}
                  onChange={(e) => setConcurrentTaskDescription(e.target.value)}
                  placeholder="Enter task description"
                  className="w-full px-[0.7vw] py-[0.55vw] text-[0.85vw] border border-[#D1D5DB] rounded-[0.35vw] outline-none focus:border-[#2563EB] focus:ring-[0.18vw] focus:ring-[#BFDBFE] resize-none h-[2.7vw]"
                />
              </div>
              <button
                onClick={handleAddConcurrentTask}
                disabled={!canAddConcurrent}
                className={`px-[1vw] py-[0.1vw] text-[0.80vw] font-semibold rounded-[1vw] h-[2.7vw] whitespace-nowrap transition-all ${
                  !canAddConcurrent
                    ? "bg-[#9CA3AF] text-white cursor-not-allowed"
                    : "bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                }`}
              >
                Add Task
              </button>
            </div>

            {/* Concurrent table */}
            <div className="relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-[0.5vw]">
                  <div className="flex items-center gap-[0.5vw]">
                    <div className="animate-spin rounded-full h-[1.5vw] w-[1.5vw] border-b-2 border-gray-900"></div>
                    <span className="text-[0.95vw] text-gray-700 font-medium">
                      Loading...
                    </span>
                  </div>
                </div>
              )}

              <div className="border border-[#E5E7EB] rounded-[0.5vw] overflow-auto max-h-[60vh]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#F5F7FF] text-[0.9vw] text-[#4B5563]">
                      <th className="px-[1vw] py-[0.7vw] font-medium border-b border-r border-[#E5E7EB] w-[4vw] text-left">
                        S.NO
                      </th>
                      <th className="px-[1vw] py-[0.7vw] font-medium border-b border-r border-[#E5E7EB] text-left">
                        Date
                      </th>
                      <th className="px-[1vw] py-[0.7vw] font-medium border-b border-r border-[#E5E7EB] text-left">
                        Task Name
                      </th>
                      <th className="px-[1vw] py-[0.7vw] font-medium border-b border-r border-[#E5E7EB] text-left">
                        Task Description
                      </th>
                      <th className="px-[1vw] py-[0.7vw] font-medium border-b border-r border-[#E5E7EB] text-left">
                        Employee
                      </th>
                      <th className="px-[1vw] py-[0.7vw] font-medium border-b border-r border-[#E5E7EB] text-left">
                        Category
                      </th>
                      <th className="px-[1vw] py-[0.7vw] font-medium border-b border-r border-[#E5E7EB] text-left">
                        Deadline
                      </th>

                      <th className="px-[1vw] py-[0.7vw] font-medium border-b border-[#E5E7EB] text-left w-[11vw]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {concurrentTasks.length === 0 && !isLoading ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-[1vw] py-[2vw] text-center text-[0.85vw] text-[#9CA3AF]"
                        >
                          No tasks added yet
                        </td>
                      </tr>
                    ) : (
                      concurrentTasks.map((task, index) => (
                        <tr
                          key={task.marketing_task_id}
                          className="hover:bg-[#F9FAFB] text-[0.9vw] text-[#374151]"
                        >
                          <td className="px-[1vw] py-[0.7vw] align-top border-b border-r border-[#E5E7EB]">
                            {index + 1}
                          </td>
                          <td className="px-[1vw] py-[0.7vw] align-top border-b border-r border-[#E5E7EB]">
                            {task.task_date || selectedDate}
                          </td>
                          <td className="px-[1vw] py-[0.7vw] align-top border-b border-r border-[#E5E7EB]">
                            {editingConcurrentId === task.marketing_task_id ? (
                              <input
                                value={editConcurrentData?.task_name || ""}
                                onChange={(e) =>
                                  setEditConcurrentData({
                                    ...editConcurrentData,
                                    task_name: e.target.value,
                                  })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveConcurrent();
                                  if (e.key === "Escape")
                                    handleCancelConcurrent();
                                }}
                                className="w-full px-[0.6vw] py-[0.45vw] text-[0.85vw] border border-[#D1D5DB] rounded-[0.3vw] outline-none focus:border-[#2563EB]"
                                autoFocus
                              />
                            ) : (
                              <span className="font-semibold break-words block">
                                {task.task_name}
                              </span>
                            )}
                          </td>
                          <td className="px-[1vw] py-[0.7vw] align-top border-b border-r border-[#E5E7EB]">
                            {editingConcurrentId === task.marketing_task_id ? (
                              <textarea
                                value={
                                  editConcurrentData?.task_description || ""
                                }
                                onChange={(e) =>
                                  setEditConcurrentData({
                                    ...editConcurrentData,
                                    task_description: e.target.value,
                                  })
                                }
                                className="w-full px-[0.6vw] py-[0.45vw] text-[0.85vw] border border-[#D1D5DB] rounded-[0.3vw] outline-none focus:border-[#2563EB] resize-none min-h-[3.4vw]"
                              />
                            ) : (
                              <div className="whitespace-pre-wrap break-words break-all w-full">
                                {task.task_description}
                              </div>
                            )}
                          </td>
                          <td className="px-[1vw] py-[0.7vw] align-top border-b border-r border-[#E5E7EB]">
                            {task.employee_name}
                          </td>
                          <td className="px-[1vw] py-[0.7vw] align-top border-b border-r border-[#E5E7EB]">
                            {task.category}
                          </td>
                          <td className="px-[1vw] py-[0.7vw] align-top border-b border-r border-[#E5E7EB]">
                            {task.deadline_time || "N/A"}
                          </td>

                          <td className="px-[1vw] py-[0.7vw] align-top border-b border-[#E5E7EB]">
                            <div className="flex flex-wrap gap-[0.5vw]">
                              {editingConcurrentId ===
                              task.marketing_task_id ? (
                                <>
                                  <button
                                    onClick={handleSaveConcurrent}
                                    disabled={
                                      !editConcurrentData?.task_name?.trim() ||
                                      !editConcurrentData?.task_description?.trim()
                                    }
                                    className={`px-[0.9vw] py-[0.4vw] rounded-[0.35vw] text-[0.85vw] flex items-center gap-[0.3vw] ${
                                      !editConcurrentData?.task_name?.trim() ||
                                      !editConcurrentData?.task_description?.trim()
                                        ? "bg-[#D1D5DB] text-white cursor-not-allowed"
                                        : "bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                                    }`}
                                  >
                                    <Save size="0.9vw" />
                                  </button>
                                  <button
                                    onClick={handleCancelConcurrent}
                                    className="px-[0.9vw] py-[0.4vw] rounded-[0.35vw] border border-[#D1D5DB] text-[0.85vw] flex items-center gap-[0.3vw] bg-white hover:bg-[#F3F4F6]"
                                  >
                                    <X size="0.9vw" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingConcurrentId(
                                        task.marketing_task_id
                                      );
                                      setEditConcurrentData({ ...task });
                                    }}
                                    className="px-[0.9vw] py-[0.4vw] rounded-[0.35vw] text-[0.85vw] flex items-center gap-[0.3vw] text-[#2563EB] bg-white hover:bg-[#EFF6FF]"
                                  >
                                    <Edit size="0.9vw" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteConcurrent(task)}
                                    className="px-[0.9vw] py-[0.4vw] rounded-[0.35vw] text-[0.85vw] flex items-center gap-[0.3vw] bg-[#F97373] hover:bg-[#EF4444] text-white"
                                  >
                                    <Trash2 size="0.9vw" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================== SEQUENTIAL TAB ===================== */}
        {activeTab === "sequential" && (
          <div>
            {/* Title and Inner tabs */}
            <div className="flex items-center justify-between mb-[1vw]">
              <div className="flex items-center gap-[0.5vw]">
                <h2 className="text-[1.1vw] font-semibold text-[#111827]">
                  Frequent Sequential Task
                </h2>
                <span className="text-[0.8vw] text-[#6B7280]">
                  ({totalSequentialCount})
                </span>
              </div>
              <div className="inline-flex items-center bg-[#2563EB] rounded-full p-[0.12vw]">
                <button
                  onClick={() => setSeqRange("today")}
                  className={`px-[1.4vw] py-[0.45vw] text-[0.8vw] font-semibold rounded-full transition-all ${
                    seqRange === "today"
                      ? "bg-white text-[#2563EB] shadow-sm"
                      : "bg-transparent text-white hover:bg-[#1D4ED8]"
                  }`}
                >
                  Today ({todayTasks.length})
                </button>
                <button
                  onClick={() => setSeqRange("weekly")}
                  className={`px-[1.4vw] py-[0.45vw] text-[0.8vw] font-semibold rounded-full transition-all ${
                    seqRange === "weekly"
                      ? "bg-white text-[#2563EB] shadow-sm"
                      : "bg-transparent text-white hover:bg-[#1D4ED8]"
                  }`}
                >
                  Weekly ({weeklyTasks.length})
                </button>
                <button
                  onClick={() => setSeqRange("monthly")}
                  className={`px-[1.4vw] py-[0.45vw] text-[0.8vw] font-semibold rounded-full transition-all ${
                    seqRange === "monthly"
                      ? "bg-white text-[#2563EB] shadow-sm"
                      : "bg-transparent text-white hover:bg-[#1D4ED8]"
                  }`}
                >
                  Monthly ({monthlyTasks.length})
                </button>
              </div>
            </div>

            {/* Employee, Category Row */}
            <div className="flex items-start gap-[0.8vw] mb-[1vw]">
              {/* Employee Multi-Select */}
              <MultiSelectEmployee
                employees={employees}
                selectedEmployees={selectedSequentialEmployees}
                setSelectedEmployees={setSelectedSequentialEmployees}
                label="Employee"
              />

              {/* Category */}
              <div className="relative flex flex-col">
                <label className="text-[0.75vw] font-semibold text-[#4B5563] mb-[0.2vw]">
                  Category
                </label>
                <input
                  value={categoryInput}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  placeholder="Type category"
                  className="px-[0.7vw] py-[0.45vw] text-[0.85vw] border border-[#D1D5DB] rounded-[0.35vw] outline-none focus:border-[#2563EB]"
                  autoComplete="off"
                />
                {categorySuggestions.length > 0 && (
                  <ul className="absolute top-[4vw] right-0 w-full bg-white border border-[#D1D5DB] rounded-[0.35vw] shadow-sm z-10 max-h-[10vw] overflow-auto text-[0.85vw]">
                    {categorySuggestions.map((c) => (
                      <li
                        key={c}
                        className="px-[0.7vw] py-[0.4vw] hover:bg-[#EFF6FF] cursor-pointer"
                        onClick={() => handleCategorySelect(c)}
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-col">
                <label className="text-[0.75vw] font-semibold text-[#4B5563] mb-[0.2vw]">
                  Deadline
                </label>
                <select
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                  className="px-[0.7vw] py-[0.45vw] text-[0.85vw] border border-[#D1D5DB] rounded-[0.35vw] outline-none focus:border-[#2563EB] cursor-pointer"
                >
                  <option value="MORNING">Morning</option>
                  <option value="EVENING">Evening</option>
                </select>
              </div>

              {/* Deadline Date (for Weekly & Monthly only) */}
              {(seqRange === "weekly" || seqRange === "monthly") && (
                <div className="flex flex-col">
                  <label className="text-[0.75vw] font-semibold text-[#4B5563] mb-[0.2vw]">
                    Deadline Date
                  </label>
                  <input
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="px-[0.7vw] py-[0.45vw] text-[0.85vw] border border-[#D1D5DB] rounded-[0.35vw] outline-none focus:border-[#2563EB]"
                  />
                </div>
              )}
            </div>

            {/* Input Row */}
            <div className="flex items-end gap-[0.7vw] mb-[1vw]">
              <div className="flex-1 flex flex-col">
                <label className="text-[0.8vw] font-semibold text-[#4B5563] mb-[0.3vw]">
                  Task Name
                </label>
                <input
                  value={sequentialTaskName}
                  onChange={(e) => setSequentialTaskName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (canAddSequential) handleAddSequentialTask();
                    }
                  }}
                  placeholder="Enter task name"
                  className="w-full px-[0.7vw] py-[0.55vw] text-[0.85vw] border border-[#D1D5DB] rounded-[0.35vw] outline-none focus:border-[#2563EB] focus:ring-[0.18vw] focus:ring-[#BFDBFE]"
                />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="text-[0.8vw] font-semibold text-[#4B5563] mb-[0.3vw]">
                  Task Description
                </label>
                <textarea
                  value={sequentialTaskDescription}
                  onChange={(e) => setSequentialTaskDescription(e.target.value)}
                  placeholder="Enter task description"
                  className="w-full px-[0.7vw] py-[0.55vw] text-[0.85vw] border border-[#D1D5DB] rounded-[0.35vw] outline-none focus:border-[#2563EB] focus:ring-[0.18vw] focus:ring-[#BFDBFE] resize-none h-[2.7vw]"
                />
              </div>
              <button
                onClick={handleAddSequentialTask}
                disabled={!canAddSequential}
                className={`px-[1vw] py-[0.6vw] text-[0.80vw] font-semibold rounded-[1vw] h-[2.7vw] whitespace-nowrap transition-all ${
                  !canAddSequential
                    ? "bg-[#9CA3AF] text-white cursor-not-allowed"
                    : "bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                }`}
              >
                Add Task
              </button>
            </div>

            {/* Sequential table */}
            <div className="relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-[0.5vw]">
                  <div className="flex items-center gap-[0.5vw]">
                    <div className="animate-spin rounded-full h-[1.5vw] w-[1.5vw] border-b-2 border-gray-900"></div>
                    <span className="text-[0.95vw] text-gray-700 font-medium">
                      Loading...
                    </span>
                  </div>
                </div>
              )}

              <div className="border border-[#E5E7EB] rounded-[0.5vw] overflow-auto max-h-[60vh]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#F5F7FF] text-[0.9vw] text-[#4B5563]">
                      <th className="px-[1vw] py-[0.7vw] font-medium border-b border-r border-[#E5E7EB] w-[4vw] text-left">
                        S.NO
                      </th>
                      <th className="px-[1vw] py-[0.7vw] font-medium border-b border-r border-[#E5E7EB] text-left">
                        Task Name
                      </th>
                      <th className="px-[1vw] py-[0.7vw] font-medium border-b border-r border-[#E5E7EB] text-left">
                        Task Description
                      </th>
                      <th className="px-[1vw] py-[0.7vw] font-medium border-b border-r border-[#E5E7EB] text-left">
                        Employee
                      </th>
                      <th className="px-[1vw] py-[0.7vw] font-medium border-b border-r border-[#E5E7EB] text-left">
                        Category
                      </th>
                      <th className="px-[1vw] py-[0.7vw] font-medium border-b border-r border-[#E5E7EB] text-left">
                        Deadline
                      </th>
                      {(seqRange === "weekly" || seqRange === "monthly") && (
                        <th className="px-[1vw] py-[0.7vw] font-medium border-b border-r border-[#E5E7EB] text-left">
                          Deadline Date
                        </th>
                      )}
                      <th className="px-[1vw] py-[0.7vw] font-medium border-b border-r border-[#E5E7EB] text-left w-[13vw]">
                        Assign
                      </th>
                      <th className="px-[1vw] py-[0.7vw] font-medium border-b border-[#E5E7EB] text-left w-[11vw]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sequentialTasks.length === 0 && !isLoading ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-[1vw] py-[2vw] text-center text-[0.85vw] text-[#9CA3AF]"
                        >
                          No tasks added yet
                        </td>
                      </tr>
                    ) : (
                      sequentialTasks.map((task, index) => {
                        const id = task.marketing_task_id;
                        const hasUnsaved = assignmentChanges[id] !== undefined;
                        const currentType = hasUnsaved
                          ? assignmentChanges[id]
                          : task.assign_status;

                        return (
                          <tr
                            key={id}
                            className="hover:bg-[#F9FAFB] text-[0.9vw] text-[#374151]"
                          >
                            <td className="px-[1vw] py-[0.7vw] align-top border-b border-r border-[#E5E7EB]">
                              {index + 1}
                            </td>
                            <td className="px-[1vw] py-[0.7vw] align-top border-b border-r border-[#E5E7EB]">
                              {editingSequentialId === id ? (
                                <input
                                  value={editSequentialData?.task_name || ""}
                                  onChange={(e) =>
                                    setEditSequentialData({
                                      ...editSequentialData,
                                      task_name: e.target.value,
                                    })
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      handleSaveSequential();
                                    if (e.key === "Escape")
                                      handleCancelSequential();
                                  }}
                                  className="w-full px-[0.6vw] py-[0.45vw] text-[0.85vw] border border-[#D1D5DB] rounded-[0.3vw] outline-none focus:border-[#2563EB]"
                                  autoFocus
                                />
                              ) : (
                                <span className="font-semibold break-words block">
                                  {task.task_name}
                                </span>
                              )}
                            </td>
                            <td className="px-[1vw] py-[0.7vw] align-top border-b border-r border-[#E5E7EB]">
                              {editingSequentialId === id ? (
                                <textarea
                                  value={
                                    editSequentialData?.task_description || ""
                                  }
                                  onChange={(e) =>
                                    setEditSequentialData({
                                      ...editSequentialData,
                                      task_description: e.target.value,
                                    })
                                  }
                                  className="w-full px-[0.6vw] py-[0.45vw] text-[0.85vw] border border-[#D1D5DB] rounded-[0.3vw] outline-none focus:border-[#2563EB] resize-none min-h-[3.4vw]"
                                />
                              ) : (
                                <div className="whitespace-pre-wrap break-words break-all w-full">
                                  {task.task_description}
                                </div>
                              )}
                            </td>
                            <td className="px-[1vw] py-[0.7vw] align-top border-b border-r border-[#E5E7EB]">
                              {task.employee_name}
                            </td>
                            <td className="px-[1vw] py-[0.7vw] align-top border-b border-r border-[#E5E7EB]">
                              {task.category}
                            </td>
                            <td className="px-[1vw] py-[0.7vw] align-top border-b border-r border-[#E5E7EB]">
                              {task.deadline_time || "N/A"}
                            </td>
                            {(seqRange === "weekly" ||
                              seqRange === "monthly") && (
                              <td className="px-[1vw] py-[0.7vw] align-top border-b border-r border-[#E5E7EB]">
                                {task.deadline_date
                                  ? new Date(
                                      task.deadline_date
                                    ).toLocaleDateString("en-GB", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })
                                  : "N/A"}
                              </td>
                            )}

                            <td className="px-[2.5vw] py-[0.7vw] align-top border-b border-r border-[#E5E7EB]">
                              <div className="flex bg-[#F3F4F6] rounded-[1.3vw] p-[0.25vw]">
                                <button
                                  onClick={() =>
                                    handleToggleAssign(id, "ASSIGN")
                                  }
                                  className={`px-[1vw] py-[0.4vw] rounded-[1.3vw] text-[0.8vw] font-medium transition-all ${
                                    currentType === "ASSIGN"
                                      ? "bg-[#6366F1] text-white"
                                      : "bg-transparent text-[#4B5563] hover:bg-[#E5E7EB]"
                                  }`}
                                >
                                  Assign
                                </button>
                                <button
                                  onClick={() => handleToggleAssign(id, "HOLD")}
                                  className={`px-[1vw] py-[0.4vw] rounded-[1.3vw] text-[0.8vw] font-medium transition-all ${
                                    currentType === "HOLD"
                                      ? "bg-[#6366F1] text-white"
                                      : "bg-transparent text-[#4B5563] hover:bg-[#E5E7EB]"
                                  }`}
                                >
                                  Hold
                                </button>
                              </div>
                            </td>
                            <td className="px-[1vw] py-[0.7vw] align-top border-b border-[#E5E7EB]">
                              <div className="flex flex-wrap gap-[0.5vw]">
                                {editingSequentialId === id ? (
                                  <>
                                    <button
                                      onClick={handleSaveSequential}
                                      disabled={
                                        !editSequentialData?.task_name?.trim() ||
                                        !editSequentialData?.task_description?.trim()
                                      }
                                      className={`px-[0.9vw] py-[0.4vw] rounded-[0.35vw] text-[0.85vw] flex items-center gap-[0.3vw] ${
                                        !editSequentialData?.task_name?.trim() ||
                                        !editSequentialData?.task_description?.trim()
                                          ? "bg-[#D1D5DB] text-white cursor-not-allowed"
                                          : "bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                                      }`}
                                    >
                                      <Save size="0.9vw" />
                                    </button>
                                    <button
                                      onClick={handleCancelSequential}
                                      className="px-[0.9vw] py-[0.4vw] rounded-[0.35vw] border border-[#D1D5DB] text-[0.85vw] flex items-center gap-[0.3vw] bg-white hover:bg-[#F3F4F6]"
                                    >
                                      <X size="0.9vw" />
                                    </button>
                                  </>
                                ) : hasUnsaved ? (
                                  <>
                                    <button
                                      onClick={() => handleSaveAssignment(id)}
                                      className="px-[0.9vw] py-[0.4vw] rounded-[0.35vw] text-[0.85vw] flex items-center gap-[0.3vw] bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                                    >
                                      <Save size="0.9vw" />
                                    </button>
                                    <button
                                      onClick={() => handleCancelAssignment(id)}
                                      className="px-[0.9vw] py-[0.4vw] rounded-[0.35vw] border border-[#D1D5DB] text-[0.85vw] flex items-center gap-[0.3vw] bg-white hover:bg-[#F3F4F6]"
                                    >
                                      <X size="0.9vw" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => {
                                        setEditingSequentialId(id);
                                        setEditSequentialData({ ...task });
                                      }}
                                      className="px-[0.9vw] py-[0.4vw] rounded-[0.35vw] text-[0.85vw] flex items-center gap-[0.3vw] bg-white hover:bg-[#EFF6FF] text-[#2563EB]"
                                    >
                                      <Edit size="0.9vw" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteSequential(task)
                                      }
                                      className="px-[0.9vw] py-[0.4vw] rounded-[0.35vw] text-[0.85vw] flex items-center gap-[0.3vw] bg-[#F97373] hover:bg-[#EF4444] text-white"
                                    >
                                      <Trash2 size="0.9vw" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportTasks;
