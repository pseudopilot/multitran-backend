const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const lookupRoute = require("./routes/lookup");
const searchRoute = require("./routes/search");

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.use(bodyParser.json({ extended: false }));

app.use("/lookup", lookupRoute);
app.use("/search", searchRoute);

app.listen(4000);
