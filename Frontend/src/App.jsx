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
import Admin from "./pages/Admin/report";
import Projects from "./layouts/Projects";
import NewProject from "./components/Project/NewProject";
import ProjectOverview from "./layouts/ProjectOverview";
import Overview from "./components/Project/overview";
import Resource from "./components/Project/Resource";
import Management from "./pages/management/management";
import MarketingFollowup from "./components/Marketing/followup";
import MarketingResourse from "./components/Marketing/Resource";
import MarketingDashboard from "./components/Marketing/Dashboard";
import MarketingReport from "./components/Marketing/Report1";
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
                        element={<Navigate to="followup" replace />}
                      />
                      <Route path="followup" element={<MarketingFollowup />} />
                      <Route path="resources" element={<MarketingResourse />} />
                      <Route
                        path="dashboard"
                        element={<MarketingDashboard />}
                      />
                      <Route path="report" element={<MarketingReport />} />
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
                    <Route path="/report" element={<Admin />} />
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
