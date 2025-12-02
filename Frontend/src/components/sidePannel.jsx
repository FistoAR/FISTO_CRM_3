import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import logo from "../assets/Fisto Logo.png";
import dashboardIcon from "../assets/SidePannelLogos/Dashboard.svg"
import ActivityIcon from "../assets/SidePannelLogos/Activity.svg"
import AnalyticsIcon from "../assets/SidePannelLogos/Analytics.svg"
import ProjectsIcon from "../assets/SidePannelLogos/Projects.svg"
import CalendarIcon from "../assets/SidePannelLogos/Calendar.svg"


export default function Sidebar() {
  const [role, setRole] = useState("");
  function linkClasses(path, isLayout = false) {
    const { pathname } = useLocation();
    const isActive = isLayout ? pathname.startsWith(path) : pathname === path;

    return `flex items-center px-4 py-3 rounded-md transition duration-200 gap-3 
          ${
            isActive
              ? "bg-black text-white font-semibold"
              : "text-gray-700 hover:bg-gray-100"
          }`;
  }

//   useEffect(() => {
//     const storedUser =
//       localStorage.getItem("user") || sessionStorage.getItem("user");
//     if (storedUser) {
//       const user = JSON.parse(storedUser);
//       setRole(user.role);
//     }
//   });

  return (
    <aside
      className="flex flex-col bg-white  px-1.5  text-[1vw] "
      style={{ maxWidth: "15%", minWidth: "15%" }}
    >
      <div className="flex items-center justify-center h-[15%] mb-3">
        <img
          src={logo}
          alt="Project Management Logo"
          style={{ width: "auto", height: "45%" }}
        />
      </div>

      <nav className="flex-1 overflow-y-auto ">
        <ul className="space-y-5">
          <li className="h-[10%] flex items-center">
            <Link
              to="/management"
              className={`${linkClasses(
                "/management"
              )} flex items-center gap-[1.3vw] w-full`}
            >
              <img
                src={dashboardIcon}
                alt="Dashboard"
                className="w-[1.4vw] h-[1.4vw]"
                style={{
                  filter:
                    location.pathname === "/management"
                      ? "brightness(0) invert(1)"
                      : "none",
                }}
              />
              <span className="font-bolder">Management</span>
            </Link>
          </li>

         
            <li className="h-[10%] flex items-center">
              <Link
                to="/marketing"
                className={`${linkClasses(
                  "/marketing"
                )} flex items-center gap-[1.3vw] w-full`}
              >
                <img
                  src={ActivityIcon}
                  alt="marketing"
                  className="w-[1.4vw] h-[1.4vw]"
                  style={{
                    filter:
                      location.pathname === "/marketing"
                        ? "brightness(0) invert(1)"
                        : "none",
                  }}
                />
                <span>Marketing</span>
              </Link>
            </li>


          <li className="h-[10%] flex items-center">
            <Link
              to="/design"
              className={`${linkClasses(
                "/design"
              )} flex items-center gap-[1.3vw] w-full`}
            >
              <img
                src={AnalyticsIcon}
                alt="design"
                className="w-[1.4vw] h-[1.4vw]"
                style={{
                  filter:
                    location.pathname === "/design"
                      ? "brightness(0) invert(1)"
                      : "none",
                }}
              />
              <span>UI UX</span>
            </Link>
          </li>

          <li className="h-[10%] flex items-center">
            <Link
              to="/software"
              className={`${linkClasses(
                "/software",
                true
              )} flex items-center gap-[1.3vw] w-full`}
            >
              <img
                src={ProjectsIcon}
                alt="Projects"
                className="w-[1.4vw] h-[1.4vw]"
                style={{
                  filter: location.pathname.startsWith("/software")
                    ? "brightness(0) invert(1)"
                    : "none",
                }}
              />
              <span>Software</span>
            </Link>
          </li>

          <li className="h-[10%] flex items-center">
            <Link
              to="/threeD"
              className={`${linkClasses(
                "/threeD"
              )} flex items-center gap-[1.3vw] w-full`}
            >
              <img
                src={CalendarIcon}
                alt="Calendar"
                className="w-[1.4vw] h-[1.4vw]"
                style={{
                  filter:
                    location.pathname === "/threeD"
                      ? "brightness(0) invert(1)"
                      : "none",
                }}
              />
              <span>3D</span>
            </Link>
          </li>

          <li className="h-[10%] flex items-center">
            <Link
              to="/projects"
              className={`${linkClasses(
                "/projects",
                true
              )} flex items-center gap-[1.3vw] w-full`}
            >
              <img
                src={ProjectsIcon}
                alt="Projects"
                className="w-[1.4vw] h-[1.4vw]"
                style={{
                  filter: location.pathname.startsWith("/projects")
                    ? "brightness(0) invert(1)"
                    : "none",
                }}
              />
              <span>Projects</span>
            </Link>
          </li>
          <li className="h-[10%] flex items-center">
            <Link
              to="/report"
              className={`${linkClasses(
                "/report",
                true
              )} flex items-center gap-[1.3vw] w-full`}
            >
              <img
                src={ProjectsIcon}
                alt="report"
                className="w-[1.4vw] h-[1.4vw]"
                style={{
                  filter: location.pathname.startsWith("/report")
                    ? "brightness(0) invert(1)"
                    : "none",
                }}
              />
              <span>Report</span>
            </Link>
          </li>

        </ul>
      </nav>
    </aside>
  );
}
