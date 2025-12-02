import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Marketingnav = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();

  const pathSegments = location.pathname.split("/").filter(Boolean);
  const breadcrumb = pathSegments
  .map((segment) => {
    const text = segment === "followup" ? "followup's" : segment;
    return text.charAt(0).toUpperCase() + text.slice(1); 
  })
  .join(" / ");

  const navLinkClassName = ({ isActive }) =>
    `px-[1vw] py-[0.25vw] rounded-full transition-all duration-300 text-[0.85vw] font-medium relative z-10 ${
      isActive
        ? "bg-black text-white shadow-md scale-105"
        : "text-gray-700 hover:bg-gray-100 hover:scale-105"
    }`;

  return (
    <div className="flex items-center gap-[0.2vw]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-white flex justify-center items-center px-[0.4vw] py-[0.35vw] cursor-pointer rounded-full hover:bg-gray-100 transition-all duration-300 border border-gray-200 hover:shadow-md"
        aria-label={isExpanded ? "Collapse navigation" : "Expand navigation"}
      >
        {isExpanded ? (
          <ChevronLeft className="w-[1.5vw] h-[1.5vw] text-center text-gray-700" />
        ) : (
          <ChevronRight className="w-[1.5vw] h-[1.5vw] text-center text-gray-700" />
        )}
      </button>

      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isExpanded ? "max-w-[40vw] opacity-100" : "max-w-0 opacity-0"
        }`}
      >
        <div className="flex space-x-[0.5vw] items-center bg-white py-[0.38vw] px-[0.5vw] rounded-full relative border border-gray-200">

          <NavLink to="/marketing/followup" className={navLinkClassName}>
            Followup's
          </NavLink>
          <NavLink to="/marketing/resources" className={navLinkClassName}>
            Resources
          </NavLink>
          <NavLink to="/marketing/dashboard" className={navLinkClassName}>
            Dashboard
          </NavLink>
          <NavLink to="/marketing/report" className={navLinkClassName}>
            Report
          </NavLink>
        </div>
      </div>

      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          !isExpanded ? "max-w-[40vw] opacity-100" : "max-w-0 opacity-0"
        }`}
      >
        <div className="flex items-center gap-[0.4vw] bg-white px-[1.2vw] py-[0.5vw] rounded-full  border border-gray-200 whitespace-nowrap">
          <svg
            className="w-[1vw] h-[1vw] text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="text-[0.9vw] font-medium text-gray-700">
            {breadcrumb || "Marketing"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Marketingnav;