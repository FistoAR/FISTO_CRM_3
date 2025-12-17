import React, { useState, useEffect, useRef } from "react";
import { Plus, Save, Trash2, Search, Edit, ChevronLeft, ChevronRight, Copy } from "lucide-react";
import Notification from "../ToastProp";

const ITEMS_PER_PAGE = 10;
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/marketing-resources`;

const Resource = () => {
  const [subTab, setSubTab] = useState("important");
  const [selectedDate, setSelectedDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(null);
  
  const [importantRows, setImportantRows] = useState([]);
  const [roughRows, setRoughRows] = useState([]);
  const [allData, setAllData] = useState({ important: [], rough: [] });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [notification, setNotification] = useState(null);
  
  const scrollContainerRef = useRef(null);

  const getLoggedInUser = () => {
    const raw = sessionStorage.getItem("user");
    if (!raw) return { employeeId: null, employeeName: null };
    try {
      const userData = JSON.parse(raw);
      return {
        employeeId: userData.userName || userData.employeeId || null,
        employeeName: userData.employeeName || userData.name || null,
      };
    } catch (e) {
      console.error("Failed to parse session user JSON:", e);
      return { employeeId: null, employeeName: null };
    }
  };

  const getCurrentDateTime = () =>
    new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

  const getSubTabs = () => [
    { key: "important", label: "Important" },
    { key: "rough", label: "Rough" },
  ];

  const showNotification = (title, message) => {
    setNotification({ title, message });
  };

  const handleCopyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      showNotification('Success', 'Link copied to clipboard!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        showNotification('Success', 'Link copied to clipboard!');
      } catch (fallbackErr) {
        showNotification('Error', 'Failed to copy link');
      }
      document.body.removeChild(textArea);
    }
  };

  const getCurrentRows = () => {
    return subTab === "important" ? importantRows : roughRows;
  };

  const setCurrentRows = (rows) => {
    if (subTab === "important") {
      setImportantRows(rows);
    } else {
      setRoughRows(rows);
    }
  };

  // Load data from backend (no employee_id filter for global access)
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          category: subTab
        });

        const response = await fetch(`${API_BASE_URL}?${params}`);
        const data = await response.json();

        if (data.status) {
          const formattedRows = data.data.map(item => ({
            id: item.id,
            date: item.date,
            linkName: item.link_name,
            linkDescription: item.link_description,
            link: item.link,
            employeeName: item.last_updated_by_name,
            isEditing: false
          }));

          setAllData(prev => ({
            ...prev,
            [subTab]: formattedRows
          }));
          setCurrentRows(formattedRows);
        }
      } catch (error) {
        console.error('Error fetching resources:', error);
        showNotification('Error', 'Failed to load resources');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResources();
  }, [subTab]);

  // Client-side filtering
  useEffect(() => {
    const allRows = allData[subTab] || [];
    let filtered = [...allRows];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(row =>
        row.linkName?.toLowerCase().includes(query) ||
        row.linkDescription?.toLowerCase().includes(query)
      );
    }

    // Date filter
    if (selectedDate) {
      filtered = filtered.filter(row => {
        const [day, month, year] = row.date.split('/');
        const rowDate = new Date(year, month - 1, day);
        const filterDate = new Date(selectedDate);
        
        return rowDate.toDateString() === filterDate.toDateString();
      });
    }

    setCurrentRows(filtered);
    setCurrentPage(1);
  }, [searchQuery, selectedDate, allData, subTab]);

  const handleAddRow = () => {
    const { employeeName } = getLoggedInUser();
    const newRow = {
      id: Date.now(),
      date: getCurrentDateTime(),
      linkName: "",
      linkDescription: "",
      link: "",
      employeeName: employeeName,
      isEditing: true,
    };
    setCurrentRows([newRow, ...getCurrentRows()]);
    setCurrentPage(1);
  };

  const handleInputChange = (id, field, value) => {
    const updatedRows = getCurrentRows().map((row) =>
      row.id === id ? { ...row, [field]: value } : row
    );
    setCurrentRows(updatedRows);
  };

  const handleSave = async (id) => {
    const row = getCurrentRows().find(r => r.id === id);
    if (!row) return;

    // Validation
    if (!row.linkName || !row.linkName.trim()) {
      showNotification('Warning', 'Please enter Link Name');
      return;
    }

    if (!row.link || !row.link.trim()) {
      showNotification('Warning', 'Please enter Link URL');
      return;
    }

    const { employeeId } = getLoggedInUser();

    try {
      setIsSaving(id);
      const isNew = typeof id === 'number' && id > 1000000000000;

      const payload = {
        link_name: row.linkName.trim(),
        link_description: row.linkDescription?.trim() || '',
        link: row.link.trim(),
        category: subTab,
        employee_id: employeeId
      };

      const url = isNew ? API_BASE_URL : `${API_BASE_URL}/${id}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.status) {
        const savedResource = {
          id: data.data.id,
          date: data.data.date,
          linkName: data.data.link_name,
          linkDescription: data.data.link_description,
          link: data.data.link,
          employeeName: data.data.last_updated_by_name,
          isEditing: false
        };

        const updatedRows = getCurrentRows().map(r => 
          r.id === id ? savedResource : r
        );
        setCurrentRows(updatedRows);

        setAllData(prev => {
          const categoryData = prev[subTab] || [];
          const existingIndex = categoryData.findIndex(r => r.id === id);
          
          if (existingIndex >= 0) {
            const newData = [...categoryData];
            newData[existingIndex] = savedResource;
            return { ...prev, [subTab]: newData };
          } else {
            return { ...prev, [subTab]: [savedResource, ...categoryData] };
          }
        });

        showNotification('Success', isNew ? 'Resource created successfully' : 'Resource updated successfully');
      } else {
        showNotification('Error', data.message || 'Failed to save resource');
      }
    } catch (error) {
      console.error('Error saving resource:', error);
      showNotification('Error', 'Failed to save resource');
    } finally {
      setIsSaving(null);
    }
  };

  const handleEdit = (id) => {
    const updatedRows = getCurrentRows().map((row) =>
      row.id === id ? { ...row, isEditing: true } : row
    );
    setCurrentRows(updatedRows);
  };

  const handleDelete = async (id) => {
    const isNew = typeof id === 'number' && id > 1000000000000;
    
    if (isNew) {
      const updatedRows = getCurrentRows().filter(row => row.id !== id);
      setCurrentRows(updatedRows);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.status) {
        const updatedRows = getCurrentRows().filter(row => row.id !== id);
        setCurrentRows(updatedRows);

        setAllData(prev => ({
          ...prev,
          [subTab]: (prev[subTab] || []).filter(row => row.id !== id)
        }));

        showNotification('Delete', 'Resource deleted successfully');
      } else {
        showNotification('Error', data.message || 'Failed to delete resource');
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      showNotification('Error', 'Failed to delete resource');
    }
  };

  const filteredRows = getCurrentRows();
  
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedRows = filteredRows.slice(startIndex, endIndex);

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [subTab]);

  return (
    <div className="text-black min-h-[92%] max-h-[100%] w-[100%] max-w-[100%] overflow-hidden">
      {notification && (
        <Notification
          title={notification.title}
          message={notification.message}
          duration={5000}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="w-[100%] h-[91vh] flex flex-col gap-[1vh]">
        {/* Sub tabs */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm h-[6%] flex-shrink-0">
          <div className="flex border-b border-gray-200 overflow-x-auto h-full">
            {getSubTabs().map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setSubTab(t.key);
                  setSearchQuery("");
                  setSelectedDate("");
                }}
                className={`px-[1.2vw] cursor-pointer font-medium text-[0.80vw] whitespace-nowrap transition-colors ${
                  subTab === t.key
                    ? "border-b-[0.2vw] border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm h-[92%] flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-end gap-[0.8vw] p-[0.8vw] h-[10%] flex-shrink-0">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-[0.8vw] py-[0.6vw] border border-gray-300 rounded-lg text-[0.85vw] focus:outline-none focus:border-blue-500"
            />

            <div className="relative">
              <Search
                size={16}
                className="absolute left-[0.6vw] top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-[2vw] pr-[0.8vw] py-[0.6vw] border border-gray-300 rounded-lg text-[0.85vw] w-[18vw] focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleAddRow}
              className="px-[1vw] py-[0.6vw] flex items-center gap-[0.5vw] bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-[0.85vw] font-medium"
            >
              <Plus size={16} />
              Add
            </button>
          </div>

          {/* Table */}
          <div className="flex-1 min-h-0 relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10">
                <div className="flex items-center gap-[0.5vw]">
                  <div
                    className="animate-spin rounded-full border-t-blue-600 border-r-blue-600"
                    style={{
                      width: "2vw",
                      height: "2vw",
                      borderTopWidth: "0.2vw",
                      borderRightWidth: "0.2vw",
                      borderColor: "#2563eb #2563eb transparent transparent",
                    }}
                  />
                </div>
              </div>
            )}

            {filteredRows.length === 0 && !isLoading ? (
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
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                <p className="text-[1.1vw] font-medium mb-[0.5vw]">
                  No resources found
                </p>
                <p className="text-[1vw] text-gray-400">
                  {searchQuery || selectedDate
                    ? "Try adjusting your filters"
                    : 'Click "Add" to create a new resource'}
                </p>
              </div>
            ) : (
              <div
                ref={scrollContainerRef}
                className="mr-[0.8vw] mb-[0.8vw] ml-[0.8vw] border border-gray-300 rounded-xl overflow-auto"
              >
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-[#E2EBFF] sticky top-0 z-[5]">
                    <tr>
                      <th className="px-[0.7vw] py-[0.6vw] text-center text-[0.85vw] font-medium text-gray-800 border border-gray-300 w-[6%]">
                        S.NO
                      </th>
                      <th className="px-[0.7vw] py-[0.6vw] text-center text-[0.85vw] font-medium text-gray-800 border border-gray-300 w-[10%]">
                        Date
                      </th>
                      <th className="px-[0.7vw] py-[0.6vw] text-center text-[0.85vw] font-medium text-gray-800 border border-gray-300 w-[15%]">
                        Link Name
                      </th>
                      <th className="px-[0.7vw] py-[0.6vw] text-center text-[0.85vw] font-medium text-gray-800 border border-gray-300 w-[20%]">
                        Link Description
                      </th>
                      <th className="px-[0.7vw] py-[0.6vw] text-center text-[0.85vw] font-medium text-gray-800 border border-gray-300 w-[17%]">
                        Link
                      </th>
                      <th className="px-[0.7vw] py-[0.6vw] text-center text-[0.85vw] font-medium text-gray-800 border border-gray-300 w-[12%]">
                        Added By
                      </th>
                      <th className="px-[0.7vw] py-[0.6vw] text-center text-[0.85vw] font-medium text-gray-800 border border-gray-300 w-[17%]">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row, index) => (
                      <tr
                        key={row.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-[0.7vw] py-[0.6vw] text-[0.85vw] text-center text-gray-900 border border-gray-300">
                          {startIndex + index + 1}
                        </td>
                        <td className="px-[0.7vw] py-[0.6vw] text-[0.85vw] text-center text-gray-900 border border-gray-300">
                          {row.date}
                        </td>
                        <td className="px-[0.7vw] py-[0.5vw] border border-gray-300">
                          {row.isEditing ? (
                            <input
                              type="text"
                              value={row.linkName}
                              onChange={(e) =>
                                handleInputChange(
                                  row.id,
                                  "linkName",
                                  e.target.value
                                )
                              }
                              placeholder="Enter link name"
                              className="w-full px-[0.6vw] py-[0.4vw] border border-gray-200 rounded text-[0.85vw] focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <span className="text-[0.85vw] text-gray-900">
                              {row.linkName}
                            </span>
                          )}
                        </td>
                        <td className="px-[0.7vw] py-[0.5vw] border border-gray-300">
                          {row.isEditing ? (
                            <input
                              type="text"
                              value={row.linkDescription}
                              onChange={(e) =>
                                handleInputChange(
                                  row.id,
                                  "linkDescription",
                                  e.target.value
                                )
                              }
                              placeholder="Enter description"
                              className="w-full px-[0.6vw] py-[0.4vw] border border-gray-200 rounded text-[0.85vw] focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <span className="text-[0.85vw] text-gray-600">
                              {row.linkDescription}
                            </span>
                          )}
                        </td>
                        <td className="px-[0.7vw] py-[0.5vw] border border-gray-300">
                          {row.isEditing ? (
                            <input
                              type="text"
                              value={row.link}
                              onChange={(e) =>
                                handleInputChange(row.id, "link", e.target.value)
                              }
                              placeholder="Enter URL"
                              className="w-full px-[0.6vw] py-[0.4vw] border border-gray-200 rounded text-[0.85vw] focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <div className="flex items-center gap-[0.3vw]">
                              <a
                                href={row.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[0.80vw] text-blue-600 hover:underline break-all flex-1 truncate max-w-[12vw]"
                                title={row.link}
                              >
                                {row.link}
                              </a>
                              <button
                                onClick={() => handleCopyLink(row.link)}
                                className="p-[0.3vw] text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors flex-shrink-0"
                                title="Copy link"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-[0.7vw] py-[0.6vw] text-[0.85vw] text-center text-gray-900 border border-gray-300">
                          {row.employeeName}
                        </td>
                        <td className="px-[0.7vw] py-[0.5vw] border border-gray-300">
                          <div className="flex justify-center gap-[0.5vw]">
                            {row.isEditing ? (
                              <button
                                onClick={() => handleSave(row.id)}
                                disabled={isSaving === row.id}
                                className="px-[0.6vw] py-[0.4vw] flex items-center gap-[0.4vw] bg-green-600 text-white rounded-lg hover:bg-green-700 text-[0.85vw] disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isSaving === row.id ? (
                                  <>
                                    <div
                                      className="animate-spin rounded-full border-t-white border-r-white"
                                      style={{
                                        width: "14px",
                                        height: "14px",
                                        borderTopWidth: "2px",
                                        borderRightWidth: "2px",
                                        borderColor: "white white transparent transparent",
                                      }}
                                    />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save size={14} />
                                    Save
                                  </>
                                )}
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEdit(row.id)}
                                  className="px-[0.6vw] py-[0.4vw] flex items-center gap-[0.4vw] bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-[0.85vw]"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => handleDelete(row.id)}
                                  className="px-[0.6vw] py-[0.4vw] flex items-center gap-[0.4vw] bg-red-600 text-white rounded-lg hover:bg-red-700 text-[0.85vw]"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {filteredRows.length > 0 && (
            <div className="flex items-center justify-between px-[0.8vw] py-[0.6vw] h-[10%] flex-shrink-0">
              <div className="text-[0.80vw] text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredRows.length)} of {filteredRows.length} entries
              </div>
              <div className="flex items-center gap-[0.8vw]">
                <button
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  className="px-[0.8vw] py-[0.6vw] flex items-center gap-[0.6vw] bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-[0.80vw]"
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <span className="text-[0.80vw] text-gray-600 px-[0.5vw]">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  className="px-[0.8vw] py-[0.6vw] flex items-center gap-[0.6vw] bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-[0.80vw]"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Resource;
