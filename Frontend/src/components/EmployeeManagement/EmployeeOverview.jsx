import React, { useState, useEffect } from "react";
import { Edit2, Trash2, Search, RefreshCw } from "lucide-react";

const EmployeeOverview = ({
  employees,
  loading,
  onEdit,
  onDelete,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  useEffect(() => {
    const filtered = employees.filter(
      (emp) =>
        emp.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.emailId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.designation?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmployees(filtered);
  }, [searchTerm, employees]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-[2vw] w-[2vw] border-4 border-gray-200 border-t-black mx-auto mb-[0.8vw]"></div>
          <p className="text-gray-600 text-[0.9vw]">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-[1.2vw]">
      {/* Search and Actions Bar */}
      <div className="mb-[1vw] flex gap-[0.8vw]">
        <div className="relative flex-1">
          <Search className="w-[1vw] h-[1vw] absolute left-[0.8vw] top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-[2.5vw] pr-[0.8vw] py-[0.5vw] border border-gray-700 rounded-full text-[0.9vw] placeholder:text-gray-800 placeholder:text-[0.85vw] focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          />
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-[0.4vw] px-[1.5vw] py-[0.5vw] bg-black text-white rounded-full text-[0.93vw] font-medium hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-[1vw] h-[1vw]" />
          Refresh
        </button>
      </div>

      {/* Table Container */}
      <div className="flex-1 bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <div className="h-full overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-900 text-white sticky top-0 z-10">
              <tr>
                <th className="px-[1vw] py-[0.8vw] text-left font-semibold text-[0.9vw]">
                  Profile
                </th>
                <th className="px-[1vw] py-[0.8vw] text-left font-semibold text-[0.9vw]">
                  Name
                </th>
                <th className="px-[1vw] py-[0.8vw] text-left font-semibold text-[0.9vw]">
                  Employee ID
                </th>
                <th className="px-[1vw] py-[0.8vw] text-left font-semibold text-[0.9vw]">
                  Email
                </th>
                <th className="px-[1vw] py-[0.8vw] text-left font-semibold text-[0.9vw]">
                  Designation
                </th>
                <th className="px-[1vw] py-[0.8vw] text-left font-semibold text-[0.9vw]">
                  Team Head
                </th>
                <th className="px-[1vw] py-[0.8vw] text-left font-semibold text-[0.9vw]">
                  Status
                </th>
                <th className="px-[1vw] py-[0.8vw] text-left font-semibold text-[0.9vw]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee, index) => (
                  <tr
                    key={employee._id || index}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-[1vw] py-[0.8vw]">
                      {employee.profile ? (
                        <img
                          src={`${import.meta.env.VITE_API_BASE_URL1}${employee.profile}`}
                          alt={employee.employeeName}
                          className="w-[2.5vw] h-[2.5vw] rounded-full object-cover border-2 border-gray-200"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = "none";
                            const fallback = document.createElement("div");
                            fallback.className =
                              "w-[2.5vw] h-[2.5vw] rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold text-[1vw]";
                            fallback.textContent = employee.employeeName
                              ?.charAt(0)
                              .toUpperCase();
                            e.target.parentNode.appendChild(fallback);
                          }}
                        />
                      ) : (
                        <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold text-[1vw]">
                          {employee.employeeName?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td className="px-[1vw] py-[0.8vw] font-semibold text-gray-900 text-[0.9vw]">
                      {employee.employeeName}
                    </td>
                    <td className="px-[1vw] py-[0.8vw] text-gray-600 text-[0.85vw] font-mono">
                      {employee.userName}
                    </td>
                    <td className="px-[1vw] py-[0.8vw] text-gray-600 text-[0.85vw]">
                      {employee.emailId}
                    </td>
                    <td className="px-[1vw] py-[0.8vw] text-gray-600 text-[0.85vw]">
                      {employee.designation}
                    </td>
                    <td className="px-[1vw] py-[0.8vw]">
                      <span
                        className={`px-[0.6vw] py-[0.3vw] rounded-full text-[0.75vw] font-semibold ${
                          employee.team_head
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {employee.team_head ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-[1vw] py-[0.8vw]">
                      <span
                        className={`px-[0.8vw] py-[0.3vw] rounded-full text-[0.75vw] font-semibold ${
                          employee.workingStatus === "Active"
                            ? "bg-gray-900 text-white"
                            : employee.workingStatus === "Inactive"
                            ? "bg-gray-300 text-gray-700"
                            : employee.workingStatus === "On Leave"
                            ? "bg-gray-400 text-white"
                            : "bg-gray-600 text-white"
                        }`}
                      >
                        {employee.workingStatus}
                      </span>
                    </td>
                    <td className="px-[1vw] py-[0.8vw]">
                      <div className="flex gap-[0.4vw]">
                        <button
                          onClick={() => onEdit(employee)}
                          className="p-[0.4vw] text-gray-700 hover:bg-gray-200 rounded-full transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-[1vw] h-[1vw]" />
                        </button>
                        <button
                          onClick={() => onDelete(employee._id)}
                          className="p-[0.4vw] text-gray-700 hover:bg-gray-200 rounded-full transition-all cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-[1vw] h-[1vw]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="px-[1vw] py-[3vw] text-center text-gray-500 text-[0.9vw]"
                  >
                    {searchTerm
                      ? "No employees found matching your search"
                      : "No employees registered yet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeOverview;
