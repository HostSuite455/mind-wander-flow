import { useEffect } from "react";
import HostDashboard from "../host-dashboard";

const DashboardOverview = () => {
  useEffect(() => {
    document.title = "Panoramica Dashboard - HostSuite";
  }, []);

  return <HostDashboard />;
};

export default DashboardOverview;