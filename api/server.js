const express = require("express");
const backend = require("../backend/server"); // Importa tu servidor

const app = express();

app.use(backend); // Usa el backend desde la carpeta /backend

module.exports = app;
