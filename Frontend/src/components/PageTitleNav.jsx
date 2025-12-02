import { useLocation } from "react-router-dom";

export function usePageTitle() {
  const location = useLocation();

  const titles = {
    "/management": "Management",
    "/marketing": "Marketing",
    "/marketing/followup": "Marketing",
    "/marketing/resources": "Marketing",
    "/marketing/dashboard": "Marketing",
    "/marketing/report": "Marketing",
    "/design": "Design",
    "/software": "Software",
    "/threeD": "3D",
    "/report": "Report",
  };

  return titles[location.pathname] || "Dashboard";
}
