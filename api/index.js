import express from "express";
import cors from "cors";
import mongoose from "mongoose";

const app = express();
app.use(cors());
app.use(express.json());

const DB_URL =
  process.env.DB_URL ||
  "mongodb+srv://ahmedheshamahah8_db_user:4d9D8MgfaUlpLzT5@cluster0.yd3c5pf.mongodb.net/receipts?retryWrites=true&w=majority";

// Invoice Schema & Model
const InvoiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    invoiceNumber: { type: String },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    products: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

const Invoice =
  mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);

let isConnecting = false;
async function connectDB() {
  if (mongoose.connection.readyState === 1) return true;
  if (isConnecting) return false;
  isConnecting = true;
  try {
    await mongoose.connect(DB_URL, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnecting = false;
    return true;
  } catch (err) {
    isConnecting = false;
    console.error("MongoDB Atlas connection error:", err.message);
    return false;
  }
}

// Middleware to attempt connection without crashing
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (e) {
    // continue
  }
  next();
});

// Router for invoices
const router = express.Router();

router.get("/health", (req, res) => {
  const isDbUp = mongoose.connection.readyState === 1;
  res.json({
    status: "ok",
    dbConnected: isDbUp,
    dbState: mongoose.connection.readyState,
    hint: isDbUp
      ? "MongoDB Atlas connected successfully!"
      : "MongoDB Atlas IP whitelist required: Add 0.0.0.0/0 in MongoDB Atlas Network Access",
    time: new Date().toISOString(),
  });
});

router.get("/invoices", async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: "قاعدة البيانات غير متصلة. يرجى تفعيل Network Access (0.0.0.0/0) في MongoDB Atlas",
      error: "DB_DISCONNECTED",
    });
  }
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.status(200).json(invoices);
  } catch (err) {
    res.status(500).json({ message: "فشل الحصول علي الفواتير", error: err.message });
  }
});

router.post("/invoices", async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: "قاعدة البيانات غير متصلة. يرجى تفعيل Network Access (0.0.0.0/0) في MongoDB Atlas",
      error: "DB_DISCONNECTED",
    });
  }
  try {
    let { name, tax = 0, products = [], invoiceNumber } = req.body;
    if (!name) {
      return res.status(400).json({ message: "اسم العميل مطلوب" });
    }

    if (!invoiceNumber) {
      const count = await Invoice.countDocuments();
      invoiceNumber = `INV-${String(count + 1).padStart(3, "0")}`;
    } else if (!invoiceNumber.startsWith("INV-")) {
      const numOnly = parseInt(String(invoiceNumber).replace(/\D/g, ""), 10);
      invoiceNumber = !isNaN(numOnly)
        ? `INV-${String(numOnly).padStart(3, "0")}`
        : invoiceNumber;
    }

    const priceBeforeTax = products.reduce(
      (acc, p) => acc + (Number(p.price) || 0) * (Number(p.qty) || 0),
      0
    );
    const taxNum = Number(tax) || 0;
    const total =
      taxNum > 0
        ? priceBeforeTax + (priceBeforeTax * taxNum) / 100
        : priceBeforeTax;

    const invoice = await Invoice.create({
      name,
      invoiceNumber,
      tax: taxNum,
      total,
      products,
    });
    res.status(201).json({ message: "تم اضافه الفاتورة بنجاح", invoice });
  } catch (err) {
    res.status(500).json({ message: "فشل اضافه الفاتورة", error: err.message });
  }
});

router.get("/invoices/:id", async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "الفاتورة غير موجودة" });
    res.status(200).json(invoice);
  } catch (err) {
    res.status(500).json({ message: "فشل الحصول علي الفاتورة", error: err.message });
  }
});

router.delete("/invoices/:id", async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "تم حذف الفاتورة بنجاح" });
  } catch (err) {
    res.status(500).json({ message: "فشل حذف الفاتورة", error: err.message });
  }
});

// Mount router on both /api/v1 and root
app.use("/api/v1", router);
app.use("/api", router);
app.use("/", router);

export default app;
