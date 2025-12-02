import React, { useState, useEffect, useRef } from "react";
import { Trash2, RefreshCw, Eye, Edit, Plus, PhoneCall, ChevronLeft, ChevronRight } from "lucide-react";
import ClientAddModal from "./ClientAdd";
import ClientUploadModal from "./ClientUpload";
import FollowupModal from "./FollowupModal";
import uploadLogo from "../../assets/Marketing/upload.webp";
import searchIcon from "../../assets/Marketing/search.webp";

const RECORDS_PER_PAGE = 9;

const Followup = () => {
  const [mainTab, setMainTab] = useState("followups");
  const [subTab, setSubTab] = useState("first_followup");
  const [clients, setClients] = useState([]);
  const [clientsHistory, setClientsHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFollowupModalOpen, setIsFollowupModalOpen] = useState(false);
  const [followupClient, setFollowupClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const tableBodyRef = useRef(null);
  const fetchTimeoutRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    fetchTimeoutRef.current = setTimeout(() => {
      fetchClients();
    }, 900);

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [mainTab, subTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [mainTab, subTab, searchTerm]);

  const fetchClients = async () => {
    setClients([]);
    setLoading(true);
    try {
      let url = API_URL;

      if (mainTab === "clientsData" && subTab === "deleted") {
        url = `${API_URL}/clientAdd?active=false`;
      } else if (mainTab === "clientsData" && subTab === "current") {
        url = `${API_URL}/clientAdd`;
      } else if (mainTab === "followups" && subTab === "first_followup") {
        url = `${API_URL}/followups?status=first_followup`;
      } else if (mainTab === "followups" && subTab === "second_followup") {
        url = `${API_URL}/followups?status=second_followup`;
      } else if (mainTab === "declined" && subTab === "not_available") {
        url = `${API_URL}/followups?status=not_available`;
      } else if (mainTab === "declined" && subTab === "not_interested") {
        url = `${API_URL}/followups?status=not_interested`;
      } else if (mainTab === "declined" && subTab === "not_reachable") {
        url = `${API_URL}/followups?status=not_reachable`;
      } else if (mainTab === "declined" && subTab === "droped") {
        url = `${API_URL}/followups?status=droped`;
      }
      const response = await fetch(url);
      const data = await response.json();

      if (mainTab === "clientsData") {
        setClients(data.data || []);
      } else {
        const finalRecords = data.data.map((records) => {
          return records.client_details;
        });

        setClientsHistory(data.data);
        setClients(finalRecords || []);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this client?")) {
      try {
        await fetch(`${API_URL}/clientAdd/${id}`, { method: "DELETE" });
        fetchClients();
      } catch (error) {
        console.error("Error deleting client:", error);
      }
    }
  };

  const handleRestore = async (id) => {
    try {
      await fetch(`${API_URL}/clientAdd/${id}`, { method: "PATCH" });
      fetchClients();
    } catch (error) {
      console.error("Error restoring client:", error);
    }
  };

  const getSubTabs = () => {
    switch (mainTab) {
      case "followups":
        return [
          { key: "first_followup", label: "First Followup" },
          { key: "second_followup", label: "Second Followup" },
        ];
      case "declined":
        return [
          { key: "not_reachable", label: "Not Picking / Not Reachable" },
          { key: "not_available", label: "Not Available" },
          { key: "not_interested", label: "Not Interested / Not Needed" },
          { key: "droped", label: "Droped" },
        ];
      case "clientsData":
        return [
          { key: "current", label: "Current" },
          { key: "deleted", label: "Deleted" },
        ];
      default:
        return [];
    }
  };

  const getFilteredClients = () => {
    if (!searchTerm) return clients;

    return clients.filter(
      (client) =>
        client.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.customer_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        client.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.industry_type?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredClients = getFilteredClients();

  // Pagination calculations
  const totalPages = Math.ceil(filteredClients.length / RECORDS_PER_PAGE);
  const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
  const endIndex = startIndex + RECORDS_PER_PAGE;
  const paginatedClients = filteredClients.slice(startIndex, endIndex);

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleFollowup = (client) => {
    setFollowupClient(client);
    setIsFollowupModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleUploadClick = () => {
    setIsUploadModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleUploadModalClose = () => {
    setIsUploadModalOpen(false);
  };

  const handleSuccess = () => {
    fetchClients();
  };

  function formatDateToIST(dateString) {
    const date = new Date(dateString.replace(" ", "T"));

    return date
      .toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(",", "");
  }

  return (
    <div className="text-black min-h-[92%] max-h-[100%] w-[100%] max-w-[100%] overflow-hidden">
      <div className="w-[100%] h-[91vh] flex flex-col gap-[1vh]">
        <div className="bg-white flex justify-between overflow-hidden rounded-xl shadow-sm h-[6%] flex-shrink-0">
          <div className="flex border-b border-gray-200 h-full w-full">
            <button
              onClick={() => {
                setMainTab("clientsData");
                setSubTab("current");
              }}
              className={`px-[1.5vw] cursor-pointer font-medium text-[0.9vw] transition-colors ${
                mainTab === "clientsData"
                  ? "border-b-2 border-black text-black"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Client's Data
            </button>
            <button
              onClick={() => {
                setMainTab("followups");
                setSubTab("first_followup");
              }}
              className={`px-[1.5vw] cursor-pointer font-medium text-[0.9vw] transition-colors ${
                mainTab === "followups"
                  ? "border-b-2 border-black text-black"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Followup's
            </button>
            <button
              onClick={() => {
                setMainTab("declined");
                setSubTab("not_reachable");
              }}
              className={`px-[1.5vw] cursor-pointer font-medium text-[0.9vw] transition-colors ${
                mainTab === "declined"
                  ? "border-b-2 border-black text-black"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Declined
            </button>
          </div>

          <div className="w-full h-full flex items-center justify-end pr-[0.3vw] gap-[0.4vw]">
            <button
              onClick={handleUploadClick}
              className="px-[0.8vw] py-[0.4vw] flex gap-[0.4vw] bg-black text-white rounded-full hover:bg-gray-800 text-[0.78vw] items-center justify-center cursor-pointer"
            >
              <img src={uploadLogo} alt="" className="w-[1.1vw] h-[1.1vw]" />
              <span>Upload Client</span>
            </button>
            <button
              onClick={handleAddNew}
              className="px-[0.8vw] py-[0.4vw] bg-black text-white rounded-full hover:bg-gray-800 text-[0.78vw] flex items-center justify-center cursor-pointer"
            >
              <Plus size={"0.8vw"} className="mr-[0.3vw]" />
              Add Client
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl overflow-hidden shadow-sm h-[6%] flex-shrink-0">
          <div className="flex border-b border-gray-200 overflow-x-auto h-full">
            {getSubTabs().map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSubTab(tab.key)}
                className={`px-[1.2vw] cursor-pointer font-medium text-[0.85vw] whitespace-nowrap transition-colors ${
                  subTab === tab.key
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm h-[86%] flex flex-col">
          <div className="flex items-center justify-between p-[0.8vw] h-[10%] flex-shrink-0">
            <div className="flex items-center gap-[0.5vw]">
              <span className="font-medium text-[0.95vw] text-gray-800">
                All Clients
              </span>
              <span className="text-[0.85vw] text-gray-500">
                ({filteredClients.length})
              </span>
            </div>
            <div className="flex items-center gap-[0.7vw]">
              <div className="relative">
                <img
                  src={searchIcon}
                  alt=""
                  className="w-[1.3vw] h-[1.3vw] absolute left-[0.5vw] top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-[2.3vw] pr-[1vw] py-[0.25vw] rounded-full text-[0.95vw] bg-gray-200 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 ">
            {loading ? (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="animate-spin rounded-full h-[2vw] w-[2vw] border-b-2 border-blue-600"></div>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-500">
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <p className="text-[1.1vw] font-medium mb-[0.5vw]">
                  No clients found
                </p>
                <p className="text-[1vw] text-gray-400">
                  {searchTerm
                    ? "Try adjusting your search"
                    : "No clients in this category"}
                </p>
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
                        Date
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                        Company
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                        Customer
                      </th>
                      {[
                        "first_followup",
                        "second_followup",
                        "not_reachable",
                      ].includes(subTab) && (
                        <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                          Next followup date
                        </th>
                      )}
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                        Industry
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                        City
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                        State
                      </th>
                      <th className="px-[0.7vw] py-[0.5vw] text-center text-[0.9vw] font-medium text-gray-800 border border-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody ref={tableBodyRef}>
                    {paginatedClients.map((client, index) => (
                      <tr
                        key={client.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-900 border border-gray-300">
                          {startIndex + index + 1}
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-900 border border-gray-300">
                          <div className="flex justify-center">
                            {formatDateToIST(client.created_at)}
                          </div>
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] font-medium text-gray-900 border border-gray-300">
                          {client.company_name}
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-900 border border-gray-300">
                          {client.customer_name}
                        </td>
                        {[
                          "first_followup",
                          "second_followup",
                          "not_reachable",
                        ].includes(subTab) && (
                          <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-600 border border-gray-300">
                            <div className="flex justify-center">
                              {client?.nextFollowupDate
                                ? client.nextFollowupDate
                                    .split("-")
                                    .reverse()
                                    .join("-")
                                : "-"}
                            </div>
                          </td>
                        )}
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-600 border border-gray-300">
                          {client.industry_type}
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-600 border border-gray-300">
                          {client.city}
                        </td>
                        <td className="px-[0.7vw] py-[0.56vw] text-[0.86vw] text-gray-600 border border-gray-300">
                          {client.state}
                        </td>

                        <td className="px-[0.7vw] py-[0.56vw] border border-gray-300">
                          {mainTab === "clientsData" ? (
                            <div className="flex justify-center items-center gap-[0.3vw]">
                              {subTab === "deleted" ? (
                                <button
                                  onClick={() => handleRestore(client.id)}
                                  className="px-[0.6vw] py-[0.3vw] flex items-center justify-center bg-green-600 text-white rounded-full text-[0.85vw] hover:bg-green-700 cursor-pointer"
                                  title="Restore"
                                >
                                  <RefreshCw
                                    size={"1.02vw"}
                                    className="mr-[0.2vw]"
                                  />
                                  <span className="-mt-[0.2vw]">Restore</span>
                                </button>
                              ) : (
                                <>
                                  <button
                                    className="p-[0.5vw] text-gray-600 hover:bg-gray-50 rounded-full transition-colors cursor-pointer"
                                    title="Edit"
                                    onClick={() => handleEdit(client)}
                                  >
                                    <Edit size={"1.02vw"} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(client.id)}
                                    className="p-[0.5vw] text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                                    title="Delete"
                                  >
                                    <Trash2 size={"1.02vw"} />
                                  </button>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              <button
                                onClick={() => handleFollowup(client)}
                                className="p-[0.5vw] rounded-lg flex gap-[0.8vw] text-[0.86vw] items-center font-semibold text-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="Add Followup"
                              >
                                <PhoneCall size={"1vw"} /> <span>Followup</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!loading && filteredClients.length > 0 && (
            <div className="flex items-center justify-between px-[0.8vw] py-[0.5vw] h-[10%]">
              <div className="text-[0.85vw] text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredClients.length)} of {filteredClients.length} entries
              </div>
              <div className="flex items-center gap-[0.5vw]">
                <button
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  className="px-[0.8vw] py-[0.4vw] flex items-center gap-[0.3vw] bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-[0.85vw] transition cursor-pointer"
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
                  className="px-[0.8vw] py-[0.4vw] flex items-center gap-[0.3vw] bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-[0.85vw] transition cursor-pointer"
                >
                  Next
                  <ChevronRight size={"1vw"} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ClientAddModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        editData={editingClient}
      />

      <ClientUploadModal
        isOpen={isUploadModalOpen}
        onClose={handleUploadModalClose}
        onSuccess={handleSuccess}
      />

      <FollowupModal
        isOpen={isFollowupModalOpen}
        onClose={() => setIsFollowupModalOpen(false)}
        onSuccess={handleSuccess}
        clientData={followupClient}
        clientHistory={clientsHistory}
        subTab={subTab}
      />
    </div>
  );
};

export default Followup;