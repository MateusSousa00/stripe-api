import express from "express";
import cors from "cors";

const app = express();
require("dotenv").config();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send("Hello Word!");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port: ${port}...`);
});