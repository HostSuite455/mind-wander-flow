import { useEffect } from "react";
import Calendar from "../calendar";

const CalendarPage = () => {
  useEffect(() => {
    document.title = "Calendario - HostSuite";
  }, []);

  return <Calendar />;
};

export default CalendarPage;