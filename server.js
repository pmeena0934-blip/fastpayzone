require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/", express.static(path.join(__dirname, "public")));

if (!fs.existsSync("./data")) fs.mkdirSync("./data");
if (!fs.existsSync("./uploads")) fs.mkdirSync("./uploads");

const DB_USERS = "./data/users.json";
const DB_DEPOSITS = "./data/deposits.json";
const DB_WITHDRAW = "./data/withdraw.json";

if (!fs.existsSync(DB_USERS)) fs.writeFileSync(DB_USERS, "[]");
if (!fs.existsSync(DB_DEPOSITS)) fs.writeFileSync(DB_DEPOSITS, "[]");
if (!fs.existsSync(DB_WITHDRAW)) fs.writeFileSync(DB_WITHDRAW, "[]");

const upload = multer({ dest: "uploads/" });

function readDB(file) {
  return JSON.parse(fs.readFileSync(file));
}
function writeDB(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
function uid(prefix) {
  return prefix + crypto.randomBytes(6).toString("hex");
}

const ADMIN_PASS = process.env.ADMIN_PASS || "FPZ!2025$";
const ADMIN_UPI_1 = process.env.ADMIN_UPI_1 || "poojamahta67-1@okicici";
const ADMIN_UPI_2 = process.env.ADMIN_UPI_2 || "herry9336@ptyes";

// Health
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// Create new user
app.post("/api/user/create", (req, res) => {
  const { name, phone } = req.body;
  if (!phone) return res.status(400).json({ error: "phone required" });

  const users = readDB(DB_USERS);
  const id = uid("u_");

  const user = {
    id,
    name: name || "User-" + id.slice(2, 6),
    phone,
    wallet: 0,
    created_at: new Date().toISOString(),
  };

  users.push(user);
  writeDB(DB_USERS, users);

  res.json({ ok: true, user });
});

// Manual Deposit
app.post("/api/deposit/manual", upload.single("screenshot"), (req, res) => {
  const { user_id, amount } = req.body;

  if (!user_id || !amount)
    return res.status(400).json({ error: "user_id and amount required" });

  const deposits = readDB(DB_DEPOSITS);

  const data = {
    id: uid("dep_"),
    user_id,
    amount: Number(amount),
    screenshot: req.file ? "/uploads/" + req.file.filename : null,
    status: "pending",
    created_at: new Date().toISOString(),
  };

  deposits.push(data);
  writeDB(DB_DEPOSITS, deposits);

  res.json({ ok: true, deposit: data });
});

// Withdraw
app.post("/api/withdraw/request", (req, res) => {
  const { user_id, amount, upi } = req.body;

  const users = readDB(DB_USERS);
  const user = users.find((u) => u.id === user_id);

  if (!user) return res.json({ error: "User not found" });
  if (user.wallet < amount) return res.json({ error: "Insufficient balance" });

  const fee = amount * 0.1;
  const withdraw_amount = amount - fee;

  user.wallet -= amount;
  writeDB(DB_USERS, users);

  const withdraws = readDB(DB_WITHDRAW);
  withdraws.push({
    id: uid("wd_"),
    user_id,
    amount,
    fee,
    withdraw_amount,
    upi,
    status: "pending",
    created_at: new Date().toISOString(),
  });

  writeDB(DB_WITHDRAW, withdraws);

  res.json({ ok: true });
});

// Admin deposits
app.get("/admin/deposits", (req, res) => {
  if (req.headers["x-admin-pass"] !== ADMIN_PASS)
    return res.json({ error: "Unauthorized" });

  res.json(readDB(DB_DEPOSITS));
});

// Admin verify
app.post("/admin/deposits/:id/verify", (req, res) => {
  if (req.headers["x-admin-pass"] !== ADMIN_PASS)
    return res.json({ error: "Unauthorized" });

  const deposits = readDB(DB_DEPOSITS);
  const users = readDB(DB_USERS);

  const id = req.params.id;
  const dep = deposits.find((d) => d.id === id);

  if (!dep) return res.json({ error: "Not found" });

  dep.status = "verified";

  const user = users.find((u) => u.id === dep.user_id);
  if (user) user.wallet += dep.amount;

  writeDB(DB_USERS, users);
  writeDB(DB_DEPOSITS, deposits);

  res.json({ ok: true });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("Server running on port", PORT));
