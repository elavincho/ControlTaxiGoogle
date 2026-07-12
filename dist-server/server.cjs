var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var import_express9 = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_mongoose9 = __toESM(require("mongoose"), 1);
var import_dotenv2 = __toESM(require("dotenv"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_vite = require("vite");

// server/routes/index.ts
var import_express8 = require("express");

// server/routes/authRoutes.ts
var import_express = require("express");

// server/models/User.ts
var import_mongoose = __toESM(require("mongoose"), 1);
var userSchema = new import_mongoose.default.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  carBrand: { type: String },
  carModel: { type: String },
  carYear: { type: Number },
  carPlate: { type: String },
  carKilometers: { type: Number },
  verified: { type: Boolean, default: true },
  avatarUrl: { type: String },
  licenciaTaxi: { type: String },
  vtvVencimiento: { type: String }
}, { timestamps: true });
var User = import_mongoose.default.model("User", userSchema);

// server/models/Viaje.ts
var import_mongoose2 = __toESM(require("mongoose"), 1);
var viajeSchema = new import_mongoose2.default.Schema({
  userId: { type: String, required: true, index: true },
  fecha: { type: String, required: true },
  // YYYY-MM-DD
  formaPago: { type: String, required: true },
  monto: { type: Number, required: true }
}, { timestamps: true });
var Viaje = import_mongoose2.default.model("Viaje", viajeSchema);

// server/models/GastoCombustible.ts
var import_mongoose3 = __toESM(require("mongoose"), 1);
var gastoCombustibleSchema = new import_mongoose3.default.Schema({
  userId: { type: String, required: true, index: true },
  fecha: { type: String, required: true },
  importe: { type: Number, required: true },
  nota: { type: String },
  tipo: { type: String, enum: ["GNC", "Nafta"], required: true }
}, { timestamps: true });
var GastoCombustible = import_mongoose3.default.model("GastoCombustible", gastoCombustibleSchema);

// server/models/Mantenimiento.ts
var import_mongoose4 = __toESM(require("mongoose"), 1);
var mantenimientoSchema = new import_mongoose4.default.Schema({
  userId: { type: String, required: true, index: true },
  fecha: { type: String, required: true },
  tipoMantenimiento: { type: String, required: true },
  descripcion: { type: String },
  importe: { type: Number, required: true },
  kilometrajeActual: { type: Number, required: true },
  proximoSugeridoKilometraje: { type: Number },
  proximoSugeridaFecha: { type: String },
  taller: { type: String },
  nroFactura: { type: String }
}, { timestamps: true });
var Mantenimiento = import_mongoose4.default.model("Mantenimiento", mantenimientoSchema);

// server/models/Alerta.ts
var import_mongoose5 = __toESM(require("mongoose"), 1);
var alertaSchema = new import_mongoose5.default.Schema({
  userId: { type: String, required: true, index: true },
  tipo: { type: String, required: true },
  mensaje: { type: String, required: true },
  fechaLimite: { type: String },
  kmLimite: { type: Number },
  resuelta: { type: Boolean, default: false }
}, { timestamps: true });
var Alerta = import_mongoose5.default.model("Alerta", alertaSchema);

// server/models/Monotributo.ts
var import_mongoose6 = __toESM(require("mongoose"), 1);
var monotributoSchema = new import_mongoose6.default.Schema({
  userId: { type: String, required: true, index: true },
  fechaPago: { type: String, required: true },
  importe: { type: Number, required: true },
  categoria: { type: String, required: true },
  fechaVencimiento: { type: String, required: true }
}, { timestamps: true });
var Monotributo = import_mongoose6.default.model("Monotributo", monotributoSchema);

// server/models/Seguro.ts
var import_mongoose7 = __toESM(require("mongoose"), 1);
var seguroSchema = new import_mongoose7.default.Schema({
  userId: { type: String, required: true, index: true },
  fechaPago: { type: String, required: true },
  importe: { type: Number, required: true },
  fechaVencimiento: { type: String, required: true },
  aseguradora: { type: String }
}, { timestamps: true });
var Seguro = import_mongoose7.default.model("Seguro", seguroSchema);

// server/controllers/authController.ts
var register = async (req, res) => {
  try {
    const { name, email, phone, username, passwordHash, carBrand, carModel, carYear, carPlate, carKilometers } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: "El usuario o correo electr\xF3nico ya se encuentra registrado." });
    }
    const newUser = await User.create({
      name,
      email,
      phone,
      username,
      passwordHash,
      carBrand,
      carModel,
      carYear,
      carPlate,
      carKilometers: carKilometers || 0,
      verified: true,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`
    });
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
var login = async (req, res) => {
  try {
    const { identifier, passwordHash } = req.body;
    const matchedUser = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${identifier}$`, "i") } },
        { email: { $regex: new RegExp(`^${identifier}$`, "i") } }
      ]
    });
    if (!matchedUser) {
      return res.status(404).json({ error: "Usuario o correo electr\xF3nico no registrado." });
    }
    if (matchedUser.passwordHash !== passwordHash) {
      return res.status(400).json({ error: "Contrase\xF1a incorrecta." });
    }
    res.json(matchedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
var getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
var updateProfile = async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.userId, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
var deleteProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    await User.findByIdAndDelete(userId);
    await Viaje.deleteMany({ userId });
    await GastoCombustible.deleteMany({ userId });
    await Mantenimiento.deleteMany({ userId });
    await Alerta.deleteMany({ userId });
    await Monotributo.deleteMany({ userId });
    await Seguro.deleteMany({ userId });
    res.json({ message: "Usuario y todos sus registros asociados eliminados con \xE9xito" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// server/routes/authRoutes.ts
var router = (0, import_express.Router)();
router.post("/register", register);
router.post("/login", login);
router.get("/:userId", getProfile);
router.put("/:userId", updateProfile);
router.delete("/:userId", deleteProfile);
var authRoutes_default = router;

// server/routes/viajesRoutes.ts
var import_express2 = require("express");

// server/controllers/viajesController.ts
var getViajes = async (req, res) => {
  try {
    const viajes = await Viaje.find({ userId: req.params.userId }).sort({ fecha: -1, createdAt: -1 });
    res.json(viajes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
var createViaje = async (req, res) => {
  try {
    const nuevoViaje = await Viaje.create(req.body);
    res.status(201).json(nuevoViaje);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
var updateViaje = async (req, res) => {
  try {
    const updated = await Viaje.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Viaje no encontrado" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
var deleteViaje = async (req, res) => {
  try {
    await Viaje.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// server/routes/viajesRoutes.ts
var router2 = (0, import_express2.Router)();
router2.get("/:userId", getViajes);
router2.post("/", createViaje);
router2.put("/:id", updateViaje);
router2.delete("/:id", deleteViaje);
var viajesRoutes_default = router2;

// server/routes/combustibleRoutes.ts
var import_express3 = require("express");

// server/controllers/combustibleController.ts
var getCombustibles = async (req, res) => {
  try {
    const cargas = await GastoCombustible.find({ userId: req.params.userId }).sort({ fecha: -1, createdAt: -1 });
    res.json(cargas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
var createCombustible = async (req, res) => {
  try {
    const carga = await GastoCombustible.create(req.body);
    res.status(201).json(carga);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
var updateCombustible = async (req, res) => {
  try {
    const updated = await GastoCombustible.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Gasto de combustible no encontrado" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
var deleteCombustible = async (req, res) => {
  try {
    await GastoCombustible.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// server/routes/combustibleRoutes.ts
var router3 = (0, import_express3.Router)();
router3.get("/:userId", getCombustibles);
router3.post("/", createCombustible);
router3.put("/:id", updateCombustible);
router3.delete("/:id", deleteCombustible);
var combustibleRoutes_default = router3;

// server/routes/mantenimientoRoutes.ts
var import_express4 = require("express");

// server/controllers/mantenimientoController.ts
var getMantenimientos = async (req, res) => {
  try {
    const logs = await Mantenimiento.find({ userId: req.params.userId }).sort({ fecha: -1, createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
var createMantenimiento = async (req, res) => {
  try {
    const log = await Mantenimiento.create(req.body);
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
var updateMantenimiento = async (req, res) => {
  try {
    const updated = await Mantenimiento.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Mantenimiento no encontrado" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
var deleteMantenimiento = async (req, res) => {
  try {
    await Mantenimiento.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// server/routes/mantenimientoRoutes.ts
var router4 = (0, import_express4.Router)();
router4.get("/:userId", getMantenimientos);
router4.post("/", createMantenimiento);
router4.put("/:id", updateMantenimiento);
router4.delete("/:id", deleteMantenimiento);
var mantenimientoRoutes_default = router4;

// server/routes/alertasRoutes.ts
var import_express5 = require("express");

// server/controllers/alertasController.ts
var getAlertas = async (req, res) => {
  try {
    const alertas = await Alerta.find({ userId: req.params.userId }).sort({ fechaLimite: 1 });
    res.json(alertas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
var createAlerta = async (req, res) => {
  try {
    const alerta = await Alerta.create(req.body);
    res.status(201).json(alerta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
var updateAlerta = async (req, res) => {
  try {
    const actualizada = await Alerta.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!actualizada) return res.status(404).json({ error: "Alerta no encontrada" });
    res.json(actualizada);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
var deleteAlerta = async (req, res) => {
  try {
    await Alerta.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// server/routes/alertasRoutes.ts
var router5 = (0, import_express5.Router)();
router5.get("/:userId", getAlertas);
router5.post("/", createAlerta);
router5.put("/:id", updateAlerta);
router5.delete("/:id", deleteAlerta);
var alertasRoutes_default = router5;

// server/routes/monotributoRoutes.ts
var import_express6 = require("express");

// server/controllers/monotributoController.ts
var getMonotributos = async (req, res) => {
  try {
    const records = await Monotributo.find({ userId: req.params.userId }).sort({ fechaPago: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
var createMonotributo = async (req, res) => {
  try {
    const record = await Monotributo.create(req.body);
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
var updateMonotributo = async (req, res) => {
  try {
    const actualizado = await Monotributo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!actualizado) return res.status(404).json({ error: "Registro no encontrado" });
    res.json(actualizado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
var deleteMonotributo = async (req, res) => {
  try {
    await Monotributo.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// server/routes/monotributoRoutes.ts
var router6 = (0, import_express6.Router)();
router6.get("/:userId", getMonotributos);
router6.post("/", createMonotributo);
router6.put("/:id", updateMonotributo);
router6.delete("/:id", deleteMonotributo);
var monotributoRoutes_default = router6;

// server/routes/seguroRoutes.ts
var import_express7 = require("express");

// server/controllers/seguroController.ts
var getSeguros = async (req, res) => {
  try {
    const records = await Seguro.find({ userId: req.params.userId }).sort({ fechaPago: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
var createSeguro = async (req, res) => {
  try {
    const record = await Seguro.create(req.body);
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
var updateSeguro = async (req, res) => {
  try {
    const actualizado = await Seguro.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!actualizado) return res.status(404).json({ error: "Registro no encontrado" });
    res.json(actualizado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
var deleteSeguro = async (req, res) => {
  try {
    await Seguro.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// server/routes/seguroRoutes.ts
var router7 = (0, import_express7.Router)();
router7.get("/:userId", getSeguros);
router7.post("/", createSeguro);
router7.put("/:id", updateSeguro);
router7.delete("/:id", deleteSeguro);
var seguroRoutes_default = router7;

// server/routes/index.ts
var router8 = (0, import_express8.Router)();
router8.use("/auth", authRoutes_default);
router8.use("/users", authRoutes_default);
router8.use("/viajes", viajesRoutes_default);
router8.use("/combustible", combustibleRoutes_default);
router8.use("/mantenimiento", mantenimientoRoutes_default);
router8.use("/alertas", alertasRoutes_default);
router8.use("/monotributo", monotributoRoutes_default);
router8.use("/seguro", seguroRoutes_default);
var routes_default = router8;

// server/config/database.ts
var import_mongoose8 = __toESM(require("mongoose"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var isConnecting = false;
var lastAttemptTime = 0;
var RETRY_COOLDOWN_MS = 3e4;
var connectDB = async () => {
  if (import_mongoose8.default.connection.readyState === 1 || import_mongoose8.default.connection.readyState === 2) {
    return;
  }
  const now = Date.now();
  if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
    if (now - lastAttemptTime < RETRY_COOLDOWN_MS) {
      return;
    }
  }
  if (isConnecting) return;
  isConnecting = true;
  lastAttemptTime = now;
  let mongodbUri = process.env.MONGODB_URI;
  if (mongodbUri) {
    mongodbUri = mongodbUri.trim();
  }
  const isValidUri = mongodbUri && (mongodbUri.startsWith("mongodb://") || mongodbUri.startsWith("mongodb+srv://"));
  if (!isValidUri) {
    isConnecting = false;
    if (process.env.VERCEL || process.env.NODE_ENV === "production") {
      throw new Error('La variable de entorno MONGODB_URI no est\xE1 configurada o tiene un formato incorrecto (debe comenzar con "mongodb://" o "mongodb+srv://"). Por favor conf\xEDgurala en Vercel o en tus variables de entorno.');
    }
    return;
  }
  try {
    await import_mongoose8.default.connect(mongodbUri, {
      serverSelectionTimeoutMS: 3e3
      // 3 seconds timeout
    });
    console.log("MongoDB conectado correctamente");
  } catch (error) {
    console.error("Error conectando a MongoDB:", error.message);
    if (process.env.VERCEL || process.env.NODE_ENV === "production") {
      isConnecting = false;
      throw error;
    }
  } finally {
    isConnecting = false;
  }
};
var database_default = connectDB;

// server/index.ts
import_dotenv2.default.config();
var app = (0, import_express9.default)();
var PORT = 3e3;
app.use((0, import_cors.default)());
app.use(import_express9.default.json());
app.use(async (req, res, next) => {
  const mongodbUri = process.env.MONGODB_URI;
  const hasUri = mongodbUri && (mongodbUri.trim().startsWith("mongodb://") || mongodbUri.trim().startsWith("mongodb+srv://"));
  try {
    await database_default();
    if (hasUri && import_mongoose9.default.connection.readyState !== 1) {
      throw new Error("La conexi\xF3n de Mongoose no est\xE1 activa (readyState: " + import_mongoose9.default.connection.readyState + ")");
    }
    next();
  } catch (err) {
    console.error("Database connection middleware error:", err.message);
    if (process.env.VERCEL || process.env.NODE_ENV === "production") {
      return res.status(500).json({
        error: `Error de conexi\xF3n con MongoDB: ${err.message}. Aseg\xFArate de haber configurado la variable de entorno MONGODB_URI en Vercel y de haber habilitado el acceso desde cualquier IP (0.0.0.0/0) en la secci\xF3n Network Access de MongoDB Atlas.`
      });
    }
    next();
  }
});
app.use("/api", routes_default);
app.get("/api/health", (req, res) => {
  const isConnected = import_mongoose9.default.connection.readyState === 1;
  res.json({
    status: "ok",
    mongodb: isConnected ? "connected" : "disconnected",
    database: (process.env.MONGODB_URI || "").includes("@") ? "Remote Atlas" : "Local/Fallback"
  });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express9.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F680} Express MVC server running on port ${PORT}`);
  });
}
if (!process.env.VERCEL) {
  startServer();
}
var index_default = app;
//# sourceMappingURL=server.cjs.map
