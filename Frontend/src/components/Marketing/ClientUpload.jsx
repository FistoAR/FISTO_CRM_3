import React, { useState, useRef } from "react";
import {
  Upload,
  X,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import fileLogo from "../../assets/Marketing/file.webp";
import uploadLogo from "../../assets/Marketing/upload.webp";

const ClientUploadModal = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;
    setError("");
     setFile(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setError("");
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/clientAdd/upload`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1500);
      } else {
        setError(result.message || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    // setPreview([]);
    setError("");
    setSuccess(false);
    setIsDragging(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/25 backdrop-blur-[2px] flex items-center justify-center z-50"
      onClick={handleClose}>
      <div className="bg-white rounded-xl px-[1vw] py-[0.8vw] w-[50vw] max-w-[1200px] max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between pb-[0.4vw]  border-b border-gray-200">
          <h2 className="text-[1.3vw] font-semibold text-gray-800">
            Upload Clients Data
          </h2>
          <button
            onClick={handleClose}
            className="p-[0.4vw] cursor-pointer hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={"1.5vw"} />
          </button>
        </div>

        <div className=" overflow-y-auto mt-[1vw] max-h-[calc(90vh-140px)]">
          <div
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current.click()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed cursor-pointer rounded-lg py-[2vw] text-center transition-all ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-400 hover:border-gray-400"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-[1.4vw]">
              <img src={fileLogo} alt="" className="w-[5vw] h-[5vw]" />

              <div>
                <p className="text-[1.2vw] font-medium text-gray-700 mb-[0.15vw]">
                  {file ? file.name : "Drop your file here or click to browse"}
                </p>
                <p className="text-[1vw] text-gray-500">
                  Supports Excel (.xlsx, .xls) and CSV files
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-[1vw] p-[1vw] bg-red-50 border border-red-200 rounded-lg flex items-start gap-[1vw]">
              <AlertCircle
                className="text-red-600 flex-shrink-0 mt-0.5"
                size={20}
              />
              <p className="text-red-800 text-[1vw]">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-[1vw] p-[1vw] bg-green-50 border border-green-200 rounded-lg flex items-start gap-[1vw]">
              <CheckCircle
                className="text-green-600 flex-shrink-0 mt-0.5"
                size={20}
              />
              <p className="text-green-800 text-[1vw]">
                File uploaded successfully!
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 mt-[1vw]  ">
          <button
            onClick={handleClose}
            className="px-[2vw] py-[0.5vw] cursor-pointer border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`px-[0.7vw] py-[0.4vw] cursor-pointer rounded-lg transition-colors flex items-center gap-2 ${
              !file || uploading
                ? "bg-gray-300 text-white cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-[1.3vw] w-[1.3vw] border-b-2 border-white"></div>
                Uploading
              </>
            ) : (
              <>
                <img src={uploadLogo} alt="" className="w-[1.6vw] h-[1.6vw]" />
                Upload
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientUploadModal;
