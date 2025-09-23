import { useEffect } from "react";
import Export from "../export";

const ExportPage = () => {
  useEffect(() => {
    document.title = "Export - HostSuite";
  }, []);

  return <Export />;
};

export default ExportPage;