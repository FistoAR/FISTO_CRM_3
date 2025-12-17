import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./components/EmployeeManagement/Login";

import Sidebar from "./components/sidePannel";
import NavBar from "./components/NavBar";
import Marketing from "./pages/Marketing/marketing";
import Software from "./pages/software/software";
import Design from "./pages/design/design";
import ThreeD from "./pages/3D/3d";
// import ProjectHead from "./pages/ProjectHead/report";
import Projects from "./layouts/Projects";
import NewProject from "./components/Project/NewProject";
import ProjectOverview from "./layouts/ProjectOverview";
import Overview from "./components/Project/overview";
import Resource from "./components/Project/Resource";

import MarketingDashboard from "./components/Marketing/Dashboard";
import MarketingAnalytics from "./components/Analytics/Analytics";
import MarketingCalls from "./components/Marketing/Calls";
import MarketingResourse from "./components/Marketing/Resource";
import MarketingSEO from "./components/Marketing/SEO";
import MarketingDailyReports from "./components/Marketing/DailyReports";
import MarketingEmployeeRequest from "./components/Marketing/EmployeeRequest";
import MarketingHRactivities from "./components/Marketing/HR";
import MarketingCalendar from "./components/Marketing/Calendar";

import ProjectHead from "./pages/ProjectHead/ProjectHead";
import PHAnalytics from "./components/ProjectHead/Analytics";
import PHaddreport from "./components/ProjectHead/AddReports";

import Management from "./pages/management/management"
import AdminDashboard from "./components/Management/Dashboard"
import AdminAnalytics from "./components/Management/Analytics"
import AdminManagement from "./components/Management/Management"
import AdminMarketing from "./components/Management/Marketing"
import AdminProject from "./components/Management/Project"
import AdminHR from "./components/Management/HR"
import AdminReport from "./components/Management/Report"
import AdminCalendar from "./components/Management/Calendar"

import { NotificationProvider } from "./components/NotificationContext";
import { ConfirmProvider } from "./components/ConfirmContext";
import { usePageTitle } from "./components/PageTitleNav";

function NavBarWithTitle() {
  const pageTitle = usePageTitle();
  return <NavBar type={pageTitle} />;
}

function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/*"
          element={
            <div className="flex max-w-[100vw] max-h-[100vh]">
              <Sidebar />
              <main className="flex-1 bg-gray-100 min-h-screen px-[1.2vw] py-[0.4vh] max-w-[85%] min-w-[85%] overflow-hidden">
                <NavBarWithTitle />
                <div className="flex-1 overflow-y-auto mt-[1vh] pr-[0.3vw]">
                  <Routes>
                    <Route path="marketing/*" element={<Marketing />}>
                      <Route
                        index
                        element={<Navigate to="dashboard" replace />}
                      />
                      <Route
                        path="dashboard"
                        element={<MarketingDashboard />}
                      />
                      <Route
                        path="analytics"
                        element={<MarketingAnalytics />}
                      />
                      <Route path="calls" element={<MarketingCalls />} />
                      <Route path="resource" element={<MarketingResourse />} />
                      <Route path="seo" element={<MarketingSEO />} />
                      <Route
                        path="dailyReports"
                        element={<MarketingDailyReports />}
                      />
                      <Route
                        path="employeeRequest"
                        element={<MarketingEmployeeRequest />}
                      />
                      <Route
                        path="hrActivities"
                        element={<MarketingHRactivities />}
                      />
                      <Route path="calendar" element={<MarketingCalendar />} />
                    </Route>
                    <Route path="/software" element={<Software />} />
                    <Route path="/design" element={<Design />} />
                    <Route path="/threeD" element={<ThreeD />} />
                    <Route path="/management" element={<Management />} />
                    <Route path="projects" element={<Projects />}>
                      <Route path="newProject" element={<NewProject />} />
                      <Route
                        path="projectOverview"
                        element={<ProjectOverview />}
                      >
                        <Route path="overview" element={<Overview />} />
                        <Route path="resources" element={<Resource />} />
                      </Route>
                    </Route>
                    <Route path="projectHead/*" element={<ProjectHead />}>
                      <Route
                        index
                        element={<Navigate to="addReport" replace />}
                      />
                      <Route path="analytics" element={<PHAnalytics />} />
                      <Route path="addReports" element={<PHaddreport />} />
                    </Route>


                     <Route path="admin/*" element={<Management />}>
                      <Route
                        index
                        element={<Navigate to="dashboard" replace />}
                      />
                      <Route
                        path="dashboard"
                        element={<AdminDashboard />}
                      />
                      <Route
                        path="analytics"
                        element={<AdminAnalytics />}
                      />
                      <Route path="management" element={<AdminManagement />} />
                      <Route path="marketing" element={<AdminMarketing />} />
                      <Route path="project" element={<AdminProject />} />
                      <Route
                        path="hr"
                        element={<AdminHR />}
                      />
                      <Route
                        path="report"
                        element={<AdminReport />}
                      />
                      <Route
                        path="calendar"
                        element={<AdminCalendar />}
                      />
                    
                    </Route>


                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </div>
              </main>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <NotificationProvider>
      <ConfirmProvider>
        <AppContent />
      </ConfirmProvider>
    </NotificationProvider>
  );
}

export default App;
