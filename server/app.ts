import * as bodyParser from "body-parser";
import * as express from "express";

import { exec } from "child_process";

const app = express();
app.use(bodyParser.json());

app.get("/", (req, res) => {
  respondJson<string>(res, "Hello, World!");
});

app.get("/domain/whois/:domainName", (req, res) => {
  let domainName = req.params["domainName"];
  if (!/^[a-z0-9]+\.[a-z]+$/.exec(domainName)) {
    respondJson<string>(res, "Invalid domain name: " + domainName);
    return;
  }
  exec(`whois ${domainName}`, (error, stdout, stderr) => {
    respondJson<string>(res, stdout);
  });
});

app.listen(3002, () => {
  console.log("Ready to serve.");
});

function respondJson<T>(res: express.Response, data: T) {
  // Note: we could use res.json(store) if we didn't want it formatted nicely.
  res.header("Content-Type", "application/json");
  res.send(JSON.stringify(data, null, 2));
}
