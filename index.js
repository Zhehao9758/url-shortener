import express from "express";
import apiRouter from "./routes/api.js";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(apiRouter);

app.listen(PORT, () => {
    console.log("server started");
    console.log("here!", PORT);
});
