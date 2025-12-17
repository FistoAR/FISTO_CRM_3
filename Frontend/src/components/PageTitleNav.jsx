import { useLocation } from "react-router-dom";

export function usePageTitle() {
  const location = useLocation();

  const titles = {
    "/marketing/dashboard": "Dashboard",
    "/marketing/analytics": "Analytics",
    "/marketing/calls": "Calls",
    "/marketing/resource": "Resource",
    "/marketing/seo": "SEO",
    "/marketing/dailyReports": "Daily Reports",
    "/marketing/employeeRequest": "Employee Request",
    "/marketing/hrActivities": "HR Activities",
    "/marketing/calendar": "Calendar",
    "/projectHead/analytics": "Analytics",
    "/projectHead/addReports": "Add Reports",
    "/admin/dashborad": "Dashboard",
    "/admin/analytics": "Analytics",
    "/admin/management": "Management",
    "/admin/marketing": "Marketing",
    "/admin/Project": "project",
    "/admin/hr": "HR",
    "/admin/report": "Report",
    "/admin/calendar": "Calendar",
  };

  return titles[location.pathname] || "Dashboard";
}
