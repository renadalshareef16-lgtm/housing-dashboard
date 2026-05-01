import { useMemo, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import {
  RefreshCw,
  Download,
  FileImage,
  Moon,
  Sun,
  Users,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Home,
  TrendingUp,
  MapPinned,
  Layers3,
  Building2,
  Compass,
  Activity,
  Target,
  LocateFixed,
  Map as MapIcon,
  Navigation,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from "recharts";
import logo from "./assets/logo.png";

const GOOGLE_SCRIPT_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzODmQCIGnXAomNiSiqfB7qEeLBJiMl8Rp4tvzRTvclP-AhYuttcijnkyEKXmsWfjq-eQ/exec";

function toNumber(value, fallback = 0) {
  const cleaned = String(value ?? "")
    .replace("%", "")
    .replace(/,/g, "")
    .trim();

  const number = Number(cleaned);
  return Number.isFinite(number) ? number : fallback;
}

function parseProgress(progressText) {
  if (!progressText) return [];

  return String(progressText)
    .split("|")
    .map((item) => {
      const [center, value] = item.split(":");
      return {
        center: String(center || "").trim(),
        value: toNumber(value),
      };
    })
    .filter((item) => item.center);
}

function parseNotes(notesText) {
  if (!notesText) return [];

  return String(notesText)
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseMapLocations(value) {
  if (!value) return [];

  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        ...item,
        lat: Number(item.lat),
        lng: Number(item.lng),
        pilgrimsArrival: Number(item.pilgrimsArrival || 0),
        readinessPercent: Number(item.readinessPercent || 0),
      }))
      .filter(
        (item) =>
          Number.isFinite(item.lat) &&
          Number.isFinite(item.lng) &&
          item.pilgrimsArrival > 0
      );
  } catch {
    return [];
  }
}

function getMapStatusClass(readinessPercent) {
  if (readinessPercent >= 80) return "good";
  if (readinessPercent >= 50) return "mid";
  return "low";
}

function getGoogleMapsDirectionsUrl(location) {
  const lat = Number(location?.lat);
  const lng = Number(location?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return "#";
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

function createHousingMarker(location, isSelected) {
  const statusClass = getMapStatusClass(location.readinessPercent);
  const pilgrimsLabel = new Intl.NumberFormat("en-US").format(
    location.pilgrimsArrival || 0
  );

  return L.divIcon({
    className: "housing-marker-wrapper",
    html: `
      <div class="housing-marker ${statusClass} ${isSelected ? "selected" : ""}">
        <span class="housing-marker-pin"></span>
        <div class="housing-marker-body">
          <strong>${pilgrimsLabel}</strong>
          <small>حاج</small>
        </div>
      </div>
    `,
    iconSize: [80, 80],
    iconAnchor: [40, 68],
    popupAnchor: [0, -56],
  });
}

function MapAutoFocus({ locations, selectedLocation }) {
  const map = useMap();

  useEffect(() => {
    if (selectedLocation) {
      map.flyTo([selectedLocation.lat, selectedLocation.lng], 16, {
        duration: 0.7,
      });
      return;
    }

    if (!locations.length) return;

    if (locations.length === 1) {
      map.setView([locations[0].lat, locations[0].lng], 15);
      return;
    }

    map.fitBounds(
      locations.map((item) => [item.lat, item.lng]),
      {
        padding: [48, 48],
        maxZoom: 14,
      }
    );
  }, [locations, selectedLocation, map]);

  return null;
}

function MapResizeFix() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

function mapRowsToDashboards(rows) {
  return rows
    .map((row, index) => ({
      id: toNumber(row.id, index + 1),
      name: row.name || "",
      title: row.title || row.name || "",
      centersCount: toNumber(row.centersCount),
      housesCount: toNumber(row.housesCount),
      pilgrimsCount: toNumber(row.pilgrimsCount),
      complete: toNumber(row.complete),
      partial: toNumber(row.partial),
      incomplete: toNumber(row.incomplete),
      readyPercent: toNumber(row.readyPercent),
      progress: parseProgress(row.progress),
      notes: parseNotes(row.notes),
      mapLocations: parseMapLocations(row.mapLocations),
      quickPositive: row.quickPositive || "لا توجد بيانات كافية",
      quickPriority: row.quickPriority || "لا توجد أولوية محددة",
      executiveNote: row.executiveNote || "لا توجد ملاحظة تنفيذية مدخلة.",
      lastUpdated: row.lastUpdated || "",
    }))
    .filter((item) => item.name);
}

function App() {
  const [dashboards, setDashboards] = useState([]);
  const [activeId, setActiveId] = useState("all");
  const [activeView, setActiveView] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingPNG, setIsExportingPNG] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [lastSyncTime, setLastSyncTime] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("mashaer-dark-mode") === "true";
  });

  const numberFormat = new Intl.NumberFormat("en-US");

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError("");

      const response = await fetch(`${GOOGLE_SCRIPT_WEB_APP_URL}?t=${Date.now()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("تعذر تحميل بيانات لوحة المتابعة من Apps Script.");
      }

      const data = await response.json();

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!Array.isArray(data)) {
        throw new Error("البيانات المستلمة ليست بصيغة صحيحة.");
      }

      const mappedDashboards = mapRowsToDashboards(data);

      if (!mappedDashboards.length) {
        throw new Error("لم يتم العثور على بيانات قابلة للعرض.");
      }

      setDashboards(mappedDashboards);

      setActiveId((currentId) => {
        if (currentId === "all") return "all";

        const stillExists = mappedDashboards.some((item) => item.id === currentId);
        return stillExists ? currentId : "all";
      });

      setLastSyncTime(new Date().toLocaleString("ar-SA"));
    } catch (error) {
      setLoadError(error.message || "حدث خطأ أثناء تحميل البيانات");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    localStorage.setItem("mashaer-dark-mode", darkMode ? "true" : "false");
  }, [darkMode]);

  const isAllSelected = activeId === "all";

  const overall = useMemo(() => {
    return dashboards.reduce(
      (acc, item) => {
        acc.houses += item.housesCount;
        acc.pilgrims += item.pilgrimsCount;
        acc.complete += item.complete;
        acc.partial += item.partial;
        acc.incomplete += item.incomplete;
        acc.weightedReady += item.readyPercent * item.housesCount;
        acc.centers += item.centersCount;
        return acc;
      },
      {
        houses: 0,
        pilgrims: 0,
        complete: 0,
        partial: 0,
        incomplete: 0,
        weightedReady: 0,
        centers: 0,
      }
    );
  }, [dashboards]);

  const totalReadyPercent =
    overall.houses > 0
      ? Number((overall.weightedReady / overall.houses).toFixed(1))
      : 0;

  const allCenters = useMemo(() => {
    return dashboards
      .flatMap((file) =>
        file.progress.map((center) => ({
          center: center.center,
          value: Number(center.value.toFixed(1)),
          file: file.name,
          pilgrims: file.pilgrimsCount,
          houses: file.housesCount,
          readyPercent: file.readyPercent,
        }))
      )
      .sort((a, b) => b.value - a.value);
  }, [dashboards]);

  const allMapLocations = useMemo(() => {
    return dashboards.flatMap((file) =>
      (file.mapLocations || []).map((location) => ({
        ...location,
        fileName: location.fileName || file.name,
        fileTitle: location.fileTitle || file.title,
      }))
    );
  }, [dashboards]);

  const selectedDashboard =
    dashboards.find((item) => item.id === activeId) || dashboards[0];

  const activeDashboard = isAllSelected
    ? {
        id: "all",
        name: "الكل",
        title: "لوحة شاملة لجميع المراكز",
        centersCount: overall.centers,
        housesCount: overall.houses,
        pilgrimsCount: overall.pilgrims,
        complete: overall.complete,
        partial: overall.partial,
        incomplete: overall.incomplete,
        readyPercent: totalReadyPercent,
        progress: allCenters,
        mapLocations: allMapLocations,
        notes: Array.from(new Set(dashboards.flatMap((item) => item.notes))).slice(
          0,
          12
        ),
        quickPositive:
          allCenters[0]?.center
            ? `مركز ${allCenters[0].center} الأعلى جاهزية`
            : "لا توجد بيانات كافية",
        quickPriority:
          allCenters[allCenters.length - 1]?.center
            ? `مركز ${allCenters[allCenters.length - 1].center} يحتاج متابعة أولى`
            : "لا توجد أولوية محددة",
        executiveNote:
          "هذه قراءة شاملة لجميع ملفات المراكز. الأولوية تكون للمراكز الأقل جاهزية والملفات ذات النواقص المتكررة قبل وصول الحجاج.",
      }
    : selectedDashboard;

  const activeMapLocations = useMemo(() => {
    return isAllSelected ? allMapLocations : activeDashboard?.mapLocations || [];
  }, [isAllSelected, allMapLocations, activeDashboard]);

  useEffect(() => {
    if (!activeMapLocations.length) {
      setSelectedLocationId(null);
      return;
    }

    const stillExists = activeMapLocations.some(
      (location) => location.id === selectedLocationId
    );

    if (!stillExists) {
      setSelectedLocationId(activeMapLocations[0].id);
    }
  }, [activeMapLocations, selectedLocationId]);

  const selectedMapLocation =
    activeMapLocations.find((item) => item.id === selectedLocationId) ||
    activeMapLocations[0] ||
    null;

  const mapCenter =
    activeMapLocations.length > 0
      ? [
          activeMapLocations.reduce((sum, item) => sum + item.lat, 0) /
            activeMapLocations.length,
          activeMapLocations.reduce((sum, item) => sum + item.lng, 0) /
            activeMapLocations.length,
        ]
      : [21.4225, 39.8262];

  const activeMapPilgrims = activeMapLocations.reduce(
    (sum, item) => sum + (item.pilgrimsArrival || 0),
    0
  );

  const highestArrivalLocation =
    activeMapLocations.length > 0
      ? [...activeMapLocations].sort(
          (a, b) => (b.pilgrimsArrival || 0) - (a.pilgrimsArrival || 0)
        )[0]
      : null;

  const fileComparisonData = dashboards.map((item) => ({
    name: item.name,
    جاهزية: Number(item.readyPercent.toFixed(1)),
  }));

  const allCentersChartData = allCenters.map((item) => ({
    name: `مركز ${item.center}`,
    value: item.value,
    file: item.file,
  }));

  const activeProgressData =
    activeDashboard?.progress?.map((item) => ({
      name: `مركز ${item.center}`,
      value: Number(item.value.toFixed(1)),
    })) || [];

  const statusData = activeDashboard
    ? [
        { name: "مكتمل", value: activeDashboard.complete, color: "#6BC69A" },
        { name: "مكتمل جزئيًا", value: activeDashboard.partial, color: "#F5A30B" },
        { name: "غير مكتمل", value: activeDashboard.incomplete, color: "#F04444" },
      ]
    : [];

  const topCenters = activeDashboard
    ? [...activeDashboard.progress].sort((a, b) => b.value - a.value).slice(0, 5)
    : [];

  const lowCenters = activeDashboard
    ? [...activeDashboard.progress].sort((a, b) => a.value - b.value).slice(0, 5)
    : [];

  const statusText = !activeDashboard
    ? "لا توجد بيانات"
    : activeDashboard.readyPercent >= 80
    ? "جاهزية مرتفعة"
    : activeDashboard.readyPercent >= 50
    ? "جاهزية متوسطة"
    : "جاهزية منخفضة";

  const statusClass = !activeDashboard
    ? "warning"
    : activeDashboard.readyPercent >= 80
    ? "success"
    : activeDashboard.readyPercent >= 50
    ? "warning"
    : "danger";

  const readinessRadialData = [
    {
      name: "نسبة الجاهزية",
      value: Number(activeDashboard?.readyPercent || 0),
      fill: "#7B3FA4",
    },
  ];

  const handleExportPNG = async () => {
    if (!activeDashboard) {
      alert("لا توجد بيانات للتصدير.");
      return;
    }

    try {
      setIsExportingPNG(true);

      const element = document.querySelector(".app-page");

      if (!element) {
        throw new Error("لم يتم العثور على عنصر الصفحة للتصدير.");
      }

      await document.fonts?.ready;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: darkMode ? "#12091b" : "#f7f3f9",
        scrollX: 0,
        scrollY: -window.scrollY,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `تقرير-جاهزية-مساكن-يسر-المشاعر-${activeDashboard.name}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert(error.message || "تعذر تصدير الصورة PNG.");
    } finally {
      setIsExportingPNG(false);
    }
  };

  const handleExportExcel = () => {
    if (!activeDashboard) {
      alert("لا توجد بيانات للتصدير.");
      return;
    }

    try {
      setIsExportingExcel(true);

      const summarySheet = [
        {
          "إجمالي المساكن": overall.houses,
          "إجمالي عدد الحجاج": overall.pilgrims,
          المكتمل: overall.complete,
          "المكتمل جزئيًا": overall.partial,
          "غير المكتمل": overall.incomplete,
          "نسبة الجاهزية": `${totalReadyPercent}%`,
          "آخر مزامنة": lastSyncTime,
        },
      ];

      const filesSheet = dashboards.map((item) => ({
        "اسم الملف": item.name,
        "عنوان الملف": item.title,
        "عدد المراكز": item.centersCount,
        "عدد المساكن": item.housesCount,
        "عدد الحجاج": item.pilgrimsCount,
        المكتمل: item.complete,
        "المكتمل جزئيًا": item.partial,
        "غير المكتمل": item.incomplete,
        "نسبة الجاهزية": `${item.readyPercent}%`,
        "أفضل مؤشر": item.quickPositive,
        "أولوية المتابعة": item.quickPriority,
        "الملاحظة التنفيذية": item.executiveNote,
      }));

      const progressSheet = allCenters.map((item) => ({
        "اسم الملف": item.file,
        المركز: item.center,
        "نسبة الإنجاز": `${item.value}%`,
      }));

      const mapSheet = allMapLocations.map((item) => ({
        "اسم السكن": item.housingName,
        "رقم المركز": item.centerNumber,
        "رقم التصريح": item.permitNumber,
        "عدد الحجاج الواصلون": item.pilgrimsArrival,
        "نسبة جاهزية السكن": `${item.readinessPercent}%`,
        "خط العرض": item.lat,
        "خط الطول": item.lng,
        الملف: item.fileName,
        "رابط Google Maps": getGoogleMapsDirectionsUrl(item),
      }));

      const notesSheet = activeDashboard.notes.map((note, index) => ({
        "الملف النشط": activeDashboard.name,
        الرقم: index + 1,
        "النواقص المتكررة": note,
      }));

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(summarySheet),
        "الملخص العام"
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(filesSheet),
        "ملفات المراكز"
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(progressSheet),
        "إنجاز المراكز"
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(mapSheet),
        "مواقع الوصول"
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(notesSheet),
        "النواقص"
      );

      XLSX.writeFile(
        workbook,
        `تقرير-جاهزية-مساكن-يسر-المشاعر-${activeDashboard.name}.xlsx`
      );
    } catch (error) {
      alert(error.message || "تعذر تصدير ملف Excel.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 26 },
    visible: (index = 1) => ({
      opacity: 1,
      y: 0,
      transition: { delay: index * 0.06, duration: 0.45, ease: "easeOut" },
    }),
  };

  if (isLoading && dashboards.length === 0) {
    return (
      <div className={`app-page ${darkMode ? "dark-mode" : ""}`} dir="rtl">
        <div className="loading-state">
          <RefreshCw size={34} className="loading-icon" />
          <h2>جاري تحميل بيانات لوحة المتابعة...</h2>
          <p>يتم الآن قراءة البيانات من Google Apps Script.</p>
        </div>
      </div>
    );
  }

  if (loadError && dashboards.length === 0) {
    return (
      <div className={`app-page ${darkMode ? "dark-mode" : ""}`} dir="rtl">
        <div className="loading-state error-state">
          <AlertTriangle size={36} />
          <h2>تعذر تحميل البيانات</h2>
          <p>{loadError}</p>
          <button
            type="button"
            className="action-btn primary"
            onClick={loadDashboardData}
          >
            إعادة المحاولة
            <RefreshCw size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-page ${darkMode ? "dark-mode" : ""}`} dir="rtl">
      <header className="mashaer-hero">
        <div className="hero-actions">
          <button
            type="button"
            className="action-btn primary"
            onClick={loadDashboardData}
            disabled={isLoading}
            title="تحديث البيانات من الشيت"
          >
            {isLoading ? "جاري التحديث..." : "تحديث البيانات"}
            <RefreshCw size={18} className={isLoading ? "spin-icon" : ""} />
          </button>

          <button
            type="button"
            className="action-btn"
            onClick={handleExportPNG}
            disabled={isExportingPNG || isLoading}
            title="تحميل الصفحة كصورة PNG"
          >
            {isExportingPNG ? "جاري التصدير..." : "PNG"}
            <FileImage size={17} />
          </button>

          <button
            type="button"
            className="action-btn"
            onClick={handleExportExcel}
            disabled={isExportingExcel || isLoading}
            title="تحميل البيانات كملف Excel"
          >
            {isExportingExcel ? "جاري التصدير..." : "Excel"}
            <Download size={17} />
          </button>

          <button
            type="button"
            className="icon-btn"
            aria-label="تبديل الوضع الليلي"
            title={darkMode ? "الوضع الفاتح" : "الوضع الليلي"}
            onClick={() => setDarkMode((prev) => !prev)}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="hero-identity">
          <img src={logo} alt="يسر المشاعر" className="mashaer-logo" />

          <div>
            <h1>تقرير جاهزية مساكن الحجاج</h1>
            <p>يسر المشاعر لإدارة وتشغيل خدمات الحجاج</p>
            <span>
              إعداد وتنسيق: ريناد الشريف · آخر مزامنة: {lastSyncTime || "—"}
            </span>
          </div>
        </div>

        <div className="hero-tabs">
          <button
            type="button"
            className={`hero-tab ${activeView === "overview" ? "active" : ""}`}
            onClick={() => setActiveView("overview")}
          >
            نظرة عامة
            <BarChart3 size={18} />
          </button>

          <button
            type="button"
            className={`hero-tab ${activeView === "files" ? "active" : ""}`}
            onClick={() => setActiveView("files")}
          >
            ملفات المراكز
            <MapPinned size={18} />
          </button>

          <button
            type="button"
            className={`hero-tab ${activeView === "executive" ? "active" : ""}`}
            onClick={() => setActiveView("executive")}
          >
            قراءة تنفيذية
            <ClipboardList size={18} />
          </button>

          <button
            type="button"
            className={`hero-tab ${activeView === "map" ? "active" : ""}`}
            onClick={() => setActiveView("map")}
          >
            الخريطة التفاعلية
            <Compass size={18} />
          </button>
        </div>
      </header>

      <main className="dashboard-shell">
        {loadError && (
          <div className="inline-error">
            <AlertTriangle size={18} />
            <span>{loadError}</span>
          </div>
        )}

        <section className="kpi-grid">
          <motion.div className="kpi-card" variants={cardVariants} initial="hidden" animate="visible" custom={1}>
            <div className="kpi-icon green">
              <Home size={26} />
            </div>
            <span>إجمالي المساكن</span>
            <strong>{numberFormat.format(overall.houses)}</strong>
          </motion.div>

          <motion.div className="kpi-card" variants={cardVariants} initial="hidden" animate="visible" custom={2}>
            <div className="kpi-icon mint">
              <Users size={26} />
            </div>
            <span>إجمالي عدد الحجاج</span>
            <strong>{numberFormat.format(overall.pilgrims)}</strong>
          </motion.div>

          <motion.div className="kpi-card" variants={cardVariants} initial="hidden" animate="visible" custom={3}>
            <div className="kpi-icon green">
              <CheckCircle2 size={26} />
            </div>
            <span>المكتمل</span>
            <strong>{numberFormat.format(overall.complete)}</strong>
          </motion.div>

          <motion.div className="kpi-card" variants={cardVariants} initial="hidden" animate="visible" custom={4}>
            <div className="kpi-icon orange">
              <AlertTriangle size={26} />
            </div>
            <span>المكتمل جزئيًا</span>
            <strong>{numberFormat.format(overall.partial)}</strong>
          </motion.div>

          <motion.div className="kpi-card" variants={cardVariants} initial="hidden" animate="visible" custom={5}>
            <div className="kpi-icon red">
              <AlertTriangle size={26} />
            </div>
            <span>غير المكتمل</span>
            <strong>{numberFormat.format(overall.incomplete)}</strong>
          </motion.div>

          <motion.div className="kpi-card" variants={cardVariants} initial="hidden" animate="visible" custom={6}>
            <div className="kpi-icon purple">
              <TrendingUp size={26} />
            </div>
            <span>نسبة الجاهزية</span>
            <strong>{totalReadyPercent}%</strong>
          </motion.div>
        </section>

        <section className="filters-area">
          <div className="filter-group">
            <button
              type="button"
              className={`filter-chip ${isAllSelected ? "active" : ""}`}
              onClick={() => {
                setActiveId("all");
                setActiveView("overview");
              }}
            >
              الكل 🌍
            </button>

            {dashboards.slice(0, 5).map((item) => (
              <button
                type="button"
                key={item.id}
                className={`filter-chip ${activeId === item.id ? "selected" : ""}`}
                onClick={() => setActiveId(item.id)}
              >
                {item.name}
              </button>
            ))}
          </div>

          <div className="filter-group">
            {dashboards.slice(5).map((item) => (
              <button
                type="button"
                key={item.id}
                className={`filter-chip ${activeId === item.id ? "selected" : ""}`}
                onClick={() => setActiveId(item.id)}
              >
                {item.name}
              </button>
            ))}
          </div>
        </section>

        {activeDashboard && (
          <>
            <AnimatePresence mode="wait">
              <motion.section
                key={activeDashboard.id}
                className={`active-file-panel ${isAllSelected ? "all-mode-panel" : ""}`}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.35 }}
              >
                <div className="active-file-text">
                  <p>{isAllSelected ? "لوحة الكل" : "الملف النشط"}</p>
                  <h2>{activeDashboard.title}</h2>
                  <span>
                    {isAllSelected
                      ? "ملخص تنفيذي شامل لجميع المراكز والملفات"
                      : "جــاهزية المــساكن حسب بيانات الملف المحدد"}
                  </span>
                </div>

                <div className={`readiness-pill ${statusClass}`}>{statusText}</div>
              </motion.section>
            </AnimatePresence>

            {isAllSelected && activeView === "overview" && (
              <section className="all-command-center">
                <motion.div
                  className="command-hero"
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  custom={1}
                >
                  <div className="command-text">
                    <span>مركز القيادة العام</span>
                    <h2>قراءة موحدة لجاهزية جميع المراكز</h2>
                    <p>
                      هذه اللوحة تجمع الأداء العام، وترتب المراكز الأعلى والأقل
                      جاهزية، وتعرض الضغط التشغيلي قبل الوصول.
                    </p>
                  </div>

                  <div className="command-gauge">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        innerRadius="72%"
                        outerRadius="100%"
                        data={readinessRadialData}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <RadialBar
                          minAngle={15}
                          background
                          clockWise
                          dataKey="value"
                          cornerRadius={20}
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>

                    <div className="command-gauge-label">
                      <strong>{totalReadyPercent}%</strong>
                      <span>جاهزية عامة</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div className="command-card" variants={cardVariants} initial="hidden" animate="visible" custom={2}>
                  <Layers3 size={28} />
                  <span>عدد ملفات المراكز</span>
                  <strong>{numberFormat.format(dashboards.length)}</strong>
                </motion.div>

                <motion.div className="command-card" variants={cardVariants} initial="hidden" animate="visible" custom={3}>
                  <Building2 size={28} />
                  <span>إجمالي المراكز</span>
                  <strong>{numberFormat.format(overall.centers)}</strong>
                </motion.div>

                <motion.div className="command-card" variants={cardVariants} initial="hidden" animate="visible" custom={4}>
                  <Target size={28} />
                  <span>أعلى مركز</span>
                  <strong>{topCenters[0] ? `مركز ${topCenters[0].center}` : "—"}</strong>
                </motion.div>

                <motion.div className="command-card danger-soft" variants={cardVariants} initial="hidden" animate="visible" custom={5}>
                  <Activity size={28} />
                  <span>أولوية المتابعة</span>
                  <strong>{lowCenters[0] ? `مركز ${lowCenters[0].center}` : "—"}</strong>
                </motion.div>
              </section>
            )}

            <section className="charts-grid">
              {(activeView === "overview" || activeView === "files") && (
                <>
                  <motion.div className="chart-card wide" variants={cardVariants} initial="hidden" animate="visible" custom={1}>
                    <div className="card-head">
                      <div>
                        <h3>
                          {isAllSelected
                            ? "ترتيب ملفات المراكز حسب الجاهزية 🏗️"
                            : "أداء ملفات المراكز مقارنة ببعضها 🏗️"}
                        </h3>
                        <p>متوسط نسبة الجاهزية لكل ملف</p>
                      </div>
                    </div>

                    <div className="chart-height large">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={fileComparisonData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis
                            type="number"
                            domain={[0, 100]}
                            tickFormatter={(v) => `${v}%`}
                          />
                          <YAxis dataKey="name" type="category" width={120} />
                          <Tooltip formatter={(value) => [`${value}%`, "نسبة الجاهزية"]} />
                          <Bar dataKey="جاهزية" radius={[10, 10, 10, 10]} fill="#7B3FA4" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>

                  <motion.div className="chart-card" variants={cardVariants} initial="hidden" animate="visible" custom={2}>
                    <div className="card-head">
                      <div>
                        <h3>توزيع الحالة 🥧</h3>
                        <p>مكتمل / مكتمل جزئيًا / غير مكتمل</p>
                      </div>
                    </div>

                    <div className="chart-height">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={62}
                            outerRadius={112}
                            paddingAngle={3}
                            label
                          >
                            {statusData.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="legend-row">
                      {statusData.map((item) => (
                        <span key={item.name}>
                          <i style={{ background: item.color }}></i>
                          {item.name}
                        </span>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div className="chart-card" variants={cardVariants} initial="hidden" animate="visible" custom={3}>
                    <div className="card-head">
                      <div>
                        <h3>
                          {isAllSelected
                            ? "نسبة الإنجاز لجميع المراكز 📊"
                            : "نسبة الإنجاز حسب المركز 📊"}
                        </h3>
                        <p>
                          {isAllSelected
                            ? "كل المراكز مرتبة حسب الأداء"
                            : "تفصيل المراكز داخل الملف النشط"}
                        </p>
                      </div>
                    </div>

                    <div className="chart-height">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={isAllSelected ? allCentersChartData : activeProgressData}>
                          <defs>
                            <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#7B3FA4" stopOpacity={0.48} />
                              <stop offset="95%" stopColor="#7B3FA4" stopOpacity={0.03} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                          <Tooltip formatter={(value) => [`${value}%`, "الإنجاز"]} />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#7B3FA4"
                            strokeWidth={3}
                            fill="url(#progressGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>

                  <motion.div className="chart-card" variants={cardVariants} initial="hidden" animate="visible" custom={4}>
                    <div className="card-head">
                      <div>
                        <h3>حالة الجاهزية لكل مركز 🔢</h3>
                        <p>
                          {isAllSelected
                            ? "ترتيب تنفيذي لجميع المراكز"
                            : "مقارنة داخلية حسب الملف"}
                        </p>
                      </div>
                    </div>

                    <div className="center-bars">
                      {activeDashboard.progress
                        .slice(0, isAllSelected ? 12 : activeDashboard.progress.length)
                        .map((item) => (
                          <div
                            className="center-bar-row"
                            key={`${item.center}-${item.file || "single"}`}
                          >
                            <div className="center-bar-meta">
                              <span>مركز {item.center}</span>
                              <strong>{item.value}%</strong>
                            </div>
                            <div className="center-bar-track">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.value}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                              ></motion.div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </motion.div>
                </>
              )}

              {(activeView === "overview" || activeView === "executive") && (
                <>
                  <motion.div className="chart-card" variants={cardVariants} initial="hidden" animate="visible" custom={5}>
                    <div className="card-head">
                      <div>
                        <h3>أعلى وأدنى 5 مراكز 🏆</h3>
                        <p>مقارنة أفضل وأضعف المؤشرات</p>
                      </div>
                    </div>

                    <div className="rank-grid">
                      <div>
                        <h4>الأعلى إنجازًا ✅</h4>
                        {topCenters.map((item) => (
                          <div className="rank-item good" key={`top-${item.center}`}>
                            <span>مركز {item.center}</span>
                            <strong>{item.value}%</strong>
                          </div>
                        ))}
                      </div>

                      <div>
                        <h4>الأدنى إنجازًا ⚠️</h4>
                        {lowCenters.map((item) => (
                          <div className="rank-item low" key={`low-${item.center}`}>
                            <span>مركز {item.center}</span>
                            <strong>{item.value}%</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  <motion.div className="chart-card" variants={cardVariants} initial="hidden" animate="visible" custom={6}>
                    <div className="card-head">
                      <div>
                        <h3>أكثر النواقص تكرارًا 📌</h3>
                        <p>العناصر المؤثرة على إغلاق الملف</p>
                      </div>
                    </div>

                    <div className="notes-list">
                      {activeDashboard.notes.map((note, index) => (
                        <motion.div
                          className="note-chip"
                          key={`${note}-${index}`}
                          initial={{ opacity: 0, x: 18 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.06 }}
                        >
                          {note}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div className="chart-card" variants={cardVariants} initial="hidden" animate="visible" custom={7}>
                    <div className="card-head">
                      <div>
                        <h3>لمحة سريعة 🎯</h3>
                        <p>قراءة مختصرة للملف النشط</p>
                      </div>
                    </div>

                    <div className="summary-grid">
                      <div className="summary-box">
                        <span>أفضل مؤشر</span>
                        <strong>{activeDashboard.quickPositive}</strong>
                      </div>

                      <div className="summary-box">
                        <span>أولوية المتابعة</span>
                        <strong>{activeDashboard.quickPriority}</strong>
                      </div>

                      <div className="summary-box">
                        <span>عدد الحجاج الواصلون</span>
                        <strong>{numberFormat.format(activeDashboard.pilgrimsCount)}</strong>
                      </div>

                      <div className="summary-box">
                        <span>عدد المساكن</span>
                        <strong>{numberFormat.format(activeDashboard.housesCount)}</strong>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div className="chart-card" variants={cardVariants} initial="hidden" animate="visible" custom={8}>
                    <div className="card-head">
                      <div>
                        <h3>جاهزية الملف 🧭</h3>
                        <p>مؤشر الجاهزية العام</p>
                      </div>
                    </div>

                    <div className="readiness-circle-wrap">
                      <div
                        className="readiness-circle"
                        style={{
                          background: `conic-gradient(#7B3FA4 0deg, #B57AF0 ${
                            activeDashboard.readyPercent * 3.6
                          }deg, #EEE5F7 ${
                            activeDashboard.readyPercent * 3.6
                          }deg 360deg)`,
                        }}
                      >
                        <div className="readiness-circle-inner">
                          <strong>
                            {Number(activeDashboard.readyPercent).toFixed(1)}%
                          </strong>
                          <span>{statusText}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div className="chart-card wide" variants={cardVariants} initial="hidden" animate="visible" custom={9}>
                    <div className="card-head">
                      <div>
                        <h3>الملاحظة التنفيذية 📝</h3>
                        <p>قراءة مباشرة للإجراء المطلوب</p>
                      </div>
                    </div>

                    <div className="executive-note">
                      <ClipboardList size={28} />
                      <p>{activeDashboard.executiveNote}</p>
                    </div>
                  </motion.div>
                </>
              )}

              {activeView === "map" && (
                <>
                  <motion.div
                    className="chart-card wide real-map-card"
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    custom={1}
                  >
                    <div className="card-head map-card-head">
                      <div>
                        <h3>الخريطة التفاعلية للمساكن 🧭</h3>
                        <p>
                          اضغطي على أي موقع في الخريطة أو من قائمة المواقع ليتم
                          تحديده والتركيز عليه
                        </p>
                      </div>

                      <div className="map-head-pills">
                        <div className="map-count-pill">
                          <MapIcon size={15} />
                          {numberFormat.format(activeMapLocations.length)} موقع
                        </div>

                        {selectedMapLocation && (
                          <div className="map-selected-pill">
                            <LocateFixed size={15} />
                            المحدد: {selectedMapLocation.housingName || "سكن"}
                          </div>
                        )}
                      </div>
                    </div>

                    {activeMapLocations.length > 0 ? (
                      <div className="real-map-wrap">
                        <div className="map-top-overlay">
                          <div className="map-top-stat">
                            <span>المواقع المعروضة</span>
                            <strong>
                              {numberFormat.format(activeMapLocations.length)}
                            </strong>
                          </div>

                          <div className="map-top-stat">
                            <span>إجمالي الحجاج الواصلين</span>
                            <strong>
                              {numberFormat.format(activeMapPilgrims)}
                            </strong>
                          </div>

                          <div className="map-top-stat">
                            <span>أعلى وصول</span>
                            <strong>
                              {highestArrivalLocation
                                ? highestArrivalLocation.housingName
                                : "—"}
                            </strong>
                          </div>
                        </div>

                        <MapContainer
                          key={`${activeId}-${activeMapLocations.length}`}
                          center={mapCenter}
                          zoom={13}
                          scrollWheelZoom={true}
                          className="real-map"
                        >
                          <MapResizeFix />
                          <MapAutoFocus
                            locations={activeMapLocations}
                            selectedLocation={selectedMapLocation}
                          />

                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                          />

                          {activeMapLocations.map((location, index) => {
                            const isSelected =
                              selectedMapLocation?.id === location.id;

                            return (
                              <Marker
                                key={location.id || `${location.lat}-${location.lng}-${index}`}
                                position={[location.lat, location.lng]}
                                icon={createHousingMarker(location, isSelected)}
                                eventHandlers={{
                                  click: () => setSelectedLocationId(location.id),
                                }}
                              >
                                <Popup>
                                  <div className="map-popup" dir="rtl">
                                    <div className="map-popup-header">
                                      <strong>
                                        {location.housingName || "سكن بدون اسم"}
                                      </strong>
                                      <span
                                        className={`map-popup-badge ${getMapStatusClass(
                                          location.readinessPercent
                                        )}`}
                                      >
                                        {location.readinessPercent >= 80
                                          ? "جاهزية مرتفعة"
                                          : location.readinessPercent >= 50
                                          ? "جاهزية متوسطة"
                                          : "جاهزية منخفضة"}
                                      </span>
                                    </div>

                                    <span>رقم المركز: {location.centerNumber || "—"}</span>
                                    <span>رقم التصريح: {location.permitNumber || "—"}</span>
                                    <span>
                                      عدد الحجاج الواصلون:{" "}
                                      {numberFormat.format(location.pilgrimsArrival)}
                                    </span>
                                    <span>
                                      جاهزية السكن: {location.readinessPercent || 0}%
                                    </span>
                                    <span>
                                      الملف: {location.fileName || activeDashboard.name}
                                    </span>

                                    <a
                                      className="google-map-link"
                                      href={getGoogleMapsDirectionsUrl(location)}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      <Navigation size={15} />
                                      فتح الاتجاهات في Google Maps
                                    </a>
                                  </div>
                                </Popup>
                              </Marker>
                            );
                          })}
                        </MapContainer>
                      </div>
                    ) : (
                      <div className="empty-map-state">
                        <MapPinned size={42} />
                        <h3>لا توجد مواقع قابلة للعرض</h3>
                        <p>
                          تأكدي أن عمود إحداثيات الموقع موجود، وأن عدد الحجاج في
                          المسكن الوصول أكبر من صفر، ثم اضغطي تحديث البيانات.
                        </p>
                      </div>
                    )}
                  </motion.div>

                  <motion.div
                    className="chart-card"
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    custom={2}
                  >
                    <div className="card-head">
                      <div>
                        <h3>الموقع المحدد الآن</h3>
                        <p>تفاصيل السكن الذي ضغطتِ عليه</p>
                      </div>
                    </div>

                    {selectedMapLocation ? (
                      <div className="selected-location-card">
                        <div className="selected-location-top">
                          <strong>
                            {selectedMapLocation.housingName || "سكن بدون اسم"}
                          </strong>
                          <span
                            className={`map-popup-badge ${getMapStatusClass(
                              selectedMapLocation.readinessPercent
                            )}`}
                          >
                            {selectedMapLocation.readinessPercent >= 80
                              ? "مرتفع"
                              : selectedMapLocation.readinessPercent >= 50
                              ? "متوسط"
                              : "منخفض"}
                          </span>
                        </div>

                        <div className="selected-location-grid">
                          <div>
                            <span>رقم المركز</span>
                            <strong>{selectedMapLocation.centerNumber || "—"}</strong>
                          </div>
                          <div>
                            <span>رقم التصريح</span>
                            <strong>{selectedMapLocation.permitNumber || "—"}</strong>
                          </div>
                          <div>
                            <span>عدد الحجاج الواصلون</span>
                            <strong>
                              {numberFormat.format(
                                selectedMapLocation.pilgrimsArrival || 0
                              )}
                            </strong>
                          </div>
                          <div>
                            <span>جاهزية السكن</span>
                            <strong>{selectedMapLocation.readinessPercent || 0}%</strong>
                          </div>
                        </div>

                        <a
                          className="google-map-link selected-card-link"
                          href={getGoogleMapsDirectionsUrl(selectedMapLocation)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Navigation size={15} />
                          فتح الاتجاهات في Google Maps
                        </a>

                        <div className="map-legend compact">
                          <div className="map-legend-item good">
                            <span></span>
                            جاهزية مرتفعة
                          </div>
                          <div className="map-legend-item mid">
                            <span></span>
                            جاهزية متوسطة
                          </div>
                          <div className="map-legend-item low">
                            <span></span>
                            جاهزية منخفضة
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="empty-mini-state">
                        اضغطي على أحد المواقع من الخريطة أو من القائمة.
                      </div>
                    )}
                  </motion.div>

                  <motion.div
                    className="chart-card"
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    custom={3}
                  >
                    <div className="card-head">
                      <div>
                        <h3>قائمة المواقع القابلة للتحديد</h3>
                        <p>اضغطي على أي سكن ليتم تحديده والانتقال إليه</p>
                      </div>
                    </div>

                    <div className="map-summary-list">
                      {activeMapLocations.map((location, index) => (
                        <button
                          type="button"
                          className={`map-summary-item ${
                            selectedMapLocation?.id === location.id ? "active" : ""
                          }`}
                          key={`summary-${location.id || index}`}
                          onClick={() => setSelectedLocationId(location.id)}
                        >
                          <div>
                            <strong>{location.housingName || "سكن بدون اسم"}</strong>
                            <span>مركز {location.centerNumber || "—"}</span>
                          </div>

                          <em>
                            {numberFormat.format(location.pilgrimsArrival)} حاج
                          </em>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;