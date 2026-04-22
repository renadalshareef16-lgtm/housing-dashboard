import { useMemo, useState } from "react";
import logo from "./assets/logo.png";

function App() {
  const dashboards = [
    {
      id: 1,
      name: "150 - 151",
      title: "مــركز 150 - 151",
      centersCount: 2,
      housesCount: 42,
      complete: 10,
      partial: 6,
      incomplete: 26,
      progress: [
        { center: "150", value: 46 },
        { center: "151", value: 39 },
      ],
      notes: ["عقود الصيانة", "وسائل السلامة", "الترخيص"],
    },
    {
      id: 2,
      name: "110 - 111 - 112 - 113",
      title: "مــركز 110 - 111 - 112 - 113",
      centersCount: 4,
      housesCount: 68,
      complete: 18,
      partial: 12,
      incomplete: 38,
      progress: [
        { center: "110", value: 52 },
        { center: "111", value: 41 },
        { center: "112", value: 37 },
        { center: "113", value: 49 },
      ],
      notes: ["السلامة", "النظافة", "العقود"],
    },
    {
      id: 3,
      name: "120 - 121",
      title: "مــركز  120 - 121",
      centersCount: 2,
      housesCount: 31,
      complete: 9,
      partial: 4,
      incomplete: 18,
      progress: [
        { center: "120", value: 44 },
        { center: "121", value: 40 },
      ],
      notes: ["التأمين", "المصاعد", "الترخيص"],
    },
    {
      id: 4,
      name: "130 - 131 - 132 - 133",
      title: "مــركز 130 - 131 - 132 - 133",
      centersCount: 4,
      housesCount: 56,
      complete: 14,
      partial: 8,
      incomplete: 34,
      progress: [
        { center: "130", value: 53 },
        { center: "131", value: 41 },
        { center: "132", value: 38 },
        { center: "133", value: 47 },
      ],
      notes: ["النظافة", "عقد المصاعد", "السلامة"],
    },
    {
      id: 5,
      name: "140",
      title: "مــركز 140",
      centersCount: 1,
      housesCount: 19,
      complete: 6,
      partial: 3,
      incomplete: 10,
      progress: [{ center: "140", value: 51 }],
      notes: ["الترخيص", "التأمين", "العقد"],
    },
    {
      id: 6,
      name: "210 - 211 - 212",
      title: " 210 - 211 - 212",
      centersCount: 3,
      housesCount: 47,
      complete: 8,
      partial: 9,
      incomplete: 30,
      progress: [
        { center: "210", value: 34 },
        { center: "211", value: 48 },
        { center: "212", value: 42 },
      ],
      notes: ["وسائل السلامة", "النظافة", "العقود"],
    },
    {
      id: 7,
      name: "220 - 221 - 222 ",
      title: " 220 - 221 - 222 مــركز ",
      centersCount: 3,
      housesCount: 44,
      complete: 7,
      partial: 8,
      incomplete: 29,
      progress: [
        { center: "220", value: 33 },
        { center: "221", value: 45 },
        { center: "222", value: 39 },
      ],
      notes: ["التأمين", "المصاعد", "الترخيص"],
    },
    {
      id: 8,
      name: "310 - 311",
      title: " 310 - 311 مــركز",
      centersCount: 2,
      housesCount: 38,
      complete: 4,
      partial: 5,
      incomplete: 29,
      progress: [
        { center: "310", value: 29 },
        { center: "311", value: 36 },
      ],
      notes: ["السلامة", "النظافة", "المصاعد"],
    },
  ];

  const [activeId, setActiveId] = useState(dashboards[0].id);
  const activeDashboard = dashboards.find((item) => item.id === activeId);

  const overall = useMemo(() => {
    return dashboards.reduce(
      (acc, item) => {
        acc.centers += item.centersCount;
        acc.houses += item.housesCount;
        acc.complete += item.complete;
        acc.partial += item.partial;
        acc.incomplete += item.incomplete;
        return acc;
      },
      { centers: 0, houses: 0, complete: 0, partial: 0, incomplete: 0 }
    );
  }, [dashboards]);

  const totalReadyPercent = Math.round(
    (overall.complete / overall.houses) * 100 || 0
  );

  const activeReadyPercent = Math.round(
    (activeDashboard.complete / activeDashboard.housesCount) * 100 || 0
  );

  return (
    <div className="page" dir="rtl">
      <header className="hero">
        <div className="hero-blur hero-blur-1"></div>
        <div className="hero-blur hero-blur-2"></div>

        <div className="hero-top">
          <div className="hero-brand">
            <img src={logo} alt="Company Logo" className="hero-logo" />

            <div className="hero-text">
              

              <p className="hero-label">لوحة متابعة جاهزيةالمساكن</p>
              <h1>يـــســر الــمشاعـر</h1>
              <p className="hero-description">
                لـجــنة الإســكان      
              </p>
            </div>
          </div>

        <div className="hero-side">
  <div className="hero-meta">
    <div>إعداد: ريناد الشريف</div>
    <div>آخر تحديث: 22 / 04 / 2026</div>
  </div>

  <button className="hero-button">آخر تحديث</button>
</div>
        </div>

        <section className="overall-grid">
          <div className="glass-card">
            <span>إجمالي المراكز</span>
            <strong>{overall.centers}</strong>
          </div>
          <div className="glass-card">
            <span>إجمالي المساكن</span>
            <strong>{overall.houses}</strong>
          </div>
          <div className="glass-card">
            <span>المكتمل</span>
            <strong>{overall.complete}</strong>
          </div>
          <div className="glass-card">
            <span>المكتمل جزئيًا</span>
            <strong>{overall.partial}</strong>
          </div>
          <div className="glass-card">
            <span>غير المكتمل</span>
            <strong>{overall.incomplete}</strong>
          </div>
          <div className="glass-card">
            <span>نسبة الجاهزية</span>
            <strong>{totalReadyPercent}%</strong>
          </div>
        </section>
      </header>

      <section className="tabs-section">
        <div className="section-head">
          <div>
            <p className="section-label">Dashboards</p>
            <h2>ملفات الداش بورد الثمانية</h2>
          </div>
        </div>

        <div className="tabs-wrap">
          {dashboards.map((item) => (
            <button
              key={item.id}
              className={`tab-btn ${activeId === item.id ? "active" : ""}`}
              onClick={() => setActiveId(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>
      </section>

      <section className="dashboard-head-card">
        <div>
          <p className="section-label">Active Dashboard</p>
          <h2>{activeDashboard.title}</h2>
          <p className="dashboard-subtitle">
            يعرض حالة المساكن لهذا الملف بشكل منفصل داخل نفس الموقع
          </p>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card complete-card">
          <span>مكتمل</span>
          <strong>{activeDashboard.complete}</strong>
        </div>

        <div className="stat-card partial-card">
          <span>مكتمل جزئيًا</span>
          <strong>{activeDashboard.partial}</strong>
        </div>

        <div className="stat-card incomplete-card">
          <span>غير مكتمل</span>
          <strong>{activeDashboard.incomplete}</strong>
        </div>

        <div className="stat-card neutral-card">
          <span>عدد المساكن في الملف</span>
          <strong>{activeDashboard.housesCount}</strong>
        </div>
      </section>

      <section className="charts-grid">
        <div className="chart-card wide-card">
          <div className="card-head">
            <h3>التوزيع العام للحالة</h3>
            <span>Visual 1</span>
          </div>

          <div className="distribution-grid">
            <div className="distribution-item">
              <div className="distribution-title">مكتمل</div>
              <div className="distribution-bar complete-bar">
                <div
                  className="distribution-fill complete-fill"
                  style={{
                    width: `${Math.round(
                      (activeDashboard.complete / activeDashboard.housesCount) * 100 || 0
                    )}%`,
                  }}
                ></div>
              </div>
              <strong>{activeDashboard.complete}</strong>
            </div>

            <div className="distribution-item">
              <div className="distribution-title">مكتمل جزئيًا</div>
              <div className="distribution-bar partial-bar">
                <div
                  className="distribution-fill partial-fill"
                  style={{
                    width: `${Math.round(
                      (activeDashboard.partial / activeDashboard.housesCount) * 100 || 0
                    )}%`,
                  }}
                ></div>
              </div>
              <strong>{activeDashboard.partial}</strong>
            </div>

            <div className="distribution-item">
              <div className="distribution-title">غير مكتمل</div>
              <div className="distribution-bar incomplete-bar">
                <div
                  className="distribution-fill incomplete-fill"
                  style={{
                    width: `${Math.round(
                      (activeDashboard.incomplete / activeDashboard.housesCount) * 100 || 0
                    )}%`,
                  }}
                ></div>
              </div>
              <strong>{activeDashboard.incomplete}</strong>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="card-head">
            <h3>عدد المراكز داخل الملف</h3>
            <span>Visual 2</span>
          </div>

          <div className="big-number-box">
            <strong>{activeDashboard.centersCount}</strong>
            <p>عدد المراكز المرتبطة بهذا الملف</p>
          </div>
        </div>

        <div className="chart-card">
          <div className="card-head">
            <h3>أكثر النواقص تكرارًا</h3>
            <span>Visual 3</span>
          </div>

          <div className="tags-wrap">
            {activeDashboard.notes.map((note, index) => (
              <div className="tag-chip" key={index}>
                {note}
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card wide-card">
          <div className="card-head">
            <h3>نسبة الإنجاز حسب المركز</h3>
            <span>Visual 4</span>
          </div>

          <div className="progress-list">
            {activeDashboard.progress.map((item, index) => (
              <div className="progress-row" key={index}>
                <div className="progress-meta">
                  <span className="center-name">مركز {item.center}</span>
                  <span className="progress-value">{item.value}%</span>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${item.value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="card-head">
            <h3>لمحة سريعة</h3>
            <span>Visual 5</span>
          </div>

          <div className="mini-summary">
            <div className="mini-box">
              <span>نسبة الجاهزية</span>
              <strong>{activeReadyPercent}%</strong>
            </div>
            <div className="mini-box">
              <span>الحالة الأضعف</span>
              <strong>غير مكتمل</strong>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="card-head">
            <h3>بطاقة الملف</h3>
            <span>Visual 6</span>
          </div>

          <div className="file-card-preview">
            <p>اسم الملف</p>
            <strong>{activeDashboard.name}</strong>
          </div>
        </div>

        <div className="chart-card">
          <div className="card-head">
            <h3>جاهزية الملف</h3>
            <span>Visual 7</span>
          </div>

          <div className="circle-wrap">
            <div
              className="circle-ring"
              style={{
                background: `conic-gradient(#7d56c8 0deg, #b696f7 ${
                  activeReadyPercent * 3.6
                }deg, #efe8fb ${activeReadyPercent * 3.6}deg 360deg)`,
              }}
            >
              <div className="circle-inner">{activeReadyPercent}%</div>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="card-head">
            <h3>ملاحظة تنفيذية</h3>
            <span>Visual 8</span>
          </div>

          <div className="note-box">
            هذا الملف يحتاج متابعة مباشرة على عناصر النقص المتكررة قبل اعتماد الجاهزية النهائية.
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;