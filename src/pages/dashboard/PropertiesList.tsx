import { useEffect } from "react";
import Properties from "../properties";

const PropertiesList = () => {
  useEffect(() => {
    document.title = "Proprietà - HostSuite";
  }, []);

  return <Properties />;
};

export default PropertiesList;