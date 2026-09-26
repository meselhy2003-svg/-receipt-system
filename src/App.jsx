import React, { useState, useMemo, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import Navbar from "./components/Navbar";
import ReceiptPage from "./pages/ReceiptPage";
import AdminPage from "./pages/AdminPage";
import { initialAdminInvoices } from "./data/invoicesData";

export default function App() {
  // Shared invoices list with localStorage persistence
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

  // UI state for receipt scaling & controls
  const [showPanel, setShowPanel] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [containerWidth, setContainerWidth] = useState(723);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("alwafaa_invoices", JSON.stringify(invoicesList));
  }, [invoicesList]);

  // Save new invoice
  const handleSaveNewInvoice = (newRecord) => {
    setInvoicesList((prev) => [newRecord, ...prev]);
  };

  // Zoom controls
  const zoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.1, 1.4));
  const zoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));
  const resetZoom = () => setZoomLevel(1);

  // Mobile scale computation
  const fitScale = useMemo(() => {
    const isMobile = window.innerWidth <= 860;
    if (!isMobile) return zoomLevel;
    const availableW = Math.max(280, containerWidth - 24);
    const baseScale = Math.min(1, availableW / 723);
    return baseScale * zoomLevel;
  }, [containerWidth, zoomLevel]);

  return (
    <div className="app-container">
      {/* Top Navbar with Dedicated Route Links (/admin and /receipt) */}
      <Navbar
        zoomLevel={zoomLevel}
        fitScale={fitScale}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        resetZoom={resetZoom}
        showPanel={showPanel}
        setShowPanel={setShowPanel}
        isGeneratingPdf={isGeneratingPdf}
      />

      {/* Declarative Routes */}
      <Routes>
        {/* Default route redirects to /receipt */}
        <Route path="/" element={<Navigate to="/receipt" replace />} />

        {/* Dedicated Receipt Page Route */}
        <Route
          path="/receipt"
          element={
            <ReceiptPage
              invoicesList={invoicesList}
              onSaveNewInvoice={handleSaveNewInvoice}
              zoomLevel={zoomLevel}
              fitScale={fitScale}
              showPanel={showPanel}
              setContainerWidth={setContainerWidth}
              containerWidth={containerWidth}
              isGeneratingPdf={isGeneratingPdf}
              setIsGeneratingPdf={setIsGeneratingPdf}
              isSubmitModalOpen={isSubmitModalOpen}
              setIsSubmitModalOpen={setIsSubmitModalOpen}
            />
          }
        />

        {/* Dedicated Admin Page Route */}
        <Route
          path="/admin"
          element={<AdminPage invoicesList={invoicesList} />}
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/receipt" replace />} />
      </Routes>
    </div>
  );
}
