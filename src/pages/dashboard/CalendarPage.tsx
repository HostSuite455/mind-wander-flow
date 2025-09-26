import { useEffect } from "react";
import CalendarPro from "../calendar-pro";

export default function CalendarPage() {
  useEffect(() => {
    document.title = "Calendario - HostSuite";
  }, []);

  return <CalendarPro />;
}