import ReactCalendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../styles/calendar.css"; // Custom styles for the calendar
import { useState, useEffect } from "react";

// English month abbreviations (3 letters)
const monthAbbreviations = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];



export default function Calendar({ startDate, endDate, setStartDate, setEndDate }) {
  const [selectedRange, setSelectedRange] = useState([startDate, endDate]);
  const [calendarViewDate, setCalendarViewDate] = useState(startDate || new Date());
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentView, setCurrentView] = useState('month'); // 'month', 'year', 'decade'
  const [originalViewDate, setOriginalViewDate] = useState(startDate || new Date()); // Guardar fecha original

  // Custom formatter for month/year (3-letter month abbreviation)
  const formatMonthYear = (locale, date) => {
    return monthAbbreviations[date.getMonth()] + " " + date.getFullYear();
  };

  // Custom formatter for month names in month view (shows only 3 letters)
  const formatMonth = (locale, date) => {
    return monthAbbreviations[date.getMonth()];
  };



  // ✅ Sync props → internal state (e.g. when socket sets new range)
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      setSelectedRange([start, end]);
      setCalendarViewDate(start); // Optional: update calendar view as well
      setOriginalViewDate(start); // Actualizar también la fecha original
    }
  }, [startDate, endDate]);

  const handleDateChange = (range) => {
    setIsAnimating(true);
    setSelectedRange(range);
    setStartDate(range[0]);
    setEndDate(range[1]);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleViewChange = ({ action, activeStartDate, value, view }) => {
    // Si estamos saliendo de la vista de mes, guardar la fecha actual como original
    if (currentView === 'month' && view !== 'month') {
      setOriginalViewDate(calendarViewDate);
    }
    setCurrentView(view);
    setCalendarViewDate(activeStartDate);
  };

  const goBackToMonth = () => {
    setCurrentView('month');
    setCalendarViewDate(originalViewDate); // Regresar a la fecha original
  };

  const handleNavigation = (direction) => {
    setIsAnimating(true);
    const newDate = new Date(calendarViewDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCalendarViewDate(newDate);
    setTimeout(() => setIsAnimating(false), 200);
  };

  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      
      // Check if date is in selected range
      const isInRange = selectedRange && selectedRange[0] && selectedRange[1] &&
        date >= selectedRange[0] && date <= selectedRange[1];
      
      // Check if date is start or end of range
      const isStart = selectedRange && selectedRange[0] && 
        date.toDateString() === selectedRange[0].toDateString();
      const isEnd = selectedRange && selectedRange[1] && 
        date.toDateString() === selectedRange[1].toDateString();
      
      if (isStart || isEnd) {
        return "modern-calendar-range-endpoint";
      }
      if (isInRange) {
        return "modern-calendar-range";
      }
      if (isToday) {
        return "modern-calendar-today";
      }
    }
    return "modern-calendar-tile";
  };

  return (
    <div className={`modern-calendar-container ${isAnimating ? 'animating' : ''}`}>
      <div className="modern-calendar-glow"></div>
      <div className="modern-calendar-inner">
        {(currentView === 'year' || currentView === 'decade') && (
          <div className="calendar-back-button">
            <button onClick={goBackToMonth} className="back-to-month-btn">
              ← Back to Calendar
            </button>
          </div>
        )}
        <ReactCalendar
          value={selectedRange}
          activeStartDate={calendarViewDate}
          onActiveStartDateChange={({ activeStartDate }) => setCalendarViewDate(activeStartDate)}
          onViewChange={handleViewChange}
          className="modern-calendar"
          selectRange
          onChange={handleDateChange}
          tileClassName={tileClassName}
          showDoubleView={false}
          locale="en-US"
          formatMonthYear={formatMonthYear}
          formatMonth={formatMonth}
          view={currentView}
        />
      </div>
    </div>
  );
}