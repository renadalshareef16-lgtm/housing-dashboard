import { useMemo, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
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
} from "recharts";
import logo from "./assets/logo.png";

const GOOGLE_SCRIPT_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbyk4CaYI6MZi6aRcnUxWNDDT4JZKlWSsVJ1NcVEjh1FLo4L9frjYcrTqI7ZjXRJul3ODg/exec";

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
      quickPositive: row.quickPositive || "لا توجد بيانات كافية",
      quickPriority: row.quickPriority || "لا توجد أولوية محددة",
      executiveNote: row.executiveNote || "لا توجد ملاحظة تنفيذية مدخلة.",
      lastUpdated: row.lastUpdated || "",
    }))
    .filter((item) => item.name);
}

function App() {
  const [dashboards, setDashboards] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeView, setActiveView] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingPNG, setIsExportingPNG] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [lastSyncTime, setLastSyncTime] = useState("");
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
        const stillExists = mappedDashboards.some((item) => item.id === currentId);
        return stillExists ? currentId : mappedDashboards[0].id;
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

  const activeDashboard =
    dashboards.find((item) => item.id === activeId) || dashboards[0];

  const overall = useMemo(() => {
    return dashboards.reduce(
      (acc, item) => {
        acc.houses += item.housesCount;
        acc.pilgrims += item.pilgrimsCount;
        acc.complete += item.complete;
        acc.partial += item.partial;
        acc.incomplete += item.incomplete;
        acc.weightedReady += item.readyPercent * item.housesCount;
        return acc;
      },
      {
        houses: 0,
        pilgrims: 0,
        complete: 0,
        partial: 0,
        incomplete: 0,
        weightedReady: 0,
      }
    );
  }, [dashboards]);

  const totalReadyPercent =
    overall.houses > 0
      ? (overall.weightedReady / overall.houses).toFixed(1)
      : "0.0";

  const fileComparisonData = dashboards.map((item) => ({
    name: item.name,
    جاهزية: Number(item.readyPercent.toFixed(1)),
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

      const progressSheet = activeDashboard.progress.map((item) => ({
        "الملف النشط": activeDashboard.name,
        المركز: item.center,
        "نسبة الإنجاز": `${item.value}%`,
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
          <button type="button" className="action-btn primary" onClick={loadDashboardData}>
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
              className="filter-chip active"
              onClick={() => setActiveId(dashboards[0]?.id)}
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
            <button type="button" className="filter-chip active">
              كل الملفات 🏗️
            </button>

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
                className="active-file-panel"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.35 }}
              >
                <div className="active-file-text">
                  <p>الملف النشط</p>
                  <h2>{activeDashboard.title}</h2>
                  <span>جــاهزية المــساكن حسب بيانات الملف المحدد</span>
                </div>

                <div className={`readiness-pill ${statusClass}`}>{statusText}</div>
              </motion.section>
            </AnimatePresence>

            <section className="charts-grid">
              {(activeView === "overview" || activeView === "files") && (
                <>
                  <motion.div className="chart-card wide" variants={cardVariants} initial="hidden" animate="visible" custom={1}>
                    <div className="card-head">
                      <div>
                        <h3>أداء ملفات المراكز مقارنة ببعضها 🏗️</h3>
                        <p>متوسط نسبة الجاهزية لكل ملف</p>
                      </div>
                    </div>

                    <div className="chart-height large">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={fileComparisonData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
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
                        <h3>توزيع حالة الملف 🥧</h3>
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
                        <h3>نسبة الإنجاز حسب المركز 📊</h3>
                        <p>تفصيل المراكز داخل الملف النشط</p>
                      </div>
                    </div>

                    <div className="chart-height">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={activeProgressData}>
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
                          <Area type="monotone" dataKey="value" stroke="#7B3FA4" strokeWidth={3} fill="url(#progressGradient)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>

                  <motion.div className="chart-card" variants={cardVariants} initial="hidden" animate="visible" custom={4}>
                    <div className="card-head">
                      <div>
                        <h3>حالة الجاهزية لكل مركز 🔢</h3>
                        <p>مقارنة داخلية حسب الملف</p>
                      </div>
                    </div>

                    <div className="center-bars">
                      {activeDashboard.progress.map((item) => (
                        <div className="center-bar-row" key={item.center}>
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
                          <div className="rank-item good" key={item.center}>
                            <span>مركز {item.center}</span>
                            <strong>{item.value}%</strong>
                          </div>
                        ))}
                      </div>

                      <div>
                        <h4>الأدنى إنجازًا ⚠️</h4>
                        {lowCenters.map((item) => (
                          <div className="rank-item low" key={item.center}>
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
                        <span>عدد المساكن في الملف</span>
                        <strong>{numberFormat.format(activeDashboard.housesCount)}</strong>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div className="chart-card" variants={cardVariants} initial="hidden" animate="visible" custom={8}>
                    <div className="card-head">
                      <div>
                        <h3>جاهزية الملف 🧭</h3>
                        <p>مؤشر الجاهزية العام للملف</p>
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
                          <strong>{activeDashboard.readyPercent.toFixed(1)}%</strong>
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
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;