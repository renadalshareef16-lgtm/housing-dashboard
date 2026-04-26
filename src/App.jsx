import { useMemo, useState } from "react";
import logo from "./assets/logo.png";

function App() {
  const dashboards = [
    {
      id: 1,
      name: "110 - 111 - 112 - 113",
      title: "مــركز 110 - 111 - 112 - 113",
      centersCount: 4,
      housesCount: 66,
      pilgrimsCount: 1301,
      complete: 2,
      partial: 56,
      incomplete: 8,
      readyPercent: 62.4,
      progress: [
        { center: "110", value: 69.33 },
        { center: "111", value: 50.5 },
        { center: "112", value: 67.25 },
        { center: "113", value: 62.5 },
      ],
      notes: [
        "استمارة المتابعة اليومية أثناء وجود الحجاج",
        "كرت الموقع",
        "عقد صيانة الخدمات العامة",
        "استمارة كشف مساكن الحجاج",
        "بيان كشف الجاهزية على المساكن قبل وصول الحجاج",
      ],
      quickPositive: "مركز 110 الأعلى إنجازًا",
      quickPriority: "مركز 111 يحتاج تدخل عاجل",
      executiveNote:
        "يظهر المركز رقم 110 كأفضل مركز من حيث نسبة الإنجاز (69.33%)، بينما يتطلب المركز رقم 111 تدخلاً عاجلاً لتحسين نسبته المنخفضة (50.50%) والتحقيق في أسباب هذا التباين.",
    },
    {
      id: 2,
      name: "120 - 121",
      title: "مــركز 120 - 121",
      centersCount: 2,
      housesCount: 28,
      pilgrimsCount: 0,
      complete: 0,
      partial: 0,
      incomplete: 28,
      readyPercent: 1.1,
      progress: [
        { center: "120", value: 2.25 },
        { center: "121", value: 0.0 },
      ],
      notes: ["جميعها ناقصة"],
      quickPositive: "مركز 120 أعلى نسبيًا من مركز 121",
      quickPriority: "معالجة شاملة لجميع النواقص",
      executiveNote:
        "تُظهر البيانات وجود فجوة حرجة في جاهزية المساكن. يجب اتخاذ إجراءات فورية.",
    },
    {
      id: 3,
      name: "130 - 131 - 132 - 133",
      title: "مــركز 130 - 131 - 132 - 133",
      centersCount: 4,
      housesCount: 62,
      pilgrimsCount: 793,
      complete: 0,
      partial: 42,
      incomplete: 20,
      readyPercent: 64.5,
      progress: [
        { center: "130", value: 78.6 },
        { center: "131", value: 47.1 },
        { center: "132", value: 62.5 },
        { center: "133", value: 69.6 },
      ],
      notes: [
        "عقد المسار الإلكتروني",
        "كرت الموقع",
        "استمارة المتابعة اليومية أثناء وجود الحجاج",
      ],
      quickPositive: "مركز 130 الأعلى إنجازًا",
      quickPriority: "رفع جاهزية مركز 131 ومعالجة النواقص المتكررة",
      executiveNote:
        "تُظهر البيانات أن الملف في مستوى جاهزية متوسط، مع وجود تفاوت واضح بين المراكز؛ حيث يتصدر المركز 130 بنسبة إنجاز مرتفعة، بينما يحتاج المركز 131 إلى متابعة عاجلة لرفع جاهزيته ومعالجة النواقص المتكررة، خصوصًا عقد المسار الإلكتروني وكرت الموقع واستمارة المتابعة اليومية أثناء وجود الحجاج.",
    },
    {
      id: 4,
      name: "140",
      title: "مــركز 140",
      centersCount: 1,
      housesCount: 32,
      pilgrimsCount: 644,
      complete: 0,
      partial: 27,
      incomplete: 5,
      readyPercent: 69.1,
      progress: [{ center: "140", value: 69.06 }],
      notes: [
        "عقد المسار الإلكتروني",
        "بيانات المالك أو المسؤول لسكن",
        "استمارة المتابعة اليومية أثناء وجود الحجاج",
        "كرت الموقع",
        "عقد صيانة الخدمات العامة",
      ],
      quickPositive: "المركز 140 في مستوى إنجاز جيد نسبيًا",
      quickPriority: "استكمال عقد صيانة الخدمات العامة ومعالجة النواقص التوثيقية",
      executiveNote: "14 مسكن لا يتوفر فيه عقد صيانة الخدمات العامة.",
    },
    {
      id: 5,
      name: "150 - 151",
      title: "مــركز 150 - 151",
      centersCount: 2,
      housesCount: 48,
      pilgrimsCount: 4237,
      complete: 11,
      partial: 37,
      incomplete: 0,
      readyPercent: 66.2,
      progress: [
        { center: "150", value: 82.39 },
        { center: "151", value: 50.0 },
      ],
      notes: [
        "استمارة المتابعة اليومية أثناء وجود الحجاج",
        "عقد صيانة الخدمات العامة",
        "عقد الحراسات الأمنية",
        "عقد مكافحة الحشرات",
        "بيان كشف الجاهزية على المساكن قبل وصول الحجاج",
      ],
      quickPositive: "لا يوجد أي مسكن غير مكتمل كليًا",
      quickPriority: "تحويل المساكن المكتملة جزئيًا إلى مكتملة",
      executiveNote:
        "بشكل عام، لا يوجد أي مسكن غير مكتمل بشكل كلي، أي أن كل مسكن على الأقل قد استوفى متطلبًا واحدًا، ولكن 77% من المساكن، 37 من 48، لا تزال في حالة مكتملة جزئيًا، مما يستدعي العمل على تحويلها إلى حالة مكتملة.",
    },
    {
      id: 6,
      name: "210 - 211 - 212",
      title: "مــركز 210 - 211 - 212",
      centersCount: 3,
      housesCount: 0,
      pilgrimsCount: 0,
      complete: 0,
      partial: 0,
      incomplete: 0,
      readyPercent: 0,
      progress: [
        { center: "210", value: 0 },
        { center: "211", value: 0 },
        { center: "212", value: 0 },
      ],
      notes: ["لا توجد بيانات مدخلة"],
      quickPositive: "لا توجد بيانات متاحة للتقييم",
      quickPriority: "إدخال بيانات الجاهزية أولًا",
      executiveNote:
        "لم يتم إدخال بيانات مراكز 210 - 211 - 212 حتى الآن، لذلك لا يمكن تقييم مستوى الجاهزية أو تحديد النواقص التشغيلية بدقة.",
    },
    {
      id: 7,
      name: "220 - 221 - 222",
      title: "مــركز 220 - 221 - 222",
      centersCount: 3,
      housesCount: 23,
      pilgrimsCount: 0,
      complete: 0,
      partial: 23,
      incomplete: 0,
      readyPercent: 86.1,
      progress: [
        { center: "220", value: 83.33 },
        { center: "221", value: 90.0 },
        { center: "222", value: 85.0 },
      ],
      notes: [
        "عقد المسار الإلكتروني",
        "استمارة المتابعة اليومية أثناء وجود الحجاج",
        "نتائج فحص مياه الخزانات",
        "بيانات المالك أو المسؤول لسكن",
        "عقد صيانة المصاعد",
      ],
      quickPositive: "مركز 221 الأعلى إنجازًا",
      quickPriority: "فحص المياه والمصاعد واستكمال بيانات المالك أو المسؤول",
      executiveNote:
        "يجب اتخاذ إجراءات تصحيحية سريعة لضمان سلامة وصحة الحجاج، خاصة في فحص المياه والمصاعد، مع تأمين البيانات الأساسية للمالك والمسؤول لضمان التواصل الفعال.",
    },
    {
      id: 8,
      name: "310 - 311",
      title: "مــركز 310 - 311",
      centersCount: 2,
      housesCount: 50,
      pilgrimsCount: 0,
      complete: 26,
      partial: 24,
      incomplete: 0,
      readyPercent: 84.0,
      progress: [
        { center: "310", value: 84.7 },
        { center: "311", value: 83.24 },
      ],
      notes: [
        "عقد المسار الإلكتروني",
        "استمارة المتابعة اليومية أثناء وجود الحجاج",
        "بيان كشف الجاهزية على المساكن قبل وصول الحجاج",
        "استمارة كشف مساكن الحجاج",
        "ملف تعريفي لكل مسكن (باركود + صورة للمبنى)",
        "كرت الموقع",
      ],
      quickPositive: "تقارب ممتاز بين مركزي 310 و311",
      quickPriority: "استكمال النواقص التوثيقية وبيانات الحجاج",
      executiveNote:
        "غياب بيانات الحجاج يحد من تحديد الأولوية؛ نظرًا لعدم توفر بيانات عدد الحجاج، لا يمكن تحديد أولويات العمل بناءً على حجم المسكن أو العدد الفعلي للحجاج المتوقعين، وينبغي التركيز على استكمال جميع النواقص بشكل متساوٍ في جميع المساكن.",
    },
  ];

  const [activeId, setActiveId] = useState(dashboards[0].id);
  const activeDashboard = dashboards.find((item) => item.id === activeId);

  const overall = useMemo(() => {
    return dashboards.reduce(
      (acc, item) => {
        acc.centers += item.centersCount;
        acc.houses += item.housesCount;
        acc.pilgrims += item.pilgrimsCount;
        acc.complete += item.complete;
        acc.partial += item.partial;
        acc.incomplete += item.incomplete;
        return acc;
      },
      {
        centers: 0,
        houses: 0,
        pilgrims: 0,
        complete: 0,
        partial: 0,
        incomplete: 0,
      }
    );
  }, [dashboards]);

  const totalReadyPercent = (
    (overall.complete / overall.houses) * 100 || 0
  ).toFixed(1);

  const activeReadyPercent =
    activeDashboard.readyPercent !== undefined
      ? activeDashboard.readyPercent.toFixed(1)
      : (
          activeDashboard.progress.reduce((sum, item) => sum + item.value, 0) /
            activeDashboard.progress.length || 0
        ).toFixed(1);

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
              <p className="hero-description">لـجــنة الإســكان</p>
            </div>
          </div>

          <div className="hero-side">
            <div className="hero-meta">
              <div>إعداد: ريناد الشريف</div>
              <div>آخر تحديث: 26 / 04 / 2026</div>
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
            <span>إجمالي عدد الحجاج</span>
            <strong>{overall.pilgrims}</strong>
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
            <p className="section-label">لوحات المتابعة</p>
            <h2>لـجــنةالإســكان</h2>
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
          <p className="section-label">الملف النشط</p>
          <h2>{activeDashboard.title}</h2>
          <p className="dashboard-subtitle">جــاهزية المـــساكــن</p>
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

        <div className="stat-card neutral-card">
          <span>عدد الحجاج في الملف</span>
          <strong>{activeDashboard.pilgrimsCount}</strong>
        </div>
      </section>

      <section className="charts-grid">
        <div className="chart-card wide-card">
          <div className="card-head">
            <h3>التوزيع العام للحالة</h3>
            <span>ملخص الحالة</span>
          </div>

          <div className="distribution-grid">
            <div className="distribution-item">
              <div className="distribution-title">مكتمل</div>
              <div className="distribution-bar complete-bar">
                <div
                  className="distribution-fill complete-fill"
                  style={{
                    width: `${Math.round(
                      (activeDashboard.complete /
                        activeDashboard.housesCount) *
                        100 || 0
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
                      (activeDashboard.partial /
                        activeDashboard.housesCount) *
                        100 || 0
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
                      (activeDashboard.incomplete /
                        activeDashboard.housesCount) *
                        100 || 0
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
            <span>نطاق الملف</span>
          </div>

          <div className="big-number-box">
            <strong>{activeDashboard.centersCount}</strong>
            <p>عدد المراكز المرتبطة بهذا الملف</p>
          </div>
        </div>

        <div className="chart-card">
          <div className="card-head">
            <h3>أكثر النواقص تكرارًا</h3>
            <span>عناصر التعثر</span>
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
            <span>مؤشر الاكتمال</span>
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
            <span>قراءة مختصرة</span>
          </div>

          <div className="mini-summary">
            <div className="mini-box">
              <span>أفضل مؤشر</span>
              <strong>{activeDashboard.quickPositive}</strong>
            </div>

            <div className="mini-box">
              <span>أولوية المتابعة</span>
              <strong>{activeDashboard.quickPriority}</strong>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="card-head">
            <h3>بطاقة الملف</h3>
            <span>تعريف الملف</span>
          </div>

          <div className="file-card-preview">
            <p>اسم الملف</p>
            <strong>{activeDashboard.name}</strong>
          </div>
        </div>

        <div className="chart-card">
          <div className="card-head">
            <h3>جاهزية الملف</h3>
            <span>متوسط إنجاز المراكز</span>
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
            <span>قراءة تنفيذية</span>
          </div>

          <div className="note-box">{activeDashboard.executiveNote}</div>
        </div>
      </section>
    </div>
  );
}

export default App;