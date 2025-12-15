/**
 * Calendar View Page
 *
 * Redirects to the main Calendar page.
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CalendarView() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/calendar");
  }, [navigate]);

  return null;
}
