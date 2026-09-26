import React, { useState, useMemo, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import {
  FileDown,
  Printer,
  SlidersHorizontal,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Eye,
  Edit3,
  Receipt as ReceiptIcon,
  LayoutDashboard,
  FileText,
  Plus,
} from "lucide-react";
import "./App.css";

import Receipt from "./components/Receipt";
import ControlPanel from "./components/ControlPanel";
import SubmitModal from "./components/SubmitModal";
import AdminDashboard from "./components/AdminDashboard";

import {
  getItemNameByIndex,
  getCurrentDateFormatted,
} from "./utils/arabicOrdinals";
import { downloadReceiptPDF } from "./utils/exportPdf";

// Sample initial data matching the uploaded image exactly
const initialSampleItems = [
  { id: "item-1", name: "الصنف الاول", quantity: 2, price: 10.0 },
  { id: "item-2", name: "الصنف الثاني", quantity: 4, price: 10.0 },
  { id: "item-3", name: "الصنف الثالث", quantity: 6, price: 10.0 },
  { id: "item-4", name: "الصنف الرابع", quantity: 8, price: 10.0 },
];

// Initial invoices for Admin Dashboard matching the second uploaded image
const initialAdminInvoices = [
  {
    id: "inv-001",
    clientName: "Nile Pharma",
    invoiceNumber: "INV-001",
    avatarLetters: "NP",
    avatarClass: "avatar-np",
    total: 2422,
    tax: "0.00",
    date: "2026/09/20",
    items: [
      { id: "np-1", name: "الصنف الاول", quantity: 10, price: 120.0 },
      { id: "np-2", name: "الصنف الثاني", quantity: 8, price: 152.75 },
    ],
  },
  {
    id: "inv-002",
    clientName: "PureCare",
    invoiceNumber: "INV-002",
    avatarLetters: "PC",
    avatarClass: "avatar-pc",
    total: 1823,
    tax: "0.00",
    date: "2026/09/22",
    items: [
      { id: "pc-1", name: "الصنف الاول", quantity: 5, price: 200.0 },
      { id: "pc-2", name: "الصنف الثاني", quantity: 4, price: 205.75 },
    ],
  },
  {
    id: "inv-004",
    clientName: "BioVital Labs",
    invoiceNumber: "INV-004",
    avatarLetters: "BV",
    avatarClass: "avatar-bv",
    total: 5254,
    tax: "0.00",
    date: "2026/09/25",
    items: [
      { id: "bv-1", name: "الصنف الاول", quantity: 15, price: 250.0 },
      { id: "bv-2", name: "الصنف الثاني", quantity: 6, price: 250.66 },
    ],
  },
];

export default function App() {
  // Navigation View: "invoice" | "admin"
  const [currentView, setCurrentView] = useState("admin");

  // Admin invoices state (stored in memory / initialized with sample data)
  const [invoicesList, setInvoicesList] = useState(() => {
    const saved = localStorage.getItem("alwafaa_invoices");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialAdminInvoices;
      }
    }
    return initialAdminInvoices;
  });

  // Manual inputs for the receipt
  const [customerName, setCustomerName] = useState("");
  const [tax, setTax] = useState("0.00");
  const [invoiceNumber, setInvoiceNumber] = useState("1");
  const [invoiceDate, setInvoiceDate] = useState(getCurrentDateFormatted());
  const [items, setItems] = useState(initialSampleItems);

  // UI state
  const [showPanel, setShowPanel] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Mobile specific states
  const [isMobile, setIsMobile] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState("form");
  const [containerWidth, setContainerWidth] = useState(723);
  const previewContainerRef = useRef(null);

  // Sync invoices list to localStorage
  useEffect(() => {
    localStorage.setItem("alwafaa_invoices", JSON.stringify(invoicesList));
  }, [invoicesList]);

  // Detect mobile & measure available width for perfect scaling
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 860;
      setIsMobile(mobile);

      if (previewContainerRef.current) {
        setContainerWidth(previewContainerRef.current.clientWidth);
      } else {
        setContainerWidth(window.innerWidth);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeMobileTab, currentView]);

  // Dynamic scale calculation for mobile viewport fitting
  const fitScale = useMemo(() => {
    if (!isMobile) return zoomLevel;
    const availableW = Math.max(280, containerWidth - 24);
    const baseScale = Math.min(1, availableW / 723);
    return baseScale * zoomLevel;
  }, [isMobile, containerWidth, zoomLevel]);

  // Automatic calculations:
  // 1. Subtotal (اجمالي السعر)
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.price) || 0;
      return sum + q * p;
    }, 0);
  }, [items]);

  // 2. Grand Total (اجمالي العام)
  const grandTotal = useMemo(() => {
    const taxNum = parseFloat(tax) || 0;
    return subtotal + taxNum;
  }, [subtotal, tax]);

  // Function to add a new item with automated Arabic ordinal name (البيان تلقائي)
  const handleAddItem = () => {
    const nextIndex = items.length;
    const autoName = getItemNameByIndex(nextIndex);
    const newItem = {
      id: `item-${Date.now()}-${nextIndex}`,
      name: autoName,
      quantity: 1,
      price: 10.0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Function to remove an item
  const handleRemoveItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Function to update item fields (quantity, price, or custom name)
  const handleUpdateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Reset to original image sample data
  const handleLoadSample = () => {
    setCustomerName("");
    setTax("0.00");
    setInvoiceNumber("1");
    setInvoiceDate(getCurrentDateFormatted());
    setItems(initialSampleItems);
  };

  // Reset for a fresh new invoice
  const handleResetNew = () => {
    setCustomerName("");
    setTax("0.00");
    const nextInv = (parseInt(invoiceNumber, 10) || 0) + 1;
    setInvoiceNumber(String(nextInv));
    setInvoiceDate(getCurrentDateFormatted());
    setItems([
      {
        id: `item-${Date.now()}-0`,
        name: getItemNameByIndex(0),
        quantity: 1,
        price: 10.0,
      },
    ]);
  };

  // Create new invoice from Admin Dashboard
  const handleCreateNewFromAdmin = () => {
    handleResetNew();
    setCurrentView("invoice");
    setActiveMobileTab("form");
  };

  // View specific invoice from Admin Dashboard in Receipt Generator
  const handleViewInvoice = (inv) => {
    setCustomerName(inv.clientName || "");
    setInvoiceNumber(inv.invoiceNumber?.replace("INV-", "") || "1");
    setInvoiceDate(inv.date || getCurrentDateFormatted());
    setTax(inv.tax || "0.00");
    if (inv.items && inv.items.length > 0) {
      setItems(inv.items);
    } else {
      setItems([
        {
          id: `item-${Date.now()}-0`,
          name: "الصنف الاول",
          quantity: 1,
          price: Number(inv.total) || 100,
        },
      ]);
    }
    setCurrentView("invoice");
    setActiveMobileTab("preview");
  };

  // Submit invoice handler
  const handleSubmitInvoice = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    // Save this invoice to Admin Dashboard invoices list
    const clientInitials = customerName
      ? customerName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "CL";

    const newInvoiceRecord = {
      id: `inv-${Date.now()}`,
      clientName: customerName || `عميل #${invoiceNumber}`,
      invoiceNumber: `INV-${String(invoiceNumber).padStart(3, "0")}`,
      avatarLetters: clientInitials,
      avatarClass: "avatar-default",
      total: Math.round(grandTotal),
      tax: tax,
      date: invoiceDate,
      items: items,
    };

    setInvoicesList((prev) => [newInvoiceRecord, ...prev]);
    setIsSubmitModalOpen(true);
  };

  // Download PDF handler
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const fileName = `فاتورة_مبيعات_${invoiceNumber || "1"}.pdf`;
      await downloadReceiptPDF("receipt-document", fileName);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("حدث خطأ أثناء تنزيل ملف الـ PDF. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Print invoice handler
  const handlePrint = () => {
    window.print();
  };

  // Zoom controls
  const zoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.1, 1.4));
  const zoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));
  const resetZoom = () => setZoomLevel(1);

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="app-navbar no-print">
        <div className="navbar-brand">
          <div className="brand-logo-badge">و</div>
          <div className="brand-text-col">
            <span className="brand-title">شركة الوفاء للمستلزمات</span>
            <span className="brand-subtitle">Al-Wafaa Medical Supplies & Cosmetic</span>
          </div>
        </div>

        {/* View Switcher: Admin Dashboard vs Invoice Generator */}
        <div className="view-mode-tabs-container">
          <button
            type="button"
            className={`view-tab-btn ${currentView === "admin" ? "active" : ""}`}
            onClick={() => setCurrentView("admin")}
          >
            <LayoutDashboard size={15} />
            <span>لوحة الإدارة (Admin)</span>
          </button>

          <button
            type="button"
            className={`view-tab-btn ${currentView === "invoice" ? "active" : ""}`}
            onClick={() => setCurrentView("invoice")}
          >
            <FileText size={15} />
            <span>فاتورة المبيعات (Receipt)</span>
          </button>
        </div>

        <div className="navbar-controls">
          {currentView === "invoice" ? (
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

              {/* Quick Submit (Desktop) */}
              <button
                className="btn-nav-action"
                onClick={handleSubmitInvoice}
                title="اعتماد وحفظ الفاتورة"
              >
                <CheckCircle2 size={15} />
                <span>اعتماد الفاتورة</span>
              </button>

              {/* Quick Download PDF (Desktop) */}
              <button
                className="btn-nav-action pdf"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                title="تنزيل الفاتورة بصيغة PDF"
              >
                <FileDown size={15} />
                <span>{isGeneratingPdf ? "جاري التجهيز..." : "تحميل PDF"}</span>
              </button>

              {/* Print (Desktop) */}
              <button
                className="btn-toggle-panel"
                onClick={handlePrint}
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
              onClick={handleCreateNewFromAdmin}
            >
              <Plus size={15} />
              <span>فاتورة جديدة</span>
            </button>
          )}
        </div>
      </header>

      {/* RENDER VIEW 1: ADMIN DASHBOARD */}
      {currentView === "admin" && (
        <AdminDashboard
          invoices={invoicesList}
          onViewInvoice={handleViewInvoice}
          onCreateNewInvoice={handleCreateNewFromAdmin}
        />
      )}

      {/* RENDER VIEW 2: INVOICE GENERATOR & RECEIPT */}
      {currentView === "invoice" && (
        <>
          {/* Mobile Tab Switcher */}
          <div className="mobile-tabs-container no-print">
            <div className="mobile-tabs-bar">
              <button
                type="button"
                className={`mobile-tab-btn ${
                  activeMobileTab === "form" ? "active" : ""
                }`}
                onClick={() => setActiveMobileTab("form")}
              >
                <Edit3 size={15} />
                <span>تعديل الفاتورة</span>
              </button>

              <button
                type="button"
                className={`mobile-tab-btn ${
                  activeMobileTab === "preview" ? "active" : ""
                }`}
                onClick={() => setActiveMobileTab("preview")}
              >
                <Eye size={15} />
                <span>معاينة الفاتورة</span>
              </button>
            </div>
          </div>

          {/* Main Workspace */}
          <main className="app-workspace">
            {/* Control Panel */}
            {(!isMobile ? showPanel : activeMobileTab === "form") && (
              <ControlPanel
                customerName={customerName}
                setCustomerName={setCustomerName}
                invoiceNumber={invoiceNumber}
                setInvoiceNumber={setInvoiceNumber}
                invoiceDate={invoiceDate}
                setInvoiceDate={setInvoiceDate}
                tax={tax}
                setTax={setTax}
                items={items}
                addItem={handleAddItem}
                removeItem={handleRemoveItem}
                updateItem={handleUpdateItem}
                subtotal={subtotal}
                grandTotal={grandTotal}
                onSubmit={handleSubmitInvoice}
                onDownloadPdf={handleDownloadPdf}
                onPrint={handlePrint}
                onLoadSample={handleLoadSample}
                onResetNew={handleResetNew}
                isGeneratingPdf={isGeneratingPdf}
              />
            )}

            {/* Live Receipt Document Preview */}
            {(!isMobile || activeMobileTab === "preview") && (
              <section className="preview-pane" ref={previewContainerRef}>
                <div className="preview-badge-status no-print">
                  <ReceiptIcon size={14} />
                  <span>معاينة الورقة (مطابقة تماماً للتصميم وجاهزة للطباعة والـ PDF)</span>
                </div>

                <div className="receipt-fit-outer">
                  <div
                    className="receipt-mobile-scaler"
                    style={{
                      width: `${723 * fitScale}px`,
                      height: `${1024 * fitScale}px`,
                    }}
                  >
                    <div
                      className="receipt-mobile-inner"
                      style={{
                        transform: `scale(${fitScale})`,
                      }}
                    >
                      <Receipt
                        invoiceNumber={invoiceNumber}
                        customerName={customerName}
                        invoiceDate={invoiceDate}
                        items={items}
                        tax={tax}
                        subtotal={subtotal}
                        grandTotal={grandTotal}
                        minRows={7}
                      />
                    </div>
                  </div>
                </div>
              </section>
            )}
          </main>

          {/* Mobile Sticky Bottom Bar */}
          <div className="mobile-bottom-bar no-print">
            <button
              type="button"
              className="btn-mobile-submit"
              onClick={handleSubmitInvoice}
            >
              <CheckCircle2 size={16} />
              <span>اعتماد (Submit)</span>
            </button>

            <button
              type="button"
              className="btn-mobile-pdf"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
            >
              <FileDown size={15} />
              <span>{isGeneratingPdf ? "جاري التجهيز..." : "PDF"}</span>
            </button>

            <button
              type="button"
              className="btn-mobile-view-toggle"
              onClick={() =>
                setActiveMobileTab((prev) => (prev === "form" ? "preview" : "form"))
              }
            >
              {activeMobileTab === "form" ? (
                <>
                  <Eye size={14} />
                  <span>المعاينة</span>
                </>
              ) : (
                <>
                  <Edit3 size={14} />
                  <span>التعديل</span>
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* Submit Confirmation Modal */}
      <SubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        invoiceNumber={invoiceNumber}
        customerName={customerName}
        invoiceDate={invoiceDate}
        itemCount={items.length}
        subtotal={subtotal}
        tax={tax}
        grandTotal={grandTotal}
        onDownloadPdf={handleDownloadPdf}
        onPrint={handlePrint}
        onNewInvoice={handleResetNew}
      />
    </div>
  );
}
