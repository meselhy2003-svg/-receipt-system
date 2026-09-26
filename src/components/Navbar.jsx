import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  ZoomIn,
  ZoomOut,
  SlidersHorizontal,
  CheckCircle2,
  FileDown,
  Printer,
  Plus,
} from "lucide-react";

export default function Navbar({
  zoomLevel = 1,
  fitScale = 1,
  zoomIn,
  zoomOut,
  resetZoom,
  showPanel,
  setShowPanel,
  onSubmitInvoice,
  onDownloadPdf,
  onPrint,
  isGeneratingPdf,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const isReceiptRoute = location.pathname.startsWith("/receipt");

  return (
    <header className="app-navbar no-print">
      <div className="navbar-brand">
        <div className="brand-logo-badge">و</div>
        <div className="brand-text-col">
          <span className="brand-title">شركة الوفاء للمستلزمات</span>
          <span className="brand-subtitle">Al-Wafaa Medical Supplies & Cosmetic</span>
        </div>
      </div>

      {/* Primary Route Switcher Tabs: /admin vs /receipt */}
      <div className="view-mode-tabs-container">
        <NavLink
          to="/admin"
          className={({ isActive }) =>
            `view-tab-btn ${isActive ? "active" : ""}`
          }
        >
          <LayoutDashboard size={15} />
          <span>لوحة الإدارة (Admin)</span>
        </NavLink>

        <NavLink
          to="/receipt"
          className={({ isActive }) =>
            `view-tab-btn ${isActive ? "active" : ""}`
          }
        >
          <FileText size={15} />
          <span>فاتورة المبيعات (Receipt)</span>
        </NavLink>
      </div>

      <div className="navbar-controls">
        {isReceiptRoute ? (
          <>
            {/* Zoom controls for preview */}
            <div className="zoom-controls" title="تكبير / تصغير المعاينة">
              <button className="zoom-btn" onClick={zoomOut} title="تصغير">
                <ZoomOut size={15} />
              </button>
              <span
                className="zoom-level-text"
                onClick={resetZoom}
                title="إعادة ضبط الحجم"
                style={{ cursor: "pointer" }}
              >
                {Math.round(fitScale * 100)}%
              </span>
              <button className="zoom-btn" onClick={zoomIn} title="تكبير">
                <ZoomIn size={15} />
              </button>
            </div>

            {/* Toggle sidebar panel (Desktop) */}
            <button
              className="btn-toggle-panel"
              onClick={() => setShowPanel((prev) => !prev)}
            >
              <SlidersHorizontal size={15} />
              <span>{showPanel ? "إخفاء التحكم" : "إظهار التحكم"}</span>
            </button>

            {/* Quick Submit */}
            <button
              className="btn-nav-action"
              onClick={onSubmitInvoice}
              title="اعتماد وحفظ الفاتورة"
            >
              <CheckCircle2 size={15} />
              <span>اعتماد الفاتورة</span>
            </button>

            {/* Quick Download PDF */}
            <button
              className="btn-nav-action pdf"
              onClick={onDownloadPdf}
              disabled={isGeneratingPdf}
              title="تنزيل الفاتورة بصيغة PDF"
            >
              <FileDown size={15} />
              <span>{isGeneratingPdf ? "جاري التجهيز..." : "تحميل PDF"}</span>
            </button>

            {/* Print */}
            <button
              className="btn-toggle-panel"
              onClick={onPrint}
              title="طباعة مباشرة"
            >
              <Printer size={15} />
              <span>طباعة</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn-nav-action"
            onClick={() => navigate("/receipt?new=true")}
          >
            <Plus size={15} />
            <span>إنشاء فاتورة جديدة</span>
          </button>
        )}
      </div>
    </header>
  );
}
