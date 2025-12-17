import React from "react";
import { Edit2, Trash2, User } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const EmployeeOverview = ({ employees, loading, onEdit, onDelete, onAddEmployee }) => {
  const renderEmployeeCell = (emp) => (
    <div className="flex items-center gap-[0.5vw]">
      <div className="w-[2.2vw] h-[2.2vw] rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
        {emp.profile_url ? (
          <img
            src={`${API_BASE_URL}${emp.profile_url}`}
            alt={emp.employee_name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className={`w-full h-full items-center justify-center bg-gray-800 text-white ${
            emp.profile_url ? "hidden" : "flex"
          }`}
        >
          <span className="text-[0.9vw] font-semibold">
            {emp.employee_name?.charAt(0).toUpperCase() || "?"}
          </span>
        </div>
      </div>
      <div>
        <div className="text-[0.86vw] font-medium text-gray-900 leading-tight">
          {emp.employee_name}
        </div>
        <div className="text-[0.72vw] text-gray-500 leading-tight">
          {emp.employee_id}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="flex items-center justify-between p-[0.8vw] h-[8%] flex-shrink-0 bg-white border-b border-gray-200">
        <div className="flex items-center gap-[0.5vw]">
          <span className="font-medium text-[0.95vw] text-gray-800">
            All Employees
          </span>
          <span className="text-[0.85vw] text-gray-500">
            ({employees.length})
          </span>
        </div>
        <button
          onClick={onAddEmployee}
          className="flex items-center gap-[0.5vw] px-[1.2vw] py-[0.5vw] bg-blue-600 text-white rounded-lg text-[0.9vw] font-medium hover:bg-blue-700 transition"
        >
          <User size={"1.1vw"} />
          Add Employee
        </button>
      </div>

      {/* Table area */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-[2vw] w-[2vw] border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="h-full mr-[0.8vw] mb-[0.8vw] ml-[0.8vw] border border-gray-300 rounded-xl overflow-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-[#E2EBFF] sticky top-0">
                <tr>
                  <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                    S.NO
                  </th>
                  <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                    Employee
                  </th>
                  <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                    Designation
                  </th>
                  <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                    Email
                  </th>
                  <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                    Status
                  </th>
                  <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {employees.length > 0 ? (
                  employees.map((emp, index) => (
                    <tr
                      key={emp.employee_id || index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-900 border border-gray-300 text-center">
                        {index + 1}
                      </td>
                      <td className="px-[0.7vw] py-[0.56vw] border border-gray-300">
                        {renderEmployeeCell(emp)}
                      </td>
                      <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-600 border border-gray-300">
                        {emp.designation}
                      </td>
                      <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-600 border border-gray-300 truncate max-w-[12vw]">
                        {emp.email_official || emp.email_personal}
                      </td>
                      <td className="px-[0.7vw] py-[0.56vw] border border-gray-300 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-[0.75vw] font-medium ${
                            emp.working_status === "Active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {emp.working_status}
                        </span>
                      </td>
                      <td className="px-[0.7vw] py-[0.56vw] border border-gray-300 text-center">
                        <div className="flex items-center justify-center gap-[0.5vw]">
                          <button
                            onClick={() => onEdit(emp)}
                            className="p-[0.35vw] bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                          >
                            <Edit2 size={"1vw"} />
                          </button>
                          <button
                            onClick={() => onDelete(emp.employee_id)}
                            className="p-[0.35vw] bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                          >
                            <Trash2 size={"1vw"} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-[0.7vw] py-[1.5vw] text-center text-[0.9vw] text-gray-500"
                    >
                      No employees registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeOverview;
