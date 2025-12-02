import React, { useState, useEffect } from "react";
import { Plus, Briefcase, Trash2, Edit2, X, Check } from "lucide-react";
import { useNotification } from "../NotificationContext";
import { useConfirm } from "../ConfirmContext";

const AddDesignation = () => {
  const { notify } = useNotification();
  const confirm = useConfirm();
  
  const [designations, setDesignations] = useState([]);
  const [newDesignation, setNewDesignation] = useState("");
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDesignations();
  }, []);

  const fetchDesignations = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/designations`
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data.status && data.designations) {
        setDesignations(data.designations);
      }
    } catch (error) {
      console.error("Error fetching designations:", error);
      notify({
        title: "Error",
        message: "Failed to fetch designations",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newDesignation.trim()) {
      notify({
        title: "Warning",
        message: "Designation name cannot be empty",
      });
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/designations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ designation: newDesignation.trim() }),
        }
      );

      const data = await res.json();

      if (data.status) {
        notify({
          title: "Success",
          message: "Designation added successfully",
        });
        setNewDesignation("");
        fetchDesignations();
      } else {
        notify({
          title: "Error",
          message: data.message || "Failed to add designation",
        });
      }
    } catch (error) {
      console.error("Error adding designation:", error);
      notify({
        title: "Error",
        message: "An error occurred while adding designation",
      });
    }
  };

  const handleEdit = (designation) => {
    setEditId(designation.id);
    setEditValue(designation.designation);
  };

  const handleSaveEdit = async (id) => {
    if (!editValue.trim()) {
      notify({
        title: "Validation Error",
        message: "Designation name cannot be empty",
      });
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/designations/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ designation: editValue.trim() }),
        }
      );

      const data = await res.json();

      if (data.status) {
        notify({
          title: "Success",
          message: "Designation updated successfully",
        });
        setEditId(null);
        setEditValue("");
        fetchDesignations();
      } else {
        notify({
          title: "Error",
          message: data.message || "Failed to update designation",
        });
      }
    } catch (error) {
      console.error("Error updating designation:", error);
      notify({
        title: "Error",
        message: "An error occurred while updating designation",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setEditValue("");
  };

  const handleDelete = async (id, designation) => {
    const confirmed = await confirm({
      type: "error",
      title: "Delete Designation",
      message: `Are you sure you want to delete "${designation}"?\nThis action cannot be undone.`,
      confirmText: "Yes, Delete",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/designations/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (data.status) {
        notify({
          title: "Success",
          message: "Designation deleted successfully",
        });
        fetchDesignations();
      } else {
        notify({
          title: "Error",
          message: data.message || "Failed to delete designation",
        });
      }
    } catch (error) {
      console.error("Error deleting designation:", error);
      notify({
        title: "Error",
        message: "An error occurred while deleting designation",
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="h-full overflow-auto px-[1.2vw] py-[1vw]">
      <div className="max-w-[60vw] mx-auto">
        {/* Header Section */}
        <div className="mb-[1.5vw]">
          <h3 className="text-[1.4vw] font-bold text-gray-900 mb-[0.3vw] flex items-center gap-[0.5vw]">
            <Briefcase className="w-[1.5vw] h-[1.5vw]" />
            Manage Designations
          </h3>
          <p className="text-gray-600 text-[0.85vw]">
            Add, edit, or remove employee designations
          </p>
        </div>

        {/* Add Designation Form */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-[1.2vw] mb-[1.5vw]">
          <label className="block text-[0.92vw] font-semibold text-gray-900 mb-[0.6vw]">
            Add New Designation
          </label>
          <div className="flex gap-[0.8vw]">
            <div className="relative flex-1">
              <Briefcase className="w-[1vw] h-[1vw] absolute left-[0.8vw] top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={newDesignation}
                onChange={(e) => setNewDesignation(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAdd()}
                placeholder="Enter designation name"
                className="w-full pl-[2.5vw] pr-[0.8vw] py-[0.5vw] border border-gray-700 rounded-full text-[0.9vw] transition-all focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-gray-800 placeholder:text-[0.85vw]"
              />
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center gap-[0.4vw] px-[1.5vw] py-[0.5vw] rounded-full text-[0.93vw] bg-black hover:bg-gray-700 text-white cursor-pointer transition-colors"
            >
              <Plus className="w-[1vw] h-[1vw]" />
              Add
            </button>
          </div>
        </div>

        {/* Designations List */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-gray-900 text-white px-[1.2vw] py-[0.8vw]">
            <h4 className="font-semibold text-[1vw] flex items-center gap-[0.5vw]">
              <Briefcase className="w-[1.1vw] h-[1.1vw]" />
              Current Designations ({designations.length})
            </h4>
          </div>

          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="px-[1.2vw] py-[3vw] text-center">
                <div className="inline-block w-[2vw] h-[2vw] border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
                <p className="text-gray-600 mt-[0.8vw] text-[0.9vw]">Loading designations...</p>
              </div>
            ) : designations.length > 0 ? (
              designations.map((designation, index) => (
                <div
                  key={designation.id}
                  className="px-[1.2vw] py-[0.8vw] hover:bg-gray-50 transition-colors"
                >
                  {editId === designation.id ? (
                    // Edit Mode
                    <div className="flex gap-[0.8vw] items-center">
                      <div className="w-[2vw] h-[2vw] rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold text-[0.8vw] flex-shrink-0">
                        {index + 1}
                      </div>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSaveEdit(designation.id)
                        }
                        className="flex-1 px-[0.8vw] py-[0.4vw] border-2 border-black rounded-full text-[0.9vw] focus:outline-none focus:ring-2 focus:ring-black/20"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(designation.id)}
                        className="p-[0.5vw] bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors cursor-pointer"
                        title="Save"
                      >
                        <Check className="w-[1vw] h-[1vw]" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-[0.5vw] bg-gray-300 text-gray-700 rounded-full hover:bg-gray-400 transition-colors cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-[1vw] h-[1vw]" />
                      </button>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-center justify-between gap-[1vw]">
                      <div className="flex items-center gap-[0.8vw] flex-1 min-w-0">
                        <div className="w-[2vw] h-[2vw] rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold text-[0.8vw] flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-gray-900 font-semibold text-[0.95vw] block truncate">
                            {designation.designation}
                          </span>
                          <div className="flex gap-[1vw] text-[0.75vw] text-gray-500 mt-[0.2vw]">
                            <span>Created: {formatDate(designation.created_date)}</span>
                            {designation.updated_date && 
                             designation.updated_date !== designation.created_date && (
                              <span>Updated: {formatDate(designation.updated_date)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-[0.5vw] flex-shrink-0">
                        <button
                          onClick={() => handleEdit(designation)}
                          className="p-[0.5vw] text-gray-700 hover:bg-gray-200 rounded-full transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-[1vw] h-[1vw]" />
                        </button>
                        <button
                          onClick={() => handleDelete(designation.id, designation.designation)}
                          className="p-[0.5vw] text-gray-700 hover:bg-gray-200 rounded-full transition-all cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-[1vw] h-[1vw]" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="px-[1.2vw] py-[3vw] text-center text-gray-500 text-[0.9vw]">
                No designations added yet. Add your first designation above.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDesignation;
