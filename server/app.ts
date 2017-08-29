import * as bodyParser from "body-parser";
import * as express from "express";

const app = express();
app.use(bodyParser.json());

app.get("/", (req, res) => {
  respondJson<string>(res, "Hello, World!");
});

app.listen(3002, () => {
  console.log("Ready to serve.");
});

function respondJson<T>(res: express.Response, data: T) {
  // Note: we could use res.json(store) if we didn't want it formatted nicely.
  res.header("Content-Type", "application/json");
  res.send(JSON.stringify(data, null, 2));
}
