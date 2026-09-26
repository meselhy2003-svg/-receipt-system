import React, { useState, useMemo } from "react";
import { Search, Plus, ArrowRight, RotateCw, Trash2, CheckCircle2 } from "lucide-react";
import "./AdminDashboard.css";

export default function AdminDashboard({
  invoices = [],
  onViewInvoice,
  onCreateNewInvoice,
  onRefresh,
  onDeleteInvoice,
  isLoading = false,
  apiStatus = "idle",
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);
  const itemsPerPage = 5;

  // Filter invoices by client name or invoice number
  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices;
    const q = searchQuery.toLowerCase().trim();
    return invoices.filter(
      (inv) =>
        inv.clientName?.toLowerCase().includes(q) ||
        inv.invoiceNumber?.toLowerCase().includes(q)
    );
  }, [invoices, searchQuery]);

  // Unique clients count
  const clientsCount = useMemo(() => {
    const unique = new Set(invoices.map((inv) => inv.clientName).filter(Boolean));
    return unique.size || (invoices.length > 0 ? invoices.length : 0);
  }, [invoices]);

  // Overall total revenue
  const totalRevenue = useMemo(() => {
    const sum = invoices.reduce((acc, inv) => acc + (parseFloat(inv.total) || 0), 0);
    return Math.round(sum);
  }, [invoices]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage) || 1;
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(start, start + itemsPerPage);
  }, [filteredInvoices, currentPage, itemsPerPage]);

  const handleDelete = async (inv) => {
    if (window.confirm(`هل أنت متأكد من حذف فاتورة "${inv.clientName || inv.invoiceNumber}"؟`)) {
      setDeletingId(inv.id);
      if (onDeleteInvoice) {
        await onDeleteInvoice(inv.id, inv._id);
      }
      setDeletingId(null);
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-content-wrapper">
        {/* Top Header Row: Dual-Tone Title & New Invoice Button */}
        <div className="admin-header-row">
          <div className="admin-title-col">
            <h1 className="admin-main-title">
              <span className="title-green">Al-Wa</span>
              <span className="title-sand">faa</span>
              <span className="title-green"> Me</span>
              <span className="title-sand">dic</span>
              <span className="title-green">al </span>
              <span className="title-green">Supp</span>
              <span className="title-sand">lie</span>
              <span className="title-green">s and</span>
              <br />
              <span className="title-sand">Cosme</span>
              <span className="title-green">tic</span>
            </h1>
          </div>

          <div className="admin-top-actions">
            {onRefresh && (
              <button
                type="button"
                className="btn-refresh-api"
                onClick={onRefresh}
                disabled={isLoading}
                title="تحديث ومزامنة الفواتير من الخادم"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  backgroundColor: "#ffffff",
                  color: "#374151",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <RotateCw
                  size={15}
                  style={{
                    animation: isLoading ? "spin 1s linear infinite" : "none",
                  }}
                />
                <span>{isLoading ? "جاري التحديث..." : "مزامنة"}</span>
              </button>
            )}

            <button
              type="button"
              className="btn-nav-to-receipt"
              onClick={onCreateNewInvoice}
              title="إنشاء فاتورة جديدة"
            >
              <Plus size={18} />
              <span>إنشاء فاتورة مبيعات</span>
            </button>
          </div>
        </div>

        {/* Stats Card (عدد العملاء & الاجمالي العام لجميع العملاء) */}
        <div className="admin-stats-card">
          {/* Stat 1: عدد العملاء */}
          <div className="stat-item">
            <span className="stat-number">{clientsCount}</span>
            <span className="stat-label-arabic">عدد العملاء</span>
          </div>

          <div className="stats-divider"></div>

          {/* Stat 2: الاجمالي العام لجميع العملاء */}
          <div className="stat-item">
            <span className="stat-number">{totalRevenue.toLocaleString()}</span>
            <span className="stat-label-arabic">الاجمالي العام لجميع العملاء</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="admin-search-bar">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="البحث عن عملاء او فواتير"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Invoices Table Card */}
        <div className="admin-table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="th-client">اسم العميل</th>
                <th className="th-inv">رقم الفاتورة</th>
                <th className="th-total">الاجمالي العام</th>
                <th className="th-action"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedInvoices.map((inv) => (
                <tr key={inv.id || inv._id}>
                  {/* Client with Avatar */}
                  <td>
                    <div className="client-info-cell">
                      <div
                        className={`client-avatar-badge ${
                          inv.avatarClass || "avatar-default"
                        }`}
                      >
                        {inv.avatarLetters ||
                          inv.clientName?.slice(0, 2).toUpperCase() ||
                          "CL"}
                      </div>
                      <span className="client-name-text">{inv.clientName}</span>
                    </div>
                  </td>

                  {/* Invoice Badge */}
                  <td className="inv-number-cell">
                    <span className="inv-badge-pill">{inv.invoiceNumber}</span>
                  </td>

                  {/* Total Amount & Currency */}
                  <td>
                    <div className="total-amount-cell">
                      <span className="amount-number">{inv.total?.toLocaleString() || inv.total}</span>
                      <span className="amount-currency">SAR</span>
                    </div>
                  </td>

                  {/* Action Link: View → & Delete */}
                  <td className="action-cell">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                      <button
                        type="button"
                        className="btn-view-invoice"
                        onClick={() => onViewInvoice(inv)}
                        title="عرض وطباعة هذه الفاتورة"
                      >
                        <span>View</span>
                        <ArrowRight size={14} />
                      </button>

                      {onDeleteInvoice && (
                        <button
                          type="button"
                          className="btn-delete-invoice"
                          onClick={() => handleDelete(inv)}
                          disabled={deletingId === inv.id}
                          title="حذف الفاتورة"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            padding: "6px",
                            borderRadius: "6px",
                            display: "inline-flex",
                            alignItems: "center",
                            opacity: deletingId === inv.id ? 0.4 : 0.8,
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {paginatedInvoices.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>
                    {isLoading ? "جاري تحميل الفواتير من السيرفر..." : "لا توجد فواتير مطابقة لبحثك"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Row matching original image */}
        <div className="admin-pagination-row">
          <button
            type="button"
            className="pagination-btn nav-text"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            &lt; Prev
          </button>

          <button
            type="button"
            className={`pagination-btn ${currentPage === 1 ? "active" : ""}`}
            onClick={() => setCurrentPage(1)}
          >
            1
          </button>

          <button
            type="button"
            className={`pagination-btn ${currentPage === 2 ? "active" : ""}`}
            onClick={() => setCurrentPage(2)}
          >
            2
          </button>

          <button
            type="button"
            className={`pagination-btn ${currentPage === 3 ? "active" : ""}`}
            onClick={() => setCurrentPage(3)}
          >
            3
          </button>

          <span className="pagination-dots">...</span>

          <button
            type="button"
            className={`pagination-btn ${currentPage === 6 ? "active" : ""}`}
            onClick={() => setCurrentPage(6)}
          >
            6
          </button>

          <button
            type="button"
            className="pagination-btn nav-text"
            onClick={() => setCurrentPage((p) => Math.min(6, p + 1))}
          >
            Next &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
