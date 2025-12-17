// src/components/HR/AddEmployeeModal.jsx
import React, { useEffect, useState } from "react";
import AddEmployee from "../../EmployeeManagement/AddEmployee";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// helper: convert "2025-12-10T18:30:00.000Z" → "2025-12-10"
const toDateInput = (value) =>
  value ? value.split("T")[0] : "";

const AddEmployeeModal = ({ show, editingEmployee, onClose, reload }) => {
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEmployee = async () => {
      // modal closed or add mode
      if (!show || !editingEmployee) {
        setEmployeeData(null);
        return;
      }

      // ensure we only treat objects / strings, ignore booleans
      const isObject =
        typeof editingEmployee === "object" && editingEmployee !== null;
      const isString = typeof editingEmployee === "string";

      // Case 1: HR already passed object in AddEmployee shape (employeeName/userName)
      if (isObject && (editingEmployee.employeeName || editingEmployee.userName)) {
        setEmployeeData({
          ...editingEmployee,
          dob: toDateInput(editingEmployee.dob),
          doj: toDateInput(editingEmployee.doj),
          internStartDate: toDateInput(editingEmployee.internStartDate),
          internEndDate: toDateInput(editingEmployee.internEndDate),
        });
        return;
      }

      try {
        setLoading(true);

        // Case 2: row from employees_details or plain ID
        const id = isObject
          ? (editingEmployee.employee_id || editingEmployee.employeeId || editingEmployee.userName)
          : (isString ? editingEmployee : null);

        if (!id) {
          console.error("No valid employee id for edit");
          setEmployeeData(null);
          return;
        }

        const res = await fetch(`${API_BASE_URL}/employeeRegister/${id}`);
        const data = await res.json();

        if (data.status && data.employee) {
          setEmployeeData({
            employeeName: data.employee.employeeName,
            userName: data.employee.employeeId,
            dob: toDateInput(data.employee.dob),
            gender: data.employee.gender,
            emailPersonal: data.employee.emailPersonal,
            emailOfficial: data.employee.emailOfficial,
            phonePersonal: data.employee.phonePersonal,
            phoneOfficial: data.employee.phoneOfficial,
            designation: data.employee.designation,
            employmentType: data.employee.employmentType,
            workingStatus: data.employee.workingStatus,
            doj: toDateInput(data.employee.doj),
            internStartDate: toDateInput(data.employee.internStartDate),
            internEndDate: toDateInput(data.employee.internEndDate),
            durationMonths: data.employee.durationMonths,
            address: data.employee.address,
            profile: data.employee.profile,
          });
        } else {
          console.error("Failed to fetch employee details");
        }
      } catch (err) {
        console.error("Fetch employee error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [show, editingEmployee]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-[2vw]">
      <div className="bg-white rounded-2xl shadow-2xl w-[95vw] max-w-[1200px] max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-[1vw] border-b border-gray-200 flex-shrink-0">
          <h2 className="text-[1.2vw] font-bold text-gray-900">
            {editingEmployee ? "Edit Employee" : "Add New Employee"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-[1.5vw] font-bold"
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {editingEmployee && loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-[2vw] w-[2vw] border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <AddEmployee
              editingEmployee={employeeData} // null → add; object → edit
              onSuccess={() => {
                reload && reload();
                onClose();
              }}
              onCancel={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AddEmployeeModal;
