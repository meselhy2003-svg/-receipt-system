import React from "react";
import { useNavigate } from "react-router-dom";
import AdminDashboard from "../components/AdminDashboard";

export default function AdminPage({ invoicesList }) {
  const navigate = useNavigate();

  const handleViewInvoice = (inv) => {
    navigate(`/receipt?id=${inv.id}`);
  };

  const handleCreateNewInvoice = () => {
    navigate("/receipt?new=true");
  };

  return (
    <AdminDashboard
      invoices={invoicesList}
      onViewInvoice={handleViewInvoice}
      onCreateNewInvoice={handleCreateNewInvoice}
    />
  );
}
