import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import logo from "../assets/Fisto Logo.png";
import dashboardIcon from "../assets/SidePannelLogos/Dashboard.svg";
import ActivityIcon from "../assets/SidePannelLogos/Activity.svg";
import CallsIcon from "../assets/SidePannelLogos/calls.svg";
import SEOIcon from "../assets/SidePannelLogos/seo.svg";
import DailyReportsIcon from "../assets/SidePannelLogos/dailyReports.svg";
import employeeRequestIcon from "../assets/SidePannelLogos/employeeRequest.svg";
import hrActivityIcon from "../assets/SidePannelLogos/hrActivity.svg";
import AddReportIcon from "../assets/SidePannelLogos/AddReport.svg";
import AnalyticsIcon from "../assets/SidePannelLogos/Analytics.svg";
import CalendarIcon from "../assets/SidePannelLogos/Calendar.svg";
import ProjectIcon from "../assets/SidePannelLogos/Projects.svg";

export default function Sidebar() {
  const [designation, setDesignation] = useState("");
  const location = useLocation();

  useEffect(() => {
    // Get user data from sessionStorage
    const userData = sessionStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setDesignation(parsedUser.designation || "");
    }
  }, []);

  function linkClasses(path, isLayout = false) {
    const { pathname } = location;
    const isActive = isLayout ? pathname.startsWith(path) : pathname === path;

    return `flex items-center px-4 py-3 rounded-md transition duration-200 gap-3 
          ${
            isActive
              ? "bg-black text-white font-semibold"
              : "text-gray-700 hover:bg-gray-100"
          }`;
  }

  return (
    <aside
      className="flex flex-col bg-white px-1.5 text-[1vw]"
      style={{ maxWidth: "15%", minWidth: "15%" }}
    >
      <div className="flex items-center justify-center h-[15%]">
        <img
          src={logo}
          alt="Project Management Logo"
          style={{ width: "auto", height: "45%" }}
        />
      </div>

      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-[1vw]">
          {/* Marketing-only menu items */}
          {designation === "Marketing" && (
            <>
              <li className="h-[10%] flex items-center">
                <Link
                  to="/marketing/dashboard"
                  className={`${linkClasses(
                    "/marketing/dashboard",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={dashboardIcon}
                    alt="Dashboard"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith(
                        "/marketing/dashboard"
                      )
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Dashboard</span>
                </Link>
              </li>

              <li className="h-[10%] flex items-center">
                <Link
                  to="/marketing/analytics"
                  className={`${linkClasses(
                    "/marketing/analytics",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={AnalyticsIcon}
                    alt="Analytics"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith(
                        "/marketing/analytics"
                      )
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Analytics</span>
                </Link>
              </li>

              <li className="h-[10%] flex items-center">
                <Link
                  to="/marketing/calls"
                  className={`${linkClasses(
                    "/marketing/calls",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={CallsIcon}
                    alt="Calls"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith("/marketing/calls")
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Calls</span>
                </Link>
              </li>

              <li className="h-[10%] flex items-center">
                <Link
                  to="/marketing/resource"
                  className={`${linkClasses(
                    "/marketing/resource",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={ActivityIcon}
                    alt="Resource"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith(
                        "/marketing/resource"
                      )
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Resources</span>
                </Link>
              </li>

              <li className="h-[10%] flex items-center">
                <Link
                  to="/marketing/seo"
                  className={`${linkClasses(
                    "/marketing/seo",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={SEOIcon}
                    alt="seo"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith("/marketing/seo")
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>SEO</span>
                </Link>
              </li>

              <li className="h-[10%] flex items-center">
                <Link
                  to="/marketing/dailyReports"
                  className={`${linkClasses(
                    "/marketing/dailyReports",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={DailyReportsIcon}
                    alt="DailyReports"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith(
                        "/marketing/dailyReports"
                      )
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Daily reports</span>
                </Link>
              </li>

              <li className="h-[10%] flex items-center">
                <Link
                  to="/marketing/employeeRequest"
                  className={`${linkClasses(
                    "/marketing/employeeRequest",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={employeeRequestIcon}
                    alt="employeeRequest"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith(
                        "/marketing/employeeRequest"
                      )
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Employee request</span>
                </Link>
              </li>

              <li className="h-[10%] flex items-center">
                <Link
                  to="/marketing/hrActivities"
                  className={`${linkClasses(
                    "/marketing/hrActivities",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={hrActivityIcon}
                    alt="hrActivities"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith(
                        "/marketing/hrActivities"
                      )
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>HR Activities</span>
                </Link>
              </li>

              <li className="h-[10%] flex items-center">
                <Link
                  to="/marketing/calendar"
                  className={`${linkClasses(
                    "/marketing/calendar",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={CalendarIcon}
                    alt="calendar"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith(
                        "/marketing/calendar"
                      )
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Calendar</span>
                </Link>
              </li>
            </>
          )}

          {/* Project Head-only menu items */}
          {designation === "Project Head" && (
            <>
              <li className="h-[10%] flex items-center">
                <Link
                  to="/projectHead/analytics"
                  className={`${linkClasses(
                    "/projectHead/analytics",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={AnalyticsIcon}
                    alt="Analytics"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith(
                        "/projectHead/analytics"
                      )
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Analytics</span>
                </Link>
              </li>

              <li className="h-[10%] flex items-center">
                <Link
                  to="/projectHead/addReports"
                  className={`${linkClasses(
                    "/projectHead/addReports",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={AddReportIcon}
                    alt="addReports"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith(
                        "/projectHead/addReports"
                      )
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Add Reports</span>
                </Link>
              </li>
            </>
          )}

          {/* Project Head-only menu items */}
          {designation === "Admin" && (
            <>
              <li className="h-[10%] flex items-center">
                <Link
                  to="/admin/dashboard"
                  className={`${linkClasses(
                    "/admin/dashboard",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={dashboardIcon}
                    alt="Dashboard"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith("/admin/dashboard")
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Dashboard</span>
                </Link>
              </li>

              <li className="h-[10%] flex items-center">
                <Link
                  to="/admin/analytics"
                  className={`${linkClasses(
                    "/admin/analytics",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={ActivityIcon}
                    alt="Analytics"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith("/admin/analytics")
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Analytics</span>
                </Link>
              </li>

              <li className="h-[10%] flex items-center">
                <Link
                  to="/admin/management"
                  className={`${linkClasses(
                    "/admin/management",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={AddReportIcon}
                    alt="Management"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith("/admin/management")
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Management</span>
                </Link>
              </li>

              <li className="h-[10%] flex items-center">
                <Link
                  to="/admin/marketing"
                  className={`${linkClasses(
                    "/admin/marketing",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={CallsIcon}
                    alt="Marketing"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith("/admin/marketing")
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Marketing</span>
                </Link>
              </li>

              <li className="h-[10%] flex items-center">
                <Link
                  to="/admin/project"
                  className={`${linkClasses(
                    "/admin/project",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={ProjectIcon}
                    alt="Project"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith("/admin/project")
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Project</span>
                </Link>
              </li>

              <li className="h-[10%] flex items-center">
                <Link
                  to="/admin/hr"
                  className={`${linkClasses(
                    "/admin/hr",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={hrActivityIcon}
                    alt="HR"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith("/admin/hr")
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>HR</span>
                </Link>
              </li>

              <li className="h-[10%] flex items-center">
                <Link
                  to="/admin/report"
                  className={`${linkClasses(
                    "/admin/report",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={DailyReportsIcon}
                    alt="Report"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith("/admin/report")
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Report</span>
                </Link>
              </li>

              <li className="h-[10%] flex items-center">
                <Link
                  to="/admin/calendar"
                  className={`${linkClasses(
                    "/admin/calendar",
                    true
                  )} flex items-center gap-[1.3vw] w-full`}
                >
                  <img
                    src={CalendarIcon}
                    alt="Calendar"
                    className="w-[1.4vw] h-[1.4vw]"
                    style={{
                      filter: location.pathname.startsWith("/admin/calendar")
                        ? "brightness(0) invert(1)"
                        : "none",
                    }}
                  />
                  <span>Calendar</span>
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </aside>
  );
}
