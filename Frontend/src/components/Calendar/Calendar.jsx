import React, { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  X,
  Calendar as CalendarIcon,
} from "lucide-react";
import TimeIcon from "../../assets/Calendar/Date.webp";
import link from "../../assets/Calendar/add_link.webp";
import person from "../../assets/Calendar/person_add.webp";
import segment from "../../assets/Calendar/segment.webp";
import options from "../../assets/Calendar/options.webp";
import day from "../../assets/Calendar/day.webp";
import { useConfirm } from "../ConfirmContext";
import calendarService from "./utils/calendarService";
import { useNotification } from "../NotificationContext";

const Calendar = () => {
  const confirm = useConfirm();
    const { notify } = useNotification();
  const [currentEmployeeId, setCurrentEmployeeId] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const hideTimeout = useRef(null);
  const today = new Date();
  const [showCodes, setShowCodes] = useState(false);
  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), today.getDate())
  );
  const [view, setView] = useState("day");
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const weekScrollRef = useRef(null);
  const monthScrollRef = useRef(null);
  const autoScrollRef = useRef(null);
  const [dragTimeout, setDragTimeout] = useState(null);

  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);

  const timeGridRef = useRef(null);
  const [frontEvent, setFrontEvent] = useState(null);
  const [lastClickTime, setLastClickTime] = useState({});

  const [monthDragStart, setMonthDragStart] = useState(null);
  const [monthDragEnd, setMonthDragEnd] = useState(null);
  const [isMonthDragging, setIsMonthDragging] = useState(false);
  const [monthDragSelection, setMonthDragSelection] = useState([]);
  const [expandedMultiDay, setExpandedMultiDay] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const [eventForm, setEventForm] = useState({
    title: "",
    eventtype: "Meeting",
    startTime: "",
    endTime: "",
    date: "",
    endDate: "",
    agenda: "",
    link: "",
    day: "workingday",
    employees: [],
    formType: "",
    employeeID: "",
  });

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const fullWeekDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  const getDatesBetween = (startDate, endDate) => {
    const dates = [];

    const start = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate()
    );
    const end = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate()
    );

    const currentDate = new Date(start);

    while (currentDate <= end) {
      dates.push(
        new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate()
        )
      );
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  };

  const handleMonthMouseDown = (date, event) => {
    if (!date || event.target.closest(".event-item")) return;
    if (!canCreateEvent()) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const selectedDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return;
    }

    const localDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    setIsMonthDragging(true);
    setMonthDragStart(localDate);
    setMonthDragEnd(localDate);
    setMonthDragSelection([localDate]);
  };

  const handleMonthMouseMove = (date, event) => {
    if (!isMonthDragging || !monthDragStart) return;

    const selectedDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return;
    }

    const localDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    setMonthDragEnd(localDate);

    const selectedDates = getDatesBetween(
      monthDragStart <= localDate ? monthDragStart : localDate,
      monthDragStart <= localDate ? localDate : monthDragStart
    );

    setMonthDragSelection(selectedDates);

    if (monthScrollRef.current) {
      checkAutoScroll(event.clientY, monthScrollRef.current);
    }
  };

  const getViewIndicator = (viewType) => {
    const displayView = viewType || view;

    const viewColors = {
      day: " text-green-700 ",
      week: " text-blue-700 ",
      month: " text-purple-700",
    };

    return (
      <div
        className={`inline-flex items-center px-[0.5vw] py-[0.2vw] rounded-full text-[0.7vw] font-medium  ${viewColors[displayView]}`}
      >
        <span className="capitalize">{displayView} View</span>
      </div>
    );
  };

  const getEventSpanForWeek = (event, weekDays) => {
    const eventStart = new Date(event.date);
    const eventEnd = new Date(event.endDate || event.date);

    const weekStart = weekDays[0];
    const weekEnd = weekDays[6];

    eventStart.setHours(0, 0, 0, 0);
    eventEnd.setHours(0, 0, 0, 0);
    weekStart.setHours(0, 0, 0, 0);
    weekEnd.setHours(0, 0, 0, 0);

    const spanStart = Math.max(
      0,
      Math.floor((eventStart - weekStart) / (24 * 60 * 60 * 1000))
    );
    const spanEnd = Math.min(
      6,
      Math.floor((eventEnd - weekStart) / (24 * 60 * 60 * 1000))
    );

    return { spanStart, spanEnd, spanDays: spanEnd - spanStart + 1 };
  };

  const getDragSelectionStyle = (date) => {
    if (!isMonthDragging || monthDragSelection.length === 0) return {};

    const isInSelection = monthDragSelection.some(
      (selDate) => selDate.toDateString() === date.toDateString()
    );

    if (!isInSelection) return {};

    const isStart =
      monthDragSelection[0].toDateString() === date.toDateString();
    const isEnd =
      monthDragSelection[monthDragSelection.length - 1].toDateString() ===
      date.toDateString();

    return {
      position: "absolute",
      top: "3vh",
      left: "0px",
      right: "0px",
      height: "2.5vh",
      backgroundColor: "rgba(59, 131, 246, 1)",
      border: "2px solid #3b82f6",
      borderRadius: "0px",
      borderTopLeftRadius: isStart ? "6px" : "0px",
      borderBottomLeftRadius: isStart ? "6px" : "0px",
      borderTopRightRadius: isEnd ? "6px" : "0px",
      borderBottomRightRadius: isEnd ? "6px" : "0px",
      pointerEvents: "none",
      zIndex: 51,
    };
  };

  const handleMonthMouseUp = () => {
    if (!isMonthDragging || !monthDragStart || !monthDragEnd) {
      resetMonthDrag();
      return;
    }

    const startDate =
      monthDragStart <= monthDragEnd ? monthDragStart : monthDragEnd;
    const endDate =
      monthDragStart <= monthDragEnd ? monthDragEnd : monthDragStart;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      resetMonthDrag();
      return;
    }

    if (monthDragSelection.length >= 1) {
      setEditingEvent(null);
      setSelectedSlot({ date: startDate, hour: 9 });

      setEventForm({
        title: "",
        eventtype: "Meeting",
        startTime: "",
        endTime: "",
        date: formatDate(startDate),
        endDate: formatDate(endDate),
        agenda: "",
        link: "",
        day: "workingday",
        employees: [],
        formType: view,
        employeeID: currentEmployeeId || "",
      });

      setShowEventModal(true);
    }

    resetMonthDrag();
  };

  const resetMonthDrag = () => {
    setIsMonthDragging(false);
    setMonthDragStart(null);
    setMonthDragEnd(null);
    setMonthDragSelection([]);
  };

  const startAutoScroll = (direction, container) => {
    if (autoScrollRef.current) return;

    const scrollSpeed = 8;
    let isScrolling = true;

    const scroll = () => {
      if (!container || !isScrolling || (!isDragging && !isMonthDragging)) {
        stopAutoScroll();
        return;
      }

      const currentScrollTop = container.scrollTop;
      const maxScroll = container.scrollHeight - container.clientHeight;

      if (direction > 0 && currentScrollTop < maxScroll) {
        const newScrollTop = Math.min(
          currentScrollTop + scrollSpeed,
          maxScroll
        );
        container.scrollTop = newScrollTop;
      } else if (direction < 0 && currentScrollTop > 0) {
        const newScrollTop = Math.max(currentScrollTop - scrollSpeed, 0);
        container.scrollTop = newScrollTop;
      } else {
        stopAutoScroll();
        return;
      }
    };

    autoScrollRef.current = setInterval(scroll, 16);
  };

  const stopAutoScroll = () => {
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  };

  const checkAutoScroll = (clientY, container) => {
    if (!container || (!isDragging && !isMonthDragging)) return;
    const rect = container.getBoundingClientRect();
    const scrollZone = 100;
    const relativeY = clientY - rect.top;

    stopAutoScroll();

    let headerHeight = 0;
    if (view === "week") {
      const headerElements = container.querySelectorAll(".sticky");
      if (headerElements.length > 0) {
        headerHeight = headerElements[0].offsetHeight;
      } else {
        headerHeight = 174;
      }
    } else if (view === "day") {
      headerHeight = container.querySelector(".sticky")?.offsetHeight || 0;
    } else if (view === "month") {
      const headerElement = container.querySelector(
        ".grid.grid-cols-7.border-b"
      );
      headerHeight = headerElement?.offsetHeight || 0;
    }

    const adjustedRelativeY = relativeY - headerHeight;
    const scrollableHeight = rect.height - headerHeight;

    const atTop = adjustedRelativeY < scrollZone && container.scrollTop > 0;
    const atBottom =
      adjustedRelativeY > scrollableHeight - scrollZone &&
      container.scrollTop < container.scrollHeight - container.clientHeight;

    if (atTop) {
      startAutoScroll(-1, container);
    } else if (atBottom) {
      startAutoScroll(1, container);
    }
  };

  const getTimeFromPosition = (element, clientY, isWeekView = false) => {
    if (!element)
      return { hour: 0, minute: 0, decimal: 0, display: "12:00 AM" };

    const rect = element.getBoundingClientRect();
    let relativeY;

    if (isWeekView) {
      const stickyHeader = element.querySelector(".sticky");
      const headerHeight = stickyHeader ? stickyHeader.offsetHeight : 174;

      relativeY = Math.max(
        0,
        clientY - rect.top - headerHeight + element.scrollTop
      );
    } else {
      const scrollTop = element.scrollTop || 0;
      relativeY = Math.max(0, clientY - rect.top + scrollTop);
    }

    const hourHeight = 64;
    const totalMinutes = (relativeY / hourHeight) * 60;

    const roundedMinutes = Math.round(totalMinutes / 15) * 15;
    const hour = Math.floor(roundedMinutes / 60);
    const minute = roundedMinutes % 60;

    let clampedHour = Math.max(0, Math.min(24, hour));
    let clampedMinute = Math.max(0, Math.min(59, minute));

    if (clampedHour === 24) {
      clampedMinute = 0;
    }

    let displayHour = clampedHour;
    let displayMinute = clampedMinute;
    let suffix = "AM";

    if (clampedHour === 0 && clampedMinute === 0) {
      displayHour = 12;
      suffix = "AM";
    } else if (clampedHour === 24 && clampedMinute === 0) {
      displayHour = 12;
      suffix = "AM";
    } else {
      suffix = clampedHour >= 12 ? "PM" : "AM";
      displayHour = clampedHour % 12 || 12;
    }

    const displayTime = `${displayHour
      .toString()
      .padStart(2, "0")}:${displayMinute
      .toString()
      .padStart(2, "0")} ${suffix}`;

    return {
      hour: clampedHour,
      minute: clampedMinute,
      decimal: clampedHour + clampedMinute / 60,
      display: displayTime,
    };
  };

  const timeToDecimal = (timeStr) => {
    const [hour, minute] = timeStr.split(":").map(Number);
    return hour + minute / 60;
  };

  const decimalToTime = (decimal) => {
    let hour = Math.floor(decimal);
    let minute = Math.round((decimal - hour) * 60);

    if (minute === 60) {
      minute = 0;
      hour++;
    }

    if (hour >= 24) {
      hour = 0;
      minute = 0;
    }

    return `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSelect = (e) => {
    const selectedId = e.target.value;
    if (selectedId && !eventForm.employees.includes(selectedId)) {
      setEventForm({
        ...eventForm,
        employees: [...eventForm.employees, selectedId],
      });
    }
    setSelectedEmployee("");
  };

  const getEmployeeName = (employeeId) => {
    if (!Array.isArray(employees) || employees.length === 0) {
      return employeeId;
    }

    const employee = employees.find((emp) => emp._id === employeeId);

    if (!employee) {
      return employeeId;
    }

    if (employee.employeeName) {
      return `${employee.employeeName}`;
    }

    return employeeId;
  };

  const handleCancel = () => {
    setShowEventModal(false);
    setEditingEvent(null);
    clearModalData();
    setTitleError(false);
  };

  const clearModalData = () => {
    setEventForm({
      title: "",
      eventtype: "Meeting",
      startTime: "",
      endTime: "",
      date: "",
      endDate: "",
      agenda: "",
      link: "",
      day: "workingday",
      employees: [],
      formType: "",
      employeeID: currentEmployeeId || "",
    });
  };

  const handleEventClick = (event, e) => {
    if (e) e.stopPropagation();

    const currentTime = Date.now();
    const lastClick = lastClickTime[event._id] || 0;
    const timeDiff = currentTime - lastClick;

    setLastClickTime((prev) => ({
      ...prev,
      [event._id]: currentTime,
    }));

    if (frontEvent === event._id && timeDiff < 500) {
      setEditingEvent(event);

      const formData = {
        title: event.title,
        eventtype: event.eventtype,
        startTime: event.startTime || "",
        endTime: event.endTime || "",
        date: event.date,
        endDate: event.endDate || event.date,
        agenda: event.agenda || "",
        link: event.link || "",
        day: event.day || "workingday",
        employees: event.employees || [],
        formType: event.formType,
        employeeID: event.employeeID || currentEmployeeId || "",
      };

      setEventForm(formData);
      setShowEventModal(true);
      return;
    }

    if (frontEvent === event._id) {
      setEditingEvent(event);

      const formData = {
        title: event.title,
        eventtype: event.eventtype,
        startTime: event.startTime || "",
        endTime: event.endTime || "",
        date: event.date,
        endDate: event.endDate || event.date,
        agenda: event.agenda || "",
        link: event.link || "",
        day: event.day || "workingday",
        employees: event.employees || [],
        formType: event.formType,
        employeeID: event.employeeID || currentEmployeeId || "",
      };

      setEventForm(formData);
      setShowEventModal(true);
    } else {
      setFrontEvent(event._id);
    }
  };

  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatTime = (hour) => {
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour.toString().padStart(2, "0")}:00 ${ampm}`;
  };

  const formatTimewithSec = (timeStr) => {
    const [hour, minute] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hour, minute);

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const navigateDay = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const handleNavigation = (direction) => {
    switch (view) {
      case "day":
        navigateDay(direction);
        break;
      case "week":
        navigateWeek(direction);
        break;
      case "month":
        navigateMonth(direction);
        break;
    }
  };

  const handleDatePickerSelect = (selectedDate, selectedView = null) => {
    setCurrentDate(selectedDate);
    if (selectedView) {
      setView(selectedView);
    }
    setShowDatePicker(false);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(
        year,
        month - 1,
        new Date(year, month, 0).getDate() - i
      );
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }

    const remainingSlots = 42 - days.length;
    for (let day = 1; day <= remainingSlots; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const getWeekDays = (date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push(day);
    }
    return weekDays;
  };

  const handleTimeSlotClick = (date, hour, event = null) => {
    if (isDragging || isDraggingRef.current) return;

    if (!canCreateEvent()) {
      return;
    }

    const now = new Date();
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return;
    }

    if (selectedDate.getTime() === today.getTime()) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentDecimal = currentHour + currentMinute / 60;
      const clickedDecimal = hour;

      if (clickedDecimal < currentDecimal) {
        return;
      }
    }

    if (event) {
      event.stopPropagation();
    }

    setEditingEvent(null);
    setSelectedSlot({ date, hour });
    setEventForm({
      title: "",
      eventtype: "Meeting",
      startTime: ``,
      endTime: ``,
      date: formatDate(date),
      endDate: formatDate(date),
      agenda: "",
      link: "",
      day: "workingday",
      employees: [],
      formType: view,
      employeeID: currentEmployeeId || "",
    });
    setShowEventModal(true);
  };

  const handleDayClick = (date) => {
    if (view === "month") {
      if (!canCreateEvent()) {
        return;
      }

      const selectedDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        return;
      }

      setEditingEvent(null);
      setSelectedSlot({ date, hour: 9 });

      const localDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );

      setEventForm({
        title: "",
        eventtype: "Meeting",
        startTime: "",
        endTime: "",
        date: formatDate(localDate),
        endDate: formatDate(localDate),
        agenda: "",
        link: "",
        day: "workingday",
        employees: [],
        formType: view,
        employeeID: currentEmployeeId || "",
      });
      setShowEventModal(true);
    }
  };

  const getHeaderEventsForDate = (date) => {
    const dateStr = formatDate(date);

    return events.filter((event) => {
      const hasEmptyTime = event.startTime === "" && event.endTime === "";
      const isSingleDay = event.date === (event.endDate || event.date);

      if (event.date === dateStr && isSingleDay && hasEmptyTime) {
        return true;
      }
      if (!isSingleDay) {
        const eventStart = new Date(event.date);
        const eventEnd = new Date(event.endDate);
        const checkDate = new Date(dateStr);

        eventStart.setHours(0, 0, 0, 0);
        eventEnd.setHours(0, 0, 0, 0);
        checkDate.setHours(0, 0, 0, 0);

        return checkDate >= eventStart && checkDate <= eventEnd;
      }

      return false;
    });
  };

  const handleMouseDown = (date, event) => {
    if (view !== "day" && view !== "week") return;

    if (!canCreateEvent()) {
      return;
    }

    event.preventDefault();

    const now = new Date();
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return;
    }

    let timeInfo;
    if (view === "day" && timeGridRef.current) {
      timeInfo = getTimeFromPosition(timeGridRef.current, event.clientY, false);
    } else if (view === "week" && weekScrollRef.current) {
      timeInfo = getTimeFromPosition(
        weekScrollRef.current,
        event.clientY,
        true
      );
    } else {
      return;
    }

    if (selectedDate.getTime() === today.getTime()) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentDecimal = currentHour + currentMinute / 60;

      if (timeInfo.decimal < currentDecimal) {
        return;
      }
    }

    setIsDragging(true);
    isDraggingRef.current = true;

    setDragStart({ date, ...timeInfo });
    setDragEnd({ date, ...timeInfo });
  };

  const handleMouseMove = (date, event) => {
    if (!isDragging) return;

    event.preventDefault();

    const now = new Date();
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return;
    }

    let timeInfo;
    if (view === "day" && timeGridRef.current) {
      timeInfo = getTimeFromPosition(timeGridRef.current, event.clientY, false);
    } else if (view === "week" && weekScrollRef.current) {
      timeInfo = getTimeFromPosition(
        weekScrollRef.current,
        event.clientY,
        true
      );
    } else {
      return;
    }

    if (selectedDate.getTime() === today.getTime()) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentDecimal = currentHour + currentMinute / 60;

      if (timeInfo.decimal < currentDecimal) {
        return;
      }
    }

    setDragEnd({ date, ...timeInfo });
  };

  const handleMouseUp = () => {
    stopAutoScroll();

    if (!isDragging || !dragStart || !dragEnd) {
      setIsDragging(false);
      isDraggingRef.current = false;
      setDragStart(null);
      setDragEnd(null);
      return;
    }

    const now = new Date();
    const selectedDate = new Date(dragStart.date);
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setIsDragging(false);
      isDraggingRef.current = false;
      setDragStart(null);
      setDragEnd(null);
      return;
    }

    const startTime = Math.min(dragStart.decimal, dragEnd.decimal);
    const endTime = Math.max(dragStart.decimal, dragEnd.decimal);

    if (selectedDate.getTime() === today.getTime()) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentDecimal = currentHour + currentMinute / 60;

      if (startTime < currentDecimal) {
        setIsDragging(false);
        isDraggingRef.current = false;
        setDragStart(null);
        setDragEnd(null);
        return;
      }
    }

    const durationMinutes = (endTime - startTime) * 60;

    setIsDragging(false);
    isDraggingRef.current = false;

    if (durationMinutes >= 15) {
      setEditingEvent(null);
      setSelectedSlot({ date: dragStart.date, hour: Math.floor(startTime) });

      const startTimeStr = decimalToTime(startTime);
      const endTimeStr = decimalToTime(endTime);

      setTimeout(() => {
        setEventForm({
          title: "",
          eventtype: "Meeting",
          startTime: startTimeStr,
          endTime: endTimeStr,
          date: formatDate(dragStart.date),
          endDate: formatDate(dragStart.date),
          agenda: "",
          link: "",
          day: "workingday",
          employees: [],
          formType: view,
          employeeID: currentEmployeeId || "",
        });
        setShowEventModal(true);
      }, 0);
    }

    setDragStart(null);
    setDragEnd(null);
  };

  const isPositionInDragRange = (date, decimal) => {
    if (!isDragging || !dragStart || !dragEnd) return false;

    const isSameDate = date.toDateString() === dragStart.date.toDateString();
    if (!isSameDate) return false;

    const minTime = Math.min(dragStart.decimal, dragEnd.decimal);
    const maxTime = Math.max(dragStart.decimal, dragEnd.decimal);

    return decimal >= minTime && decimal <= maxTime;
  };

  useEffect(() => {
    const storedUser =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);

        // Support multiple possible keys for employee id (userName used by session)
        const possibleId =
          userData._id ||
          userData.id ||
          userData.employeeID ||
          userData.employee_id ||
          userData.userName ||
          userData.user_name ||
          null;

        setCurrentEmployeeId(possibleId);
        setCurrentUserRole(userData.role || userData.userRole || userData.user_role || null);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (!isSocketConnected) {
      return;
    }

    const handleEventCreated = (data) => {
      if (data.success && data.data) {
        if (data.data.employeeID === currentEmployeeId) {
          return;
        }

        setEvents((prevEvents) => {
          const exists = prevEvents.some((e) => e._id === data.data._id);
          if (exists) {
            return prevEvents;
          }
          return [...prevEvents, data.data];
        });
      }
    };

    const handleEventUpdated = (data) => {
      if (data.success && data.data) {
        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event._id === data.data._id ? data.data : event
          )
        );
      }
    };

    const handleEventDeleted = (data) => {
      if (data.success && data.eventId) {
        setEvents((prevEvents) =>
          prevEvents.filter((event) => event._id !== data.eventId)
        );
      }
    };

  }, [currentEmployeeId]);

  useEffect(() => {
    const handleGlobalMouseUp = (e) => {
      if (isDragging) {
        handleMouseUp();
      }
      if (dragTimeout) {
        clearTimeout(dragTimeout);
        setDragTimeout(null);
      }
    };

    const handleGlobalMouseMove = (e) => {
      if (!isDragging) return;

      e.preventDefault();

      let container = null;
      if (view === "day" && timeGridRef.current) {
        container = timeGridRef.current;
      } else if (view === "week" && weekScrollRef.current) {
        container = weekScrollRef.current;
      }

      if (!container) return;

      checkAutoScroll(e.clientY, container);

      if (view === "week") {
        const rect = container.getBoundingClientRect();
        const relativeX = e.clientX - rect.left;
        const timeColumnWidth = rect.width * 0.05;
        const dayColumnWidth = (rect.width - timeColumnWidth) / 7;

        if (relativeX > timeColumnWidth) {
          const dayIndex = Math.floor(
            (relativeX - timeColumnWidth) / dayColumnWidth
          );
          if (dayIndex >= 0 && dayIndex < 7) {
            const weekDays = getWeekDays(currentDate);
            const day = weekDays[dayIndex];
            if (
              day &&
              dragStart &&
              day.toDateString() === dragStart.date.toDateString()
            ) {
              const timeInfo = getTimeFromPosition(container, e.clientY, true);
              setDragEnd({ date: day, ...timeInfo });
            }
          }
        }
      } else if (view === "day") {
        const timeInfo = getTimeFromPosition(container, e.clientY, false);
        setDragEnd({ date: currentDate, ...timeInfo });
      }
    };

    const handleGlobalMouseLeave = () => {
      if (isDragging) {
        stopAutoScroll();
      }
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);
    document.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("mouseleave", handleGlobalMouseLeave);

    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseleave", handleGlobalMouseLeave);

      stopAutoScroll();
      if (dragTimeout) {
        clearTimeout(dragTimeout);
      }
    };
  }, [isDragging, view, dragTimeout, currentDate]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);
        const employeesData = await calendarService.getAllEmployees();

        if (Array.isArray(employeesData)) {
          setEmployees(employeesData);
        } else {
          console.info("Employee service returned no employees or unexpected shape", employeesData);
          setEmployees([]);
        }
      } catch (error) {
        console.info("Failed to fetch employees:", error);
        setEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    const handleGlobalMonthMouseUp = (e) => {
      if (isMonthDragging) {
        stopAutoScroll();
        handleMonthMouseUp();
      }
    };

    const handleGlobalMonthMouseMove = (e) => {
      if (!isMonthDragging) return;

      if (monthScrollRef.current) {
        checkAutoScroll(e.clientY, monthScrollRef.current);
      }

      const element = document.elementFromPoint(e.clientX, e.clientY);
      const dateCell = element?.closest("[data-date]");

      if (dateCell) {
        const dateStr = dateCell.getAttribute("data-date");
        if (dateStr) {
          const date = new Date(dateStr);
          handleMonthMouseMove(date, e);
        }
      }
    };

    document.addEventListener("mouseup", handleGlobalMonthMouseUp);
    document.addEventListener("mousemove", handleGlobalMonthMouseMove);

    return () => {
      document.removeEventListener("mouseup", handleGlobalMonthMouseUp);
      document.removeEventListener("mousemove", handleGlobalMonthMouseMove);
    };
  }, [isMonthDragging, monthDragStart, monthDragEnd]);

  useEffect(() => {
    if (!isDragging) {
      stopAutoScroll();
      if (dragTimeout) {
        clearTimeout(dragTimeout);
        setDragTimeout(null);
      }
    }
  }, [isDragging]);

  useEffect(() => {
    return () => {
      stopAutoScroll();
      if (dragTimeout) {
        clearTimeout(dragTimeout);
      }
    };
  }, []);

  useEffect(() => {
    setExpandedMultiDay(false);
  }, [currentDate, view]);

  const canEditEvent = (event) => {
    if (!event || !currentEmployeeId) return false;

    const now = new Date();
    const eventEndDate = new Date(event.endDate || event.date);

    if (event.endTime) {
      const [endHour, endMinute] = event.endTime.split(":").map(Number);
      eventEndDate.setHours(endHour, endMinute, 0, 0);
    } else {
      eventEndDate.setHours(23, 59, 59, 999);
    }

    if (eventEndDate < now) {
      return false;
    }

    if (currentUserRole === "Super Admin") return true;

    return event.employeeID === currentEmployeeId;
  };

  const canCreateEvent = () => {
    return currentUserRole !== "Employee";
  };

  const getEventsForDate = (date) => {
    const dateStr = formatDate(date);
    return events.filter((event) => {
      const eventStart = new Date(event.date);
      const eventEnd = new Date(event.endDate || event.date);
      const checkDate = new Date(dateStr);

      eventStart.setHours(0, 0, 0, 0);
      eventEnd.setHours(0, 0, 0, 0);
      checkDate.setHours(0, 0, 0, 0);

      return checkDate >= eventStart && checkDate <= eventEnd;
    });
  };

  const getOverlappingEvents = (events, targetEvent) => {
    return events.filter((event) => {
      if (event._id === targetEvent._id) return false;

      const [targetStart, targetStartMin] = targetEvent.startTime
        .split(":")
        .map(Number);
      const [targetEnd, targetEndMin] = targetEvent.endTime
        .split(":")
        .map(Number);
      const [eventStart, eventStartMin] = event.startTime
        .split(":")
        .map(Number);
      const [eventEnd, eventEndMin] = event.endTime.split(":").map(Number);

      const targetStartDecimal = targetStart + targetStartMin / 60;
      const targetEndDecimal = targetEnd + targetEndMin / 60;
      const eventStartDecimal = eventStart + eventStartMin / 60;
      const eventEndDecimal = eventEnd + eventEndMin / 60;

      return (
        targetStartDecimal < eventEndDecimal &&
        targetEndDecimal > eventStartDecimal
      );
    });
  };

  const getEventPositioning = (event) => {
    const [startHour, startMinute] = event.startTime.split(":").map(Number);
    const [endHour, endMinute] = event.endTime.split(":").map(Number);

    let startDecimal = startHour + startMinute / 60;
    let endDecimal = endHour + endMinute / 60;

    if (endHour === 0 && endMinute === 0 && startDecimal < 24) {
      endDecimal = 24.0;
    }

    const topOffset = (startMinute / 60) * 64;
    const duration = endDecimal - startDecimal;
    const height = Math.max(duration * 64, 20);

    return {
      topOffset,
      height,
      startHour: Math.floor(startDecimal),
      endHour: Math.floor(endDecimal === 24 ? 23 : endDecimal),
    };
  };

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await calendarService.getAllEvents();
        setEvents(response);
      } catch (error) {
        console.error("Failed to load events:", error);
      }
    };
    loadEvents();
  }, []);

  const getEventCountForDate = (date) => {
    const dateStr = formatDate(date);

    const timeSlotEvents = events.filter((event) => {
      if (event.date === dateStr) return true;

      if (event.endDate && event.endDate !== event.date) {
        const eventStart = new Date(event.date);
        const eventEnd = new Date(event.endDate);
        const checkDate = new Date(dateStr);

        eventStart.setHours(0, 0, 0, 0);
        eventEnd.setHours(0, 0, 0, 0);
        checkDate.setHours(0, 0, 0, 0);

        return checkDate >= eventStart && checkDate <= eventEnd;
      }

      return false;
    });

    return timeSlotEvents.length;
  };

  const saveEvent = async () => {
    if (!eventForm.title) {
      setTitleError(true);
      setTimeout(() => {
        const titleInput = document.querySelector(
          'input[placeholder="Add title"]'
        );
        if (titleInput) {
          titleInput.focus();
        }
      }, 0);
      return;
    }

    setTitleError(false);

    if (!currentEmployeeId) {
      notify({
        title: "Warning",
        message: `Employee ID not found. Please login again.`,
      });
      return;
    }

    if (editingEvent && !canEditEvent(editingEvent)) {
      notify({
        title: "Warning",
        message: `You don't have permission to update this event`,
      });
      return;
    }

    if (!editingEvent && !canCreateEvent()) {
      notify({
        title: "Warning",
        message: `You don't have permission to create events`,
      });
      return;
    }

    try {
      const eventData = {
        title: eventForm.title,
        eventtype: eventForm.eventtype,
        date: eventForm.date,
        endDate: eventForm.endDate || eventForm.date,
        agenda: eventForm.agenda,
        formType: eventForm.formType || view,
        employeeID: editingEvent ? editingEvent.employeeID : currentEmployeeId,
      };

      if (eventForm.eventtype === "Meeting") {
        eventData.startTime = eventForm.startTime;
        eventData.endTime = eventForm.endTime;
        eventData.link = eventForm.link;
        // backend expects `attendees` field
        eventData.attendees = eventForm.employees || [];
      } else if (eventForm.eventtype === "Special day") {
        eventData.startTime = eventForm.startTime;
        eventData.endTime = eventForm.endTime;
        eventData.day = eventForm.day;
      }

      if (editingEvent) {
        const response = await calendarService.updateEvent(
          editingEvent._id,
          eventData
        );
        setEvents(
          events.map((event) =>
            event._id === editingEvent._id ? response : event
          )
        );
      } else {
        const response = await calendarService.createEvent(eventData);
        setEvents([...events, response]);
      }

      setShowEventModal(false);
      setEditingEvent(null);
      clearModalData();
      setTitleError(false);
    } catch (error) {
      notify({
        title: "Error",
        message: `${error} `,
      });
    }
  };

  const deleteEvent = async () => {
    if (!editingEvent) return;

    if (!canEditEvent(editingEvent)) {
      notify({
        title: "Warning",
        message: `You don't have permission to delete this event`,
      });
      return;
    }

    const ok = await confirm({
      type: "error",
      title: `Are you sure you want to delete "${editingEvent.title}"?`,
      message: "This action cannot be undone.\nAre you sure?",
      confirmText: "Yes, Delete",
      cancelText: "Cancel",
    });

    if (ok) {
      try {
        await calendarService.deleteEvent(editingEvent._id, currentEmployeeId);
        setEvents(events.filter((event) => event._id !== editingEvent._id));
        setShowEventModal(false);
        setEditingEvent(null);
        clearModalData();
        setTitleError(false);
      } catch (error) {
        notify({
          title: "Error",
          message: `Failed to delete event: ${error} `,
        });
      }
    }
  };

  const loadEventsForView = async () => {
    try {
      let response;
      if (view === "day") {
        response = await calendarService.getEventsByDate(
          formatDate(currentDate)
        );
      } else if (view === "week") {
        const weekDays = getWeekDays(currentDate);
        response = await calendarService.getEventsByRange(
          formatDate(weekDays[0]),
          formatDate(weekDays[6])
        );
      } else if (view === "month") {
        const days = getDaysInMonth(currentDate);
        response = await calendarService.getEventsByRange(
          formatDate(days[0].date),
          formatDate(days[days.length - 1].date)
        );
      }
      setEvents(response);
    } catch (error) {
      console.error("Failed to load events:", error);
    }
  };

  useEffect(() => {
    loadEventsForView();
  }, [view, currentDate]);

  const getEventDuration = (startTime, endTime) => {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const startDecimal = startHour + startMinute / 60;
    let endDecimal = endHour + endMinute / 60;

    if (endHour === 0 && endMinute === 0 && startDecimal > 0) {
      endDecimal = 24;
    }

    return (endDecimal - startDecimal) * 60;
  };

  const renderDatePicker = () => (
    <div className="absolute top-full left-[-3vw] mt-[0.5vw] bg-white rounded-[0.8vw] shadow-xl border border-[#4eadf5] border-[0.15vw] w-[15vw] p-[1vw] z-50 text-black">
      <div className="flex justify-between items-center mb-[0.6vw]">
        <button
          onClick={() => {
            const newDate = new Date(currentDate);
            newDate.setMonth(newDate.getMonth() - 1);
            setCurrentDate(newDate);
          }}
          className="p-[0.4vw] hover:bg-gray-100 rounded-full"
        >
          <ChevronLeft className="w-[1.3vw] h-[1.3vw]" />
        </button>
        <div className="text-[0.75vw] font-medium">
          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </div>
        <button
          onClick={() => {
            const newDate = new Date(currentDate);
            newDate.setMonth(newDate.getMonth() + 1);
            setCurrentDate(newDate);
          }}
          className="p-[0.4vw] hover:bg-gray-100 rounded-full"
        >
          <ChevronRight className="w-[1.3vw] h-[1.3vw]" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-[0.65vw]">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <div
            key={index}
            className="text-center font-medium text-gray-500 p-[0.4vw]"
          >
            {day}
          </div>
        ))}

        {getDaysInMonth(currentDate)
          .slice(0, 35)
          .map(({ date, isCurrentMonth }, index) => {
            const isToday = date.toDateString() === today.toDateString();
            const isSelected =
              date.toDateString() === currentDate.toDateString();

            return (
              <button
                key={index}
                onClick={() => handleDatePickerSelect(date)}
                className={`text-center px-[0.4vw] py-[0.3vw] rounded hover:bg-gray-100 text-[0.7vw] ${
                  !isCurrentMonth
                    ? "text-gray-300"
                    : isSelected
                    ? "bg-blue-600 text-white"
                    : isToday
                    ? "bg-blue-100 text-blue-600 font-semibold"
                    : "text-gray-700"
                }`}
              >
                {date.getDate()}
              </button>
            );
          })}
      </div>
    </div>
  );

  const renderDayView = () => (
    <div className="flex-1 text-black bg-white rounded-[1vw] max-h-[88%] overflow-hidden">
      <div className="sticky top-0 p-[0.4vw] bg-white border-b  border-gray-200 h-[20.5%] max-h-[20.5%] ">
        <div className="text-center relative">
          <div
            className={`text-[1.3vw] font-semibold ${
              currentDate.toDateString() === today.toDateString()
                ? "text-blue-600"
                : "text-gray-800"
            }`}
          >
            {currentDate.getDate()}
          </div>

          <div className="text-[0.9vw] text-gray-600 flex items-center justify-center gap-[0.3vw]">
            <span>{fullWeekDays[currentDate.getDay()]}</span>
            {getEventCountForDate(currentDate) > 0 && (
              <span className="bg-blue-500 text-white flex items-center justify-center text-[0.7vw] px-[0.45vw] py-[0.1vw] rounded-full font-medium">
                {getEventCountForDate(currentDate)}
              </span>
            )}
          </div>
        </div>

        {(() => {
          const headerEvents = getHeaderEventsForDate(currentDate);
          if (headerEvents.length === 0) return null;

          return (
            <div className="mt-[0.5vw] px-[0.5vw] w-full">
              <div className="flex gap-[0.5vw] overflow-x-auto scrollbar-[1px] pb-[0.16vw] scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                {headerEvents.map((event, index) => {
                  const isMultiDay =
                    event.date !== (event.endDate || event.date);

                  const creator = employees.filter(
                    (emp) => emp._id === event.employeeID
                  );

                  return (
                    <div
                      key={event._id}
                      className={`flex-shrink-0 flex items-center justify-between px-[0.5vw] py-[0.6vw] rounded-[0.4vw] w-[20%] cursor-pointer transition-all duration-200 ${
                        event.eventtype === "Meeting"
                          ? "border-[#FA8C16] border-l-[0.3vw]  bg-[#FFEBD7] hover:bg-[#FFE2C7]"
                          : event.eventtype === "Announcement"
                          ? "bg-[#b0d9ff] border-l-[0.3vw] border-[#1890FF] hover:bg-[#7fbaf0]"
                          : event.day === "holiday"
                          ? "bg-[#e6f7e6] border-l-[0.3vw] border-[#22c55e] hover:bg-[#d9f2d9]"
                          : "bg-[#f0e6ff] border-l-[0.3vw] border-[#9254DE] hover:bg-[#ead9ff]"
                      }`}
                      onClick={(e) => handleEventClick(event, e)}
                    >
                      <div className="flex-1">
                        <div
                          className="flex items-center gap-[0.4vw]"
                          title={`Titile - ${event.title} \nAgenda - ${
                            event.agenda
                          } ${
                            event.eventtype === "Meeting" &&
                            event.employees.length > 0
                              ? `\nAttendees- ${event.employees
                                  .map((empId) => getEmployeeName(empId))
                                  .join(", ")}`
                              : ""
                          }\nCreator - ${creator[0]?.employeeName}`}
                        >
                          <div
                            className={` pt-[0.15vw] px-[0.3vw] py-[0.1vw] rounded-full text-[0.6vw] font-medium ${
                              event.eventtype === "Meeting"
                                ? " bg-[#FA8C16] text-white"
                                : event.eventtype === "Announcement"
                                ? "bg-[#1890FF] text-white"
                                : event.day === "holiday"
                                ? "bg-[#22c55e] text-white"
                                : "bg-[#9254DE] text-white"
                            }`}
                          >
                            {event.eventtype === "Meeting"
                              ? "Meet"
                              : event.eventtype === "Announcement"
                              ? "ANN"
                              : event.day === "holiday"
                              ? "HOL"
                              : "SPL"}
                          </div>

                          <div className="text-[0.8vw] font-medium ml-[0.4vw] text-gray-800 max-w-[5vw] truncate">
                            {event.title}
                          </div>

                          {event.agenda && (
                            <div className="text-[0.7vw] text-gray-600 ml-[0.4vw] max-w-[5vw] truncate">
                              {event.agenda}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-[0.6vw] text-gray-500">
                        {isMultiDay && (
                          <div className="text-[0.65vw] text-gray-600 mt-[0.1vw]">
                            {new Date(event.date).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                            })}{" "}
                            -{" "}
                            {new Date(event.endDate).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "2-digit",
                              }
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
      <div
        ref={timeGridRef}
        className="relative overflow-auto max-h-[79.5%] min-h-[79.5%] select-none"
        onMouseMove={(e) => handleMouseMove(currentDate, e)}
        onMouseUp={handleMouseUp}
      >
        {hours.map((hour) => {
          const hourDecimal = hour;
          const dateStr = formatDate(currentDate);
          const eventsInHour = events.filter((event) => {
            if (event.date !== dateStr) return false;
            if (!event.startTime || !event.endTime) return false;

            const [startHour, startMinute] = event.startTime
              .split(":")
              .map(Number);
            const [endHour, endMinute] = event.endTime.split(":").map(Number);

            const startDecimal = startHour + (startMinute || 0) / 60;
            let endDecimal = endHour + (endMinute || 0) / 60;

            if (endHour === 0 && endMinute === 0 && startDecimal > 0) {
              endDecimal = 24;
            }

            return startDecimal < hour + 1 && endDecimal > hour;
          });

          let dragOverlayStyle = {};
          if (isDragging && dragStart && dragEnd) {
            const minTime = Math.min(dragStart.decimal, dragEnd.decimal);
            const maxTime = Math.max(dragStart.decimal, dragEnd.decimal);

            if (hourDecimal <= maxTime && hourDecimal + 1 > minTime) {
              const startPercent = Math.max(0, (minTime - hourDecimal) * 100);
              const endPercent = Math.min(100, (maxTime - hourDecimal) * 100);

              if (endPercent > startPercent) {
                dragOverlayStyle = {
                  background: `linear-gradient(to bottom, 
                transparent ${startPercent}%, 
                rgba(59, 130, 246, 0.3) ${startPercent}%, 
                rgba(59, 130, 246, 0.3) ${endPercent}%, 
                transparent ${endPercent}%)`,
                  borderLeft:
                    startPercent === 0 ? "4px solid rgb(59, 130, 246)" : "none",
                };
              }
            }
          }

          return (
            <div
              key={hour}
              data-hour={hour}
              className="flex border-b border-gray-200 border-[2px] min-h-16 relative"
              onMouseDown={(e) => handleMouseDown(currentDate, e)}
              style={{ height: "64px" }}
            >
              <div className="w-[8%] text-[0.8vw] text-gray-500 border-r border-gray-200 border-r-[2px] flex justify-center items-center">
                {formatTime(hour)}
              </div>
              <div
                className="flex-1 cursor-pointer hover:bg-gray-50 relative max-w-[92%] "
                style={dragOverlayStyle}
                onClick={(e) =>
                  !eventsInHour.length &&
                  handleTimeSlotClick(currentDate, hour, e)
                }
              >
                {eventsInHour.map((event, index) => {
                  const [eventStartHour] = event.startTime
                    .split(":")
                    .map(Number);

                  if (eventStartHour !== hour || !event.startTime) return null;

                  const positioning = getEventPositioning(event);
                  const overlappingEvents = getOverlappingEvents(
                    eventsInHour,
                    event
                  );
                  const isOverlapping = overlappingEvents.length > 0;
                  const isFront = frontEvent === event._id;

                  const overlapOffset = isOverlapping ? index * 60 : 0;

                  const duration = getEventDuration(
                    event.startTime,
                    event.endTime
                  );

                  const creator = employees.filter(
                    (emp) => emp._id === event.employeeID
                  );

                  return (
                    <div
                      key={event._id}
                      className={`absolute flex  items-center gap-[20%] p-[0.2vw] pl-[0.6vw] rounded-[0.3vw] shadow-sm cursor-pointer transition-all duration-200 border-l-[0.4vw] border-[0.1vw] hover:shadow-md ${
                        event.eventtype === "Meeting"
                          ? "border-[#FA8C16] bg-[#FFEBD7] hover:bg-[#FFE2C7]"
                          : event.eventtype === "Special day"
                          ? event.day === "holiday"
                            ? "border-[#22c55e] bg-[#b6edaf] hover:bg-[#a5f0a5]"
                            : "border-[#9254DE] bg-[#d7c0f3] hover:bg-[#c7b0e3]"
                          : "border-[#FF4D4F] bg-[#ff9495] hover:bg-[#ff8485]"
                      } ${
                        isFront
                          ? `ring-2 shadow-lg ${
                              event.eventtype === "Meeting"
                                ? "ring-[#FA8C16]"
                                : event.eventtype === "Special day"
                                ? event.day === "holiday"
                                  ? "ring-[#22c55e]"
                                  : "ring-[#9254DE]"
                                : ""
                            }`
                          : ""
                      }`}
                      style={{
                        top: `calc(${positioning.topOffset}px + ${index * 2}%)`,
                        left: `${overlapOffset}px`,
                        height: `${positioning.height - 4}px`,
                        minHeight: `${positioning.height - 4}px`,
                        width: `calc(100% - ${overlapOffset + 10}px)`,
                        zIndex: isFront ? 30 : 1 + index,
                        transform: isFront ? "scale(1.01)" : "scale(1)",
                        overflow: "hidden",
                      }}
                      onClick={(e) => handleEventClick(event, e)}
                      title={`Agenda -${event.agenda}${
                        event.eventtype === "Meeting" &&
                        event.employees.length > 0
                          ? `\nAttendees- ${event.employees
                              .map((empId) => getEmployeeName(empId))
                              .join(", ")}`
                          : ""
                      }`}
                    >
                      <div
                        className="absolute right-0 top-0 bottom-0 w-[2vw] cursor-pointer flex justify-center items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFrontEvent(null);
                        }}
                      >
                        -
                      </div>

                      <div>
                        <div className={` flex gap-[1vw] `}>
                          <div className="flex items-center">
                            <div
                              className={`font-normal ${
                                duration <= 45
                                  ? duration >= 30
                                    ? "text-[1.6vh]"
                                    : "text-[1.2vh]"
                                  : "text-[2vh]"
                              } `}
                            >
                              Title -{" "}
                            </div>
                            <div
                              className={` truncate max-w-[10vw] ${
                                duration <= 45
                                  ? duration >= 30
                                    ? "text-[1.6vh]"
                                    : "text-[1.2vh]"
                                  : "text-[2vh]"
                              } ml-[0.3vw]`}
                              title={event.title}
                            >
                              {event.title}
                            </div>
                          </div>

                          <div className="flex items-center">
                            <div
                              className={`${
                                duration <= 45
                                  ? duration >= 30
                                    ? "text-[1.4vh]"
                                    : "text-[1.2vh]"
                                  : "text-[0.85vw]"
                              }`}
                            >
                              Time zone -{" "}
                            </div>
                            <div
                              className={`opacity-90 ${
                                duration <= 45
                                  ? duration >= 30
                                    ? "text-[1.3vh]"
                                    : "text-[1.2vh]"
                                  : "text-[0.8vw]"
                              } ml-[0.3vw]`}
                            >
                              {formatTimewithSec(event.startTime)} -{" "}
                              {formatTimewithSec(event.endTime)}
                            </div>
                          </div>
                        </div>

                        {duration > 59 && (
                          <div className="text-[0.8vw] max-w-[30vw] truncate">
                            Agenda - {event.agenda}
                          </div>
                        )}
                      </div>

                      <div
                        className={`absolute right-[3%] ${
                          duration >= 45 ? "top-[5%]" : ""
                        }  cursor-pointer flex gap-[0.4vw]  items-center`}
                      >
                        {creator && creator.length >= 0 && duration >= 45 && (
                          <div
                            className="relative w-[1.8vw] h-[1.8vw]"
                            title={creator[0]?.employeeName || ""}
                          >
                            {creator[0]?.profile ? (
                              <>
                                <img
                                  src={
                                    creator[0]?.profile
                                      ? import.meta.env.VITE_API_BASE_URL +
                                        creator[0]?.profile
                                      : ""
                                  }
                                  alt={creator[0]?.employeeName || ""}
                                  className="w-full h-full rounded-full object-cover shadow-sm"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.style.display = "flex";
                                  }}
                                />
                                <div className="hidden absolute inset-0 bg-blue-500 text-white rounded-full flex items-center justify-center font-medium text-[0.9vw]">
                                  {creator[0]?.employeeName?.[0]?.toUpperCase() ||
                                    "?"}
                                </div>
                              </>
                            ) : (
                              <div className=" h-full w-full bg-blue-500 text-white rounded-full flex items-center justify-center font-medium text-[0.9vw]">
                                {creator[0]?.employeeName?.[0]?.toUpperCase() ||
                                  "?"}
                              </div>
                            )}
                          </div>
                        )}

                        <div
                          className={`${
                            duration < 45 ? "flex items-center gap-[0.5vw]" : ""
                          }`}
                        >
                          <div
                            className={` ${
                              duration < 45
                                ? duration >= 30
                                  ? "text-[1.4vh]"
                                  : "text-[1.2vh]"
                                : "text-[0.8vw]"
                            } `}
                          >
                            {creator[0]?.employeeName}
                          </div>
                          <div
                            className={`opacity-90  ${
                              duration <= 45
                                ? duration >= 30
                                  ? "text-[1.4vh] mt-[-0.1vw]"
                                  : "text-[1.2vh]"
                                : "text-[0.7vw] mt-[-0.1vw]"
                            } `}
                          >
                            {new Date(event.createdAt).toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </div>
                        </div>
                      </div>

                      {event.eventtype === "Meeting" &&
                        Array.isArray(event.employees) &&
                        event.employees.length > 0 && (
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <div
                                className={`opacity-110 ${
                                  duration <= 45
                                    ? duration >= 30
                                      ? "text-[1.4vh]"
                                      : "text-[1.2vh]"
                                    : "text-[0.85vw]"
                                }`}
                              >
                                Persons -{" "}
                              </div>

                              {event.employees
                                .slice(0, 3)
                                .map((empId, index) => (
                                  <div
                                    key={index}
                                    className={`opacity-90 ${
                                      duration <= 45
                                        ? duration >= 30
                                          ? "text-[1.4vh]"
                                          : "text-[1.2vh]"
                                        : "text-[0.8vw]"
                                    } ml-[0.3vw]`}
                                  >
                                    {getEmployeeName(empId)}
                                    {index !==
                                      Math.min(2, event.employees.length - 1) &&
                                      ","}
                                  </div>
                                ))}

                              {event.employees.length > 3 && (
                                <div className="text-xs text-gray-700 ml-[0.2vw]">
                                  +{event.employees.length - 3} more
                                </div>
                              )}
                            </div>

                            {event.link.length > 0 && (
                              <div className="mt-[0.3vw]">
                                <label className="text-gray-800 font-medium">
                                  Link:{" "}
                                  <a
                                    href={event.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 underline hover:text-blue-800"
                                  >
                                    {event.link}
                                  </a>
                                </label>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  );
                })}

                {isDragging &&
                  dragStart &&
                  dragEnd &&
                  isPositionInDragRange(currentDate, hourDecimal) && (
                    <div className="absolute top-[0.4vw] right-[0.3vw] bg-blue-600 text-white text-[0.65vw] p-[0.2vw] rounded z-30">
                      {dragStart.display} - {dragEnd.display}
                    </div>
                  )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);

    const regularEvents = events.filter((event) => event.formtype !== "month");
    const monthEvents = events.filter((event) => event.formtype === "month");

    const singleDateMonthEvents = monthEvents.filter(
      (event) => event.date === (event.endDate || event.date)
    );
    const multiDateMonthEvents = monthEvents.filter(
      (event) => event.date !== (event.endDate || event.date)
    );

    const multiDayEvents = regularEvents.filter((event) => {
      if (event.date === (event.endDate || event.date)) return false;

      const eventStart = new Date(event.date);
      const eventEnd = new Date(event.endDate);
      const weekStart = new Date(weekDays[0]);
      const weekEnd = new Date(weekDays[6]);

      eventStart.setHours(0, 0, 0, 0);
      eventEnd.setHours(0, 0, 0, 0);
      weekStart.setHours(0, 0, 0, 0);
      weekEnd.setHours(0, 0, 0, 0);

      return eventStart <= weekEnd && eventEnd >= weekStart;
    });

    const weekMultiDateMonthEvents = multiDateMonthEvents.filter((event) => {
      const eventStart = new Date(event.date);
      const eventEnd = new Date(event.endDate);
      const weekStart = new Date(weekDays[0]);
      const weekEnd = new Date(weekDays[6]);

      eventStart.setHours(0, 0, 0, 0);
      eventEnd.setHours(0, 0, 0, 0);
      weekStart.setHours(0, 0, 0, 0);
      weekEnd.setHours(0, 0, 0, 0);

      return eventStart <= weekEnd && eventEnd >= weekStart;
    });

    const allMultiDayEvents = [...multiDayEvents, ...weekMultiDateMonthEvents];
    const totalMultiDayEvents = allMultiDayEvents.length;
    const shouldCollapse = totalMultiDayEvents > 2;
    const visibleMultiDayEvents =
      shouldCollapse && !expandedMultiDay
        ? allMultiDayEvents.slice(0, 2)
        : allMultiDayEvents;

    return (
      <div
        ref={weekScrollRef}
        className="flex-1 text-black max-h-[88%] overflow-auto rounded-[1vw]"
        onMouseUp={handleMouseUp}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 z-45">
          <div className="flex" style={{ height: "64px" }}>
            <div className="w-[5%] border-r border-gray-200 flex items-center"></div>
            {weekDays.map((day, index) => {
              const isToday = day.toDateString() === today.toDateString();
              const dayNames = [
                "Sun",
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
              ];
              const eventCount = getEventCountForDate(day);
              return (
                <div
                  key={day.toISOString()}
                  className="flex-1 text-center border-r border-gray-200 flex flex-col justify-center last:border-r-0"
                >
                  <div className="text-[0.7vw] text-gray-600 uppercase">
                    {dayNames[day.getDay()]}
                  </div>
                  <div
                    className={`text-[0.9vw] flex justify-center gap-[0.5vw] font-semibold mt-[0.4vw] ${
                      isToday ? "text-blue-600" : "text-gray-800"
                    }`}
                  >
                    {day.getDate()}
                    {eventCount > 0 && (
                      <span className="bg-blue-500 text-white text-[0.6vw] px-[0.5vw] py-[0.04vw] rounded-full font-medium min-w-[1.2vw] flex items-center justify-center">
                        {eventCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {allMultiDayEvents.length > 0 && (
            <div
              className="flex border-b border-gray-200 bg-gray-50 relative"
              style={{
                minHeight: expandedMultiDay
                  ? `${totalMultiDayEvents * 30}px`
                  : shouldCollapse
                  ? "60px"
                  : `${totalMultiDayEvents * 30}px`,
              }}
            >
              <div className="w-[5%] border-r border-gray-200 text-[0.6vw] text-gray-500 flex flex-col items-center justify-start pt-[0.5vw] gap-[0.3vw]">
                <span>Multi-day</span>
                {shouldCollapse && (
                  <button
                    onClick={() => setExpandedMultiDay(!expandedMultiDay)}
                    className="text-blue-600 hover:text-blue-800 text-[0.7vw] flex items-center gap-[0.2vw] cursor-pointer"
                  >
                    {expandedMultiDay ? (
                      <>
                        <ChevronLeft className="w-[0.8vw] h-[0.8vw] rotate-90" />
                        <span>Less</span>
                      </>
                    ) : (
                      <>
                        <ChevronRight className="w-[0.8vw] h-[0.8vw] rotate-90" />
                        <span>+{totalMultiDayEvents - 2}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="flex-1 flex relative p-[0.3vw]">
                {visibleMultiDayEvents.map((event, eventIndex) => {
                  const span = getEventSpanForWeek(event, weekDays);
                  const isMonthEvent = event.formtype === "month";

                  if (span.spanDays <= 0) return null;

                  const creator = employees.filter(
                    (emp) => emp._id === event.employeeID
                  );

                  return (
                    <div
                      key={event._id}
                      className={`absolute text-[0.65vw] p-[0.3vw] rounded-[0.3vw] cursor-pointer transition-all duration-200 border-l-[0.3vw]  z-10 ${
                        isMonthEvent
                          ? "border-[#FF6B35] bg-[#FFE5D9] hover:bg-[#FFD7CC]"
                          : event.eventtype === "Meeting"
                          ? "border-[#FA8C16] bg-[#FFEBD7] hover:bg-[#FFE2C7]"
                          : event.eventtype === "Announcement"
                          ? "bg-[#b0d9ff] border-l-[0.2vw] border-[#1890FF] hover:bg-[#7fbaf0]"
                          : event.eventtype === "Special day"
                          ? event.day === "holiday"
                            ? "border-[#22c55e] bg-[#b6edaf] hover:bg-[#a5f0a5]"
                            : "border-[#9254DE] bg-[#d7c0f3] hover:bg-[#c7b0e3]"
                          : "border-[#FF4D4F] bg-[#ff9495] hover:bg-[#ff8485]"
                      }`}
                      style={{
                        left: `${(span.spanStart / 7) * 100}%`,
                        width: `${(span.spanDays / 7) * 100}%`,
                        top: `${eventIndex * 30}px`,
                        height: "25px",
                      }}
                      onClick={(e) => handleEventClick(event, e)}
                      title={`Agenda - ${event.agenda}${
                        event.eventtype === "Meeting" &&
                        event.employees.length > 0
                          ? `\nAttendees - ${event.employees
                              .map((empId) => getEmployeeName(empId))
                              .join(", ")}`
                          : ""
                      }\nCreator - ${creator[0]?.employeeName}`}
                    >
                      <div className="flex items-center justify-between h-full">
                        <span
                          className="font-medium truncate max-w-[10vw]"
                          title={event.title}
                        >
                          {event.title}
                        </span>
                        <span className="text-[0.5vw] bg-white bg-opacity-50 px-1 rounded ml-2">
                          {span.spanDays}d
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex border-b border-gray-200">
            <div className="w-[5%] border-r border-gray-200 text-[0.65vw] text-gray-500 flex items-center justify-center">
              Events
            </div>
            {weekDays.map((day, index) => {
              const dateStr = formatDate(day);
              const allEventsForDay = events.filter((event) => {
                const eventStart = new Date(event.date);
                const eventEnd = new Date(event.endDate || event.date);
                const checkDate = new Date(dateStr);

                eventStart.setHours(0, 0, 0, 0);
                eventEnd.setHours(0, 0, 0, 0);
                checkDate.setHours(0, 0, 0, 0);

                return checkDate >= eventStart && checkDate <= eventEnd;
              });

              const filteredHeaderEvents = allEventsForDay.filter((event) => {
                if (event.date === (event.endDate || event.date)) {
                  if (event.formType === "month") {
                    return true;
                  }
                  return !event.startTime && !event.endTime;
                }
                return false;
              });

              return (
                <div
                  key={`header-${day.toISOString()}`}
                  className="flex-1 border-r border-gray-200 last:border-r-0 p-[0.3vw] min-h-[3vw] max-h-[5.7vw] overflow-y-auto"
                >
                  {filteredHeaderEvents.length > 0 && (
                    <div className="space-y-[0.2vw]">
                      {filteredHeaderEvents.map((event, eventIndex) => {
                        const creator = employees.filter(
                          (emp) => emp._id === event.employeeID
                        );
                        return (
                          <div
                            key={event._id}
                            className={`flex items-center justify-between p-[0.3vw] rounded-[0.2vw] cursor-pointer transition-all duration-200 text-[0.65vw] ${
                              event.eventtype === "Meeting"
                                ? "bg-[#FFEBD7] border-l-[0.2vw] border-[#FA8C16] hover:bg-[#FFD7CC]"
                                : event.eventtype === "Announcement"
                                ? "bg-[#b0d9ff] border-l-[0.2vw] border-[#1890FF] hover:bg-[#7fbaf0]"
                                : event.day === "holiday"
                                ? "bg-[#e6f7e6] border-l-[0.2vw] border-[#22c55e] hover:bg-[#d9f2d9]"
                                : "bg-[#d7c0f3] border-l-[0.2vw] border-[#9254DE] hover:bg-[#ead9ff]"
                            }`}
                            onClick={(e) => handleEventClick(event, e)}
                            title={`Agenda - ${event.agenda}${
                              event.eventtype === "Meeting" &&
                              event.employees.length > 0
                                ? `\nAttendees - ${event.employees
                                    .map((empId) => getEmployeeName(empId))
                                    .join(", ")}`
                                : ""
                            }\nCreator - ${creator[0]?.employeeName}`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-[0.5vw]">
                                <div
                                  className={`px-[0.2vw] py-[0.1vw] rounded-full text-[0.5vw] font-medium flex-shrink-0 ${
                                    event.eventtype === "Meeting"
                                      ? "bg-[#FF6B35] text-white"
                                      : event.eventtype === "Announcement"
                                      ? "bg-[#1890FF] text-white"
                                      : event.day === "holiday"
                                      ? "bg-[#22c55e] text-white"
                                      : "bg-[#9254DE] text-white"
                                  }`}
                                >
                                  {event.eventtype === "Meeting"
                                    ? "Meet"
                                    : event.eventtype === "Announcement"
                                    ? "ANN"
                                    : event.day === "holiday"
                                    ? "HOL"
                                    : "SPL"}
                                </div>
                                <div className="font-medium text-gray-800 truncate">
                                  {event.title}
                                </div>
                              </div>
                              {event.agenda && (
                                <div className="text-[0.55vw] text-gray-600 mt-[0.1vw] truncate">
                                  {event.agenda}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative bg-white">
          {hours.map((hour) => (
            <div
              key={hour}
              className="flex border-b border-gray-200"
              style={{ height: "64px" }}
              data-hour={hour}
            >
              <div className="w-[5%] text-[0.7vw] text-gray-600 border-r border-gray-200 flex items-center justify-center">
                <span>{formatTime(hour)}</span>
              </div>

              <div className="flex-1 flex">
                {weekDays.map((day, dayIndex) => {
                  const dateStr = formatDate(day);
                  const eventsInHour = regularEvents.filter((event) => {
                    if (event.date !== dateStr) return false;
                    if (!event.startTime || !event.endTime) return false;

                    const [startHour, startMinute] = event.startTime
                      .split(":")
                      .map(Number);
                    const [endHour, endMinute] = event.endTime
                      .split(":")
                      .map(Number);

                    const startDecimal = startHour + (startMinute || 0) / 60;
                    let endDecimal = endHour + (endMinute || 0) / 60;

                    if (endHour === 0 && endMinute === 0 && startDecimal > 0) {
                      endDecimal = 24;
                    }

                    return startDecimal < hour + 1 && endDecimal > hour;
                  });

                  let dragOverlayStyle = {};
                  if (
                    isDragging &&
                    dragStart &&
                    dragEnd &&
                    day.toDateString() === dragStart.date.toDateString()
                  ) {
                    const minTime = Math.min(
                      dragStart.decimal,
                      dragEnd.decimal
                    );
                    const maxTime = Math.max(
                      dragStart.decimal,
                      dragEnd.decimal
                    );

                    if (hour <= maxTime && hour + 1 > minTime) {
                      const startPercent = Math.max(0, (minTime - hour) * 100);
                      const endPercent = Math.min(100, (maxTime - hour) * 100);

                      if (endPercent > startPercent) {
                        dragOverlayStyle = {
                          background: `linear-gradient(to bottom, 
                  transparent ${startPercent}%, 
                  rgba(59, 130, 246, 0.3) ${startPercent}%, 
                  rgba(59, 130, 246, 0.3) ${endPercent}%, 
                  transparent ${endPercent}%)`,
                          borderLeft:
                            startPercent === 0
                              ? "3px solid rgb(59, 130, 246)"
                              : "none",
                        };
                      }
                    }
                  }

                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className="flex-1 border-r border-gray-200 cursor-pointer hover:bg-gray-50 relative last:border-r-0"
                      style={dragOverlayStyle}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleMouseDown(day, e);
                      }}
                      onClick={(e) =>
                        !eventsInHour.length &&
                        handleTimeSlotClick(day, hour, e)
                      }
                    >
                      {eventsInHour.map((event, index) => {
                        const [eventStartHour] = event.startTime
                          .split(":")
                          .map(Number);

                        if (eventStartHour !== hour) return null;

                        const positioning = getEventPositioning(event);
                        const overlappingEvents = getOverlappingEvents(
                          eventsInHour,
                          event
                        );
                        const isOverlapping = overlappingEvents.length > 0;
                        const isFront = frontEvent === event._id;

                        const overlapOffset = isOverlapping ? index * 13 : 0;
                        const maxOffset = 40;
                        const finalOffset = Math.min(overlapOffset, maxOffset);
                        const eventWidth = `calc(100% - ${finalOffset + 8}px)`;

                        const duration = getEventDuration(
                          event.startTime,
                          event.endTime
                        );

                        const creator = employees.filter(
                          (emp) => emp._id === event.employeeID
                        );

                        return (
                          <div
                            key={event._id}
                            className={`absolute text-black ${
                              duration < 59
                                ? "flex items-center pl-[0.3vw] rounded-[0.25vw]"
                                : "p-[0.4vw] rounded-[0.5vw]"
                            }   shadow-sm cursor-pointer transition-all duration-200 border-l-[0.3vw] border-[0.1vw] ${
                              event.eventtype === "Meeting"
                                ? "border-[#FA8C16] bg-[#FFEBD7] hover:bg-[#FFE2C7]"
                                : event.eventtype === "Special day"
                                ? event.day === "holiday"
                                  ? "border-[#22c55e] bg-[#b6edaf] hover:bg-[#a5f0a5]"
                                  : "border-[#9254DE] bg-[#d7c0f3] hover:bg-[#c7b0e3]"
                                : "border-[#FF4D4F] bg-[#ff9495] hover:bg-[#ff8485]"
                            } ${
                              isFront
                                ? `ring-2 shadow-lg ${
                                    event.eventtype === "Meeting"
                                      ? "ring-[#FA8C16]"
                                      : event.eventtype === "Special day"
                                      ? event.day === "holiday"
                                        ? "ring-[#22c55e]"
                                        : "ring-[#9254DE]"
                                      : ""
                                  }`
                                : ""
                            }`}
                            style={{
                              top: `${positioning.topOffset}px`,
                              left: `${overlapOffset}px`,
                              height: `${Math.max(positioning.height, 20)}px`,
                              width: eventWidth,
                              zIndex: isFront ? 40 : 1 + index,
                              transform: isFront ? "scale(1.02)" : "scale(1)",
                            }}
                            onClick={(e) => handleEventClick(event, e)}
                            title={`Agenda - ${event.agenda}${
                              event.eventtype === "Meeting" &&
                              event.employees.length > 0
                                ? `\nAttendees - ${event.employees
                                    .map((empId) => getEmployeeName(empId))
                                    .join(", ")}`
                                : ""
                            }\nCreator - ${creator[0]?.employeeName}`}
                          >
                            <div
                              className="absolute right-0 top-0 bottom-0 w-[2vw] cursor-pointer flex justify-center items-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFrontEvent(null);
                              }}
                            >
                              -
                            </div>

                            <div className="flex items-center">
                              <div
                                className={`font-normal ${
                                  duration <= 59
                                    ? duration <= 30
                                      ? "text-[1.5vh]"
                                      : "text-[1.8vh]"
                                    : "text-[1.8vh]"
                                } `}
                              >
                                Title -{" "}
                              </div>
                              <div
                                className={`${
                                  duration <= 59
                                    ? duration <= 30
                                      ? "text-[1.5vh]"
                                      : "text-[1.8vh]"
                                    : "text-[1.8vh]"
                                } ml-[0.3vw] truncate max-w-[5vw]`}
                                title={event.title}
                              >
                                {event.title}
                              </div>
                            </div>

                            {positioning.height > 30 && duration > 59 && (
                              <div className="opacity-90 text-[0.70vw] mt-1">
                                {formatTimewithSec(event.startTime)} -{" "}
                                {formatTimewithSec(event.endTime)}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {isDragging &&
                        dragStart &&
                        dragEnd &&
                        day.toDateString() === dragStart.date.toDateString() &&
                        isPositionInDragRange(day, hour) && (
                          <div className="absolute top-[0.2vw] right-[0.2vw] bg-blue-600 text-white text-[0.65vw] px-[0.2vw] py-[0.05vw] rounded z-30 shadow-lg">
                            {dragStart.display} - {dragEnd.display}
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    const weekRows = [];

    for (let i = 0; i < days.length; i += 7) {
      weekRows.push(days.slice(i, i + 7));
    }

    const getMultiDayEventsForWeek = (weekDays) => {
      const multiDayEvents = [];
      events.forEach((event) => {
        if (event.date !== (event.endDate || event.date)) {
          const eventStart = new Date(event.date);
          const eventEnd = new Date(event.endDate);
          const weekStart = new Date(weekDays[0].date);
          const weekEnd = new Date(weekDays[6].date);

          eventStart.setHours(0, 0, 0, 0);
          eventEnd.setHours(0, 0, 0, 0);
          weekStart.setHours(0, 0, 0, 0);
          weekEnd.setHours(0, 0, 0, 0);

          if (eventStart <= weekEnd && eventEnd >= weekStart) {
            multiDayEvents.push(event);
          }
        }
      });
      return multiDayEvents;
    };

    const getEventSegmentForWeek = (event, weekDays) => {
      const eventStart = new Date(event.date);
      const eventEnd = new Date(event.endDate);
      const weekStart = weekDays[0].date;
      const weekEnd = weekDays[6].date;

      eventStart.setHours(0, 0, 0, 0);
      eventEnd.setHours(0, 0, 0, 0);
      weekStart.setHours(0, 0, 0, 0);
      weekEnd.setHours(0, 0, 0, 0);

      let startCol = -1,
        endCol = -1;

      weekDays.forEach((day, idx) => {
        const d = new Date(day.date);
        d.setHours(0, 0, 0, 0);
        if (startCol === -1 && d >= eventStart) startCol = idx;
        if (d <= eventEnd) endCol = idx;
      });

      if (startCol === -1) startCol = 0;
      if (endCol === -1) endCol = 6;

      return {
        startCol,
        endCol,
        width: endCol - startCol + 1,
        showTitle: eventStart >= weekStart || eventStart < weekStart,
        isStart: eventStart >= weekStart,
        isEnd: eventEnd <= weekEnd,
      };
    };

    const allocateEventTracks = (multiDayEvents, weekDays) => {
      const eventsWithSegments = multiDayEvents.map((event) => ({
        event,
        segment: getEventSegmentForWeek(event, weekDays),
      }));

      eventsWithSegments.sort((a, b) => {
        if (a.segment.startCol !== b.segment.startCol) {
          return a.segment.startCol - b.segment.startCol;
        }
        return b.segment.width - a.segment.width;
      });

      const tracks = [];
      const eventTracks = new Map();

      eventsWithSegments.forEach(({ event, segment }) => {
        let trackIndex = 0;
        let placed = false;

        while (!placed) {
          if (!tracks[trackIndex]) {
            tracks[trackIndex] = [];
          }

          const isFree = tracks[trackIndex].every((occupiedEvent) => {
            const occupiedSegment = getEventSegmentForWeek(
              occupiedEvent,
              weekDays
            );
            return (
              segment.endCol < occupiedSegment.startCol ||
              segment.startCol > occupiedSegment.endCol
            );
          });

          if (isFree) {
            tracks[trackIndex].push(event);
            eventTracks.set(event._id, trackIndex);
            placed = true;
          } else {
            trackIndex++;
          }
        }
      });

      return eventTracks;
    };

    const getEventClasses = (event) => {
      if (event.eventtype === "Meeting")
        return "border-[#FA8C16] bg-[#FFEBD7] hover:bg-[#FFE2C7]";
      if (event.eventtype === "Announcement")
        return "border-[#1890FF] bg-[#b0d9ff] hover:bg-[#7fbaf0]";
      if (event.eventtype === "Special day") {
        return event.day === "holiday"
          ? "border-[#22c55e] bg-[#b6edaf] hover:bg-[#a5f0a5]"
          : "border-[#9254DE] bg-[#d7c0f3] hover:bg-[#c7b0e3]";
      }
      return "border-[#FF4D4F] bg-[#ff9495] hover:bg-[#ff8485]";
    };

    return (
      <div
        ref={monthScrollRef}
        className="flex-1 overflow-y-auto text-black max-h-[88%] bg-white rounded-[1vw]"
      >
        <div className="grid grid-cols-7 border-b border-gray-200 sticky top-0 bg-white z-5">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-[0.7vw] text-center font-medium text-gray-700 border-r border-gray-200 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="flex-1">
          {weekRows.map((weekDays, weekIndex) => {
            const multiDayEvents = getMultiDayEventsForWeek(weekDays);
            const eventTracks = allocateEventTracks(multiDayEvents, weekDays);

            return (
              <div
                key={weekIndex}
                className="relative"
                style={{ minHeight: "19vh" }}
              >
                <div className="grid grid-cols-7">
                  {weekDays.map(({ date, isCurrentMonth }, dayIndex) => {
                    const dayEvents = getEventsForDate(date).filter(
                      (e) => e.date === (e.endDate || e.date)
                    );
                    const isToday =
                      date.toDateString() === today.toDateString();

                    const overlapping = multiDayEvents.filter((e) => {
                      const s = new Date(e.date),
                        eEnd = new Date(e.endDate);
                      s.setHours(0, 0, 0, 0);
                      eEnd.setHours(0, 0, 0, 0);
                      const d = new Date(date);
                      d.setHours(0, 0, 0, 0);
                      return d >= s && d <= eEnd;
                    });

                    const daySpecificHeight =
                      overlapping.length > 0 ? overlapping.length * 3.7 : 0;

                    return (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        data-date={date.toISOString()}
                        className={`border-b border-r border-gray-200 last:border-r-0 cursor-pointer relative ${
                          !isCurrentMonth
                            ? "bg-gray-50 text-gray-400"
                            : "bg-white"
                        }`}
                        style={{
                          minHeight: "12vw",
                          padding: "0.4vw",
                          paddingTop:
                            daySpecificHeight > 0
                              ? `${daySpecificHeight + 3.9}vh`
                              : "2.5vh",
                        }}
                        onMouseDown={(e) => {
                          if (isCurrentMonth) handleMonthMouseDown(date, e);
                        }}
                        onMouseEnter={(e) => {
                          if (isMonthDragging) handleMonthMouseMove(date, e);
                        }}
                        onMouseUp={(e) => handleMonthMouseUp(date, e)}
                        onClick={(e) => {
                          if (!isCurrentMonth || isMonthDragging) return;
                          if (!e.target.closest(".event-item"))
                            handleDayClick(date);
                        }}
                      >
                        <div
                          className={`absolute top-[0.4vw] left-[0.4vw] text-[0.7vw] font-medium ${
                            isToday
                              ? "bg-blue-600 text-white rounded-full w-[1.2vw] h-[1.2vw] flex items-center justify-center text-[0.65vw]"
                              : ""
                          }`}
                        >
                          {date.getDate()}
                        </div>

                        <div
                          className="space-y-1"
                          style={{
                            marginTop: daySpecificHeight > 0 ? "0vh" : "1.1vh",
                          }}
                        >
                          {dayEvents.map((event) => {
                            const creator = employees.filter(
                              (emp) => emp._id === event.employeeID
                            );

                            return (
                              <div
                                key={event._id}
                                className={`event-item text-[0.65vw] px-[0.4vw] py-[0.8vw] flex items-center rounded cursor-pointer hover:opacity-80 border-l-[0.3vw] truncate ${getEventClasses(
                                  event
                                )}`}
                                style={{
                                  height: "2.2vh",
                                  lineHeight: "1.6vh",
                                  fontSize: "0.75vw",
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEventClick(event);
                                }}
                                title={`Agenda - ${event.agenda}${
                                  event.eventtype === "Meeting" &&
                                  event.employees.length > 0
                                    ? `\nAttendees - ${event.employees
                                        .map((empId) => getEmployeeName(empId))
                                        .join(", ")}`
                                    : ""
                                }\nCreator - ${creator[0]?.employeeName}`}
                              >
                                <span
                                  className="truncate flex-1 max-w-[6vw]"
                                  title={event.title}
                                >
                                  {event.title}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <div style={getDragSelectionStyle(date)} />
                      </div>
                    );
                  })}
                </div>

                {multiDayEvents.length > 0 && (
                  <div
                    className="absolute top-[3.7vh] left-0 right-0"
                    style={{ zIndex: 4 }}
                  >
                    {multiDayEvents.map((event) => {
                      const segment = getEventSegmentForWeek(event, weekDays);
                      const trackIndex = eventTracks.get(event._id) || 0;

                      const creator = employees.filter(
                        (emp) => emp._id === event.employeeID
                      );

                      return (
                        <div
                          key={`${event._id}-${weekIndex}`}
                          className={`absolute event-item cursor-pointer text-[0.75vw] px-[0.5vw] py-[0.8vw] flex items-center shadow-sm border-l-[0.3vw]  ${getEventClasses(
                            event
                          )} ${
                            segment.isStart && segment.isEnd
                              ? "rounded"
                              : segment.isStart
                              ? "rounded-l"
                              : segment.isEnd
                              ? "rounded-r"
                              : ""
                          }`}
                          style={{
                            left: `${(segment.startCol / 7) * 100}%`,
                            width: `${(segment.width / 7) * 100}%`,
                            top: `${trackIndex * 3.7}vh`,
                            height: "2.2vh",
                            minWidth: "60px",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                          title={`Agenda - ${event.agenda}${
                            event.eventtype === "Meeting" &&
                            event.employees.length > 0
                              ? `\nAttendees - ${event.employees
                                  .map((empId) => getEmployeeName(empId))
                                  .join(", ")}`
                              : ""
                          }\nCreator - ${creator[0]?.employeeName}`}
                        >
                          {segment.showTitle && (
                            <div className="flex items-center">
                              <span
                                className=" max-w-[10vw] truncate"
                                title={event.title}
                              >
                                {event.title}
                              </span>
                              <span className="text-[0.65vw] opacity-80 bg-white text-black px-[0.4vw] py-[0.05vw] pt-[0.2vw] ml-[1vw] rounded">
                                {new Date(event.date).toLocaleDateString(
                                  "en-GB",
                                  { day: "2-digit", month: "2-digit" }
                                )}{" "}
                                -{" "}
                                {new Date(event.endDate).toLocaleDateString(
                                  "en-GB",
                                  { day: "2-digit", month: "2-digit" }
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getViewTitle = () => {
    switch (view) {
      case "day":
        return `${fullWeekDays[currentDate.getDay()]}, ${
          months[currentDate.getMonth()]
        } ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
      case "week":
        const weekStart = getWeekDays(currentDate)[0];
        const weekEnd = getWeekDays(currentDate)[6];
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${
            months[weekStart.getMonth()]
          } ${weekStart.getDate()} - ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
        }
        return `${months[weekStart.getMonth()]} ${weekStart.getDate()} - ${
          months[weekEnd.getMonth()]
        } ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
      case "month":
        return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      default:
        return "";
    }
  };

  return (
    <div
      className="h-screen flex flex-col text-black"
      onMouseUp={handleMouseUp}
    >
      <header className=" border-gray-200 px-4 py-3">
        <div className="flex items-start justify-between relative">
          <div className="flex flex-col justify-center space-x-4 gap-[1vw]">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-[0.6vw] py-[0.2vw] text-[0.8vw] bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors border cursor-pointer"
              >
                Today
              </button>

              <div className="relative">
                <button
                  className=" bg-white flex items-center gap-2 px-[0.6vw] py-[0.2vw] text-[0.8vw] bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors border"
                  onMouseEnter={() => {
                    setShowCodes(true);
                    clearTimeout(hideTimeout.current);
                  }}
                  onMouseLeave={() => {
                    hideTimeout.current = setTimeout(
                      () => setShowCodes(false),
                      500
                    );
                  }}
                >
                  <span className=" w-[0.7vw] h-[0.7vw] rounded-full bg-red-500"></span>
                  Codes
                </button>

                {showCodes && (
                  <div className="absolute flex flex-col gap-[0.3vw] mt-[0.3vw] p-[0.4vw] bg-white border border-[#4eadf5] border-[0.13vw] rounded-xl shadow w-max text-[0.7vw] z-50">
                    <div className="flex items-center gap-[0.3vw]">
                      <div
                        className="w-[1vw] h-[1vw] border border-[#FA8C16] rounded"
                        style={{ backgroundColor: "#FFE2C7" }}
                      ></div>
                      Meeting
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-[1vw] h-[1vw] border border-[#9254DE] rounded"
                        style={{ backgroundColor: "#c7b0e3" }}
                      ></div>
                      Special day
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-[1vw] h-[1vw] border border-[#22c55e] rounded"
                        style={{ backgroundColor: "#a5f0a5" }}
                      ></div>
                      Holiday
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-[1vw] h-[1vw] border border-[#097eebff] rounded"
                        style={{ backgroundColor: "#7fbaf0" }}
                      ></div>
                      Announcement
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-[0.8vw]">
              <div className="border border-gray-600 rounded-full flex item-center justify-center p-[0.16vw] gap-[0.4vw]">
                <button
                  onClick={() => handleNavigation(-1)}
                  className="hover:bg-gray-100 rounded-full transition-colors"
                  title="Previous"
                >
                  <ChevronLeft className="w-[1.3vw] h-[1.3vw] text-gray-600 cursor-pointer" />
                </button>
                <button
                  onClick={() => handleNavigation(1)}
                  className="hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                  title="Next"
                >
                  <ChevronRight className="w-[1.3vw] h-[1.3vw] cursor-pointer" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <h2 className="text-[0.9vw] font-medium text-gray-800">
                  {getViewTitle()}
                </h2>
              </div>

              <div
                className="relative"
                onMouseEnter={() => {
                  setShowDatePicker(true);
                  clearTimeout(hideTimeout.current);
                }}
                onMouseLeave={() => {
                  hideTimeout.current = setTimeout(
                    () => setShowDatePicker(false),
                    500
                  );
                }}
              >
                <button className="p-[0.5vw] hover:bg-blue-100 text-blue-600 rounded-full transition-colors cursor-pointer">
                  <CalendarIcon className="w-[1.35vw] h-[1.35vw] text-gray-500" />
                </button>

                {showDatePicker && renderDatePicker()}
              </div>

              <div className="flex border border-gray-300 rounded-full bg-white overflow-hidden shadow-sm">
                {["day", "week", "month"].map((viewOption) => (
                  <button
                    key={viewOption}
                    onClick={() => setView(viewOption)}
                    className={`px-[0.7vw] py-[0.4vw] text-[0.72vw] font-medium capitalize transition-colors cursor-pointer border-r border-gray-200 ${
                      view === viewOption
                        ? "bg-[#ebf0fc] text-gray-900 shadow-sm"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {viewOption}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {canCreateEvent() && (
              <button
  onClick={() => {
    setEditingEvent(null);
    setEventForm({
      title: "",
      eventtype: "Meeting",
      startTime: "",
      endTime: "",
      date: formatDate(currentDate), 
      endDate:"",
      agenda: "",
      link: "",
      day: "workingday",
      employees: [],
      formType: view,
      employeeID: currentEmployeeId || "",
    });
    setShowEventModal(true);
  }}
  className="flex items-center space-x-[0.4vw] bg-blue-600 text-white px-[0.7vw] py-[0.4vw] rounded-[1vw] hover:bg-blue-700 transition-colors shadow-sm text-[0.8vw] cursor-pointer"
>
  <Plus className="w-[0.9vw] h-[0.9vw]" />
  <span>Create</span>
</button>
            )}
          </div>

          <div className="absolute bottom-[0vw] right-[0.2vw] text-[0.8vw] text-gray-600">
            Double click to view Event
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        {view === "day" && renderDayView()}
        {view === "week" && renderWeekView()}
        {view === "month" && renderMonthView()}
      </div>

      {showEventModal && (
        <div
          className="fixed inset-0 bg-black/25 backdrop-blur-[0.1px] flex items-center justify-center z-49"
          onClick={handleCancel}
        >
          <div
            className={`bg-white rounded-[1vw] shadow-xl ${
              view === "month" ||
              (editingEvent && eventForm.formType === "month")
                ? eventForm.eventtype === "Announcement"
                  ? "w-[30%]"
                  : "w-[37%]"
                : "w-[30%]"
            }  p-[1.7vw] flex flex-col gap-[1.3vw]`}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <input
                type="text"
                placeholder="Add title"
                value={eventForm.title}
                onChange={(e) => {
                  setEventForm({ ...eventForm, title: e.target.value });
                  if (titleError && e.target.value) {
                    setTitleError(false);
                  }
                }}
                disabled={editingEvent && !canEditEvent(editingEvent)}
                className={`w-full pb-[0.1vw] border-0 border-b-[2px] ${
                  titleError ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:ring-0 ${
                  titleError ? "focus:border-red-500" : "focus:border-gray-400"
                } text-[1.1vw] placeholder:text-[1.2vw] ${
                  titleError ? "placeholder:text-red-400" : ""
                } text-gray-700 ${
                  editingEvent && !canEditEvent(editingEvent)
                    ? "bg-gray-50 cursor-not-allowed"
                    : ""
                }`}
              />
              {titleError && (
                <p className="text-red-500 text-[0.7vw] mt-[0.3vw]">
                  Please enter a title for the event
                </p>
              )}
            </div>

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-[0.5vw]">
                <img src={options} alt="" className="w-[1.1vw] h-[1.1vw]" />
                <div className="w-fit bg-gray-200 text-gray-700 rounded-full px-[0.5vw] py-[0.3vw] text-[0.8vw]">
                  <select
                    name=""
                    id=""
                    className="focus:outline-none focus:ring-0"
                    value={eventForm.eventtype}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, eventtype: e.target.value })
                    }
                    disabled={editingEvent && !canEditEvent(editingEvent)}
                  >
                    <option value="" disabled>
                      Event Type
                    </option>
                    {["Meeting", "Special day", "Announcement"].map((emp) => (
                      <option key={emp} value={emp}>
                        {emp}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-[0.3vw]">
                <span className="text-[0.85vw] text-gray-600">
                  {editingEvent ? "created in:" : "Creating in:"}
                </span>
                {getViewIndicator(eventForm.formType || view)}
              </div>
            </div>

            {((editingEvent && eventForm.formType != "month") ||
              (!editingEvent && view != "month")) && (
              <div
                className={`flex ${
                  eventForm.eventtype != "Announcement" ? "mt-[-1vw]" : ""
                }`}
              >
                <div className="flex items-end gap-[0.5vw]">
                  <img
                    src={TimeIcon}
                    alt=""
                    className="w-[1.2vw] h-[1.2vw] mb-[0.5vw]"
                  />
                  <input
                    type="date"
                    className="text-gray-700 focus:outline-none focus:ring-0 bg-[#ebf0fc] px-[0.7vw] py-[0.4vw] rounded-full text-[0.8vw]"
                    value={eventForm.date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, date: e.target.value })
                    }
                    disabled={editingEvent && !canEditEvent(editingEvent)}
                  />
                </div>

                {eventForm.eventtype != "Announcement" && (
                  <div className="flex items-center gap-[0.6vw] text-[0.7vw] ml-[3%]">
                    <div className="flex flex-col justify-center gap-y-[0.3vw]">
                      <span>Start Time</span>
                      <input
                        type="time"
                        className="text-gray-700 text-[0.8vw] focus:outline-none focus:ring-0 bg-[#ebf0fc] px-[0.7vw] py-[0.4vw] rounded-full"
                        value={eventForm.startTime}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            startTime: e.target.value,
                          })
                        }
                        disabled={editingEvent && !canEditEvent(editingEvent)}
                      />
                    </div>
                    <div className="flex flex-col justify-center gap-y-[0.3vw]">
                      <span>End Time</span>
                      <input
                        type="time"
                        className="text-gray-700 text-[0.8vw] focus:outline-none focus:ring-0 bg-[#ebf0fc] px-[0.7vw] py-[0.4vw] rounded-full"
                        value={eventForm.endTime}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            endTime: e.target.value,
                          })
                        }
                        disabled={editingEvent && !canEditEvent(editingEvent)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {((editingEvent && eventForm.formType === "month") ||
              (!editingEvent && view === "month")) && (
              <div
                className={`flex ${
                  eventForm.eventtype != "Announcement" ? "mt-[-0.5vw]" : ""
                }`}
              >
                <div className="flex items-end gap-[0.5vw]">
                  <img
                    src={TimeIcon}
                    alt=""
                    className="w-[1.2vw] h-[1.2vw] mb-[0.5vw]"
                  />
                  <div className="flex flex-col justify-center gap-y-[0.2vw]">
                    <span className="text-gray-700 text-[0.85vw]">
                      Start Date
                    </span>
                    <input
                      type="date"
                      className="text-gray-700 focus:outline-none focus:ring-0 bg-[#ebf0fc] px-[0.7vw] py-[0.4vw] rounded-full text-[0.8vw]"
                      value={eventForm.date}
                      disabled={editingEvent && !canEditEvent(editingEvent)}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, date: e.target.value })
                      }
                    />
                  </div>
                  {eventForm.eventtype != "Announcement" && (
                    <div className="flex flex-col justify-center gap-y-[0.2vw]">
                      <span className="text-gray-700 text-[0.85vw]">
                        Start Time
                      </span>
                      <input
                        type="time"
                        className="text-gray-700 text-[0.8vw] focus:outline-none focus:ring-0 bg-[#ebf0fc] px-[0.7vw] py-[0.4vw] rounded-full"
                        value={eventForm.startTime}
                        disabled={editingEvent && !canEditEvent(editingEvent)}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            startTime: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}
                  <div className="flex flex-col justify-center gap-y-[0.2vw]">
                    <span className="text-gray-700 text-[0.85vw]">
                      End Date
                    </span>
                    <input
                      type="date"
                      className="text-gray-700 focus:outline-none focus:ring-0 bg-[#ebf0fc] px-[0.7vw] py-[0.4vw] rounded-full text-[0.8vw]"
                      value={eventForm.endDate }
                      disabled={editingEvent && !canEditEvent(editingEvent)}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, endDate: e.target.value })
                      }
                    />
                  </div>
                  {eventForm.eventtype != "Announcement" && (
                    <div className="flex flex-col justify-center gap-y-[0.2vw]">
                      <span className="text-gray-700 text-[0.85vw]">
                        End Time
                      </span>
                      <input
                        type="time"
                        className="text-gray-700 text-[0.8vw] focus:outline-none focus:ring-0 bg-[#ebf0fc] px-[0.7vw] py-[0.4vw] rounded-full"
                        value={eventForm.endTime}
                        disabled={editingEvent && !canEditEvent(editingEvent)}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            endTime: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {eventForm.eventtype === "Special day" && (
              <div className="flex gap-[0.5vw] text-[0.8vw] text-gray-700">
                <img src={day} alt="" className="w-[1.2vw] h-[1.2vw]" />
                <div className="flex items-center gap-[1vw]">
                  <div className="flex items-center gap-[0.4vw]">
                    <input
                      type="radio"
                      name="day"
                      value="workingday"
                      checked={eventForm.day === "workingday"}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, day: e.target.value })
                      }
                      disabled={editingEvent && !canEditEvent(editingEvent)}
                      className="w-[1vw] h-[1vw]"
                    />
                    <label>Working day</label>
                  </div>

                  <div className="flex items-center gap-[0.4vw]">
                    <input
                      type="radio"
                      name="day"
                      value="holiday"
                      checked={eventForm.day === "holiday"}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, day: e.target.value })
                      }
                      disabled={editingEvent && !canEditEvent(editingEvent)}
                      className="w-[1vw] h-[1vw]"
                    />
                    <label>Holiday</label>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-[0.5vw]">
              <img
                src={segment}
                alt=""
                className="w-[1.2vw] h-[1.2vw] mb-[0.5vw]"
              />
              <textarea
                value={eventForm.agenda}
                onChange={(e) =>
                  setEventForm({ ...eventForm, agenda: e.target.value })
                }
                disabled={editingEvent && !canEditEvent(editingEvent)}
                className="w-full px-[0.5vw] py-[0.3vw] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#ebf0fc] text-[0.8vw]"
                rows="3"
                placeholder="Agenda...."
              />
            </div>

            {eventForm.eventtype === "Meeting" && (
              <div className="flex items-center gap-[0.5vw]">
                <img src={link} alt="" className="w-[1.2vw] h-[1.2vw]" />

                <input
                  value={eventForm.link}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, link: e.target.value })
                  }
                  disabled={editingEvent && !canEditEvent(editingEvent)}
                  className="w-full px-[0.5vw] py-[0.4vw] rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#ebf0fc] text-[0.8vw] text-blue-700"
                  placeholder="Meeting Link"
                />

                {eventForm.link.length > 0 && (
                  <button
                    onClick={() => {
                      window.open(eventForm.link, "_blank");
                    }}
                    className="bg-[#ebf0fc] px-[0.5vw] py-[0.4vw] rounded-full text-[0.8vw] cursor-pointer hover:bg-[#dbe4f8]"
                  >
                    Go
                  </button>
                )}
              </div>
            )}

            {eventForm.eventtype === "Meeting" && (
              <div className="flex flex-col justify-center gap-[0.5vw]">
                <div className="flex items-center gap-[0.5vw]">
                  <img src={person} alt="" className="w-[1.2vw] h-[1.2vw]" />
                  <div className="w-fit bg-[#ebf0fc] text-gray-700 rounded-full px-[0.5vw] py-[0.3vw] text-[0.8vw]">
                    <select
                      value={selectedEmployee}
                      onChange={handleSelect}
                      className="focus:outline-none focus:ring-0 bg-transparent"
                      disabled={
                        loadingEmployees ||
                        (editingEvent && !canEditEvent(editingEvent))
                      }
                    >
                      <option value="" disabled>
                        {loadingEmployees ? "Loading..." : "Add Attendees"}
                      </option>
                      {Array.isArray(employees) && employees.length > 0 ? (
                        employees
                          .filter((emp) => {
                            const empId = emp._id || emp.id || emp.employee_id || emp.employeeId;
                            return !eventForm.employees.includes(empId);
                          })
                          .map((emp, idx) => {
                            const empId = emp._id || emp.id || emp.employee_id || emp.employeeId;
                            const empName = emp.employeeName || emp.employee_name || emp.employeeName || emp.email_official || "Unknown";
                            const key = empId || emp.email_official || idx;

                            return (
                              <option key={key} value={empId || emp.email_official || key}>
                                {empName}
                              </option>
                            );
                          })
                      ) : (
                        <option value="" disabled>
                          No employees available
                        </option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-[0.4vw] mt-[0.3vw] ml-[7%]">
                  {Array.isArray(eventForm.employees) &&
                  eventForm.employees.length > 0
                    ? eventForm.employees.map((empId, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1"
                        >
                          {getEmployeeName(empId)}
                          {(!editingEvent || canEditEvent(editingEvent)) && (
                            <button
                              onClick={() =>
                                setEventForm({
                                  ...eventForm,
                                  employees: eventForm.employees.filter(
                                    (e) => e !== empId
                                  ),
                                })
                              }
                              className="text-red-500 font-bold hover:text-red-700"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))
                    : null}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex justify-end space-x-[0.8vw]">
                <button
                  onClick={handleCancel}
                  className="px-[0.8vw] py-[0.35vw] text-[0.75vw] font-medium text-gray-700 bg-gray-300 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  {editingEvent && !canEditEvent(editingEvent)
                    ? "Close"
                    : "Cancel"}
                </button>

                {(!editingEvent || canEditEvent(editingEvent)) && (
                  <button
                    onClick={saveEvent}
                    className="px-[0.8vw] py-[0.35vw] text-[0.75vw] font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    {editingEvent ? "Update event" : "Add event"}
                  </button>
                )}

                {editingEvent && canEditEvent(editingEvent) && (
                  <button
                    onClick={deleteEvent}
                    className="px-[0.8vw] py-[0.35vw] text-[0.75vw] font-medium text-white bg-red-600 rounded-full hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
