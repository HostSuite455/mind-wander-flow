import { useEffect } from "react";
import HostDashboard from "../host-dashboard";

const DashboardOverview = () => {
  useEffect(() => {
    document.title = "Dashboard Overview - HostSuite";
  }, []);

  return <HostDashboard />;
};

export default DashboardOverview;