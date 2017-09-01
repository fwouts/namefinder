import * as chalk from "chalk";
import * as dns from "dns";
import * as fs from "fs";
import * as randomWords from "random-words";

import { exec } from "child_process";
import fetch from "node-fetch";

const REQUEST_TIMEOUT_MILLIS = 2000;
const DEFAULT_ERROR_BACKOFF_SECONDS = 2;
let errorBackoffSeconds = DEFAULT_ERROR_BACKOFF_SECONDS;
checkInfinitely();

function checkInfinitely() {
  checkRandomName()
    .then(() => {
      errorBackoffSeconds = DEFAULT_ERROR_BACKOFF_SECONDS;
      checkInfinitely();
    })
    .catch(error => {
      console.error(error);
      console.log(`Retrying in ${errorBackoffSeconds} seconds...`);
      setTimeout(checkInfinitely, errorBackoffSeconds * 1000);
      errorBackoffSeconds *= 2;
    });
}

function checkRandomName(): Promise<any> {
  let name = randomWords({ min: 1, max: 2 }).join("");
  return Promise.all([
    isDomainAvailable(name, "io"),
    isFacebookPageAvailable(name),
    isTwitterPageAvailable(name)
  ]).then(availabilityList => {
    let available = availabilityList.reduce(
      (accumulator, currentValue) => accumulator && currentValue,
      true
    );
    if (available) {
      let domainName = name + ".io";
      console.log(chalk.green(domainName));
      fs.appendFileSync("domains.txt", domainName + "\n");
    }
  });
}

function isDomainAvailable(name: string, extension: string): Promise<boolean> {
  let domain = name + "." + extension;
  return new Promise<boolean>((resolve, reject) => {
    dns.lookup(domain, (err, address, family) => {
      if (!err) {
        // DNS lookup successful, so the domain is definitely not available.
        resolve(false);
      } else {
        // DNS lookup failed, so the domain could be available. Check whois.
        exec(
          `whois ${domain}`,
          { timeout: REQUEST_TIMEOUT_MILLIS },
          (error, stdout, stderr) => {
            if (error) {
              reject(error);
            } else {
              resolve(stdout.startsWith("NOT FOUND\n"));
            }
          }
        );
      }
    });
  });
}

function isFacebookPageAvailable(name: string): Promise<boolean> {
  return fetch(`https://www.facebook.com/${name}`, {
    timeout: REQUEST_TIMEOUT_MILLIS
  }).then(response => {
    return response.status == 404;
  });
}

function isTwitterPageAvailable(name: string): Promise<boolean> {
  return fetch(`https://www.twitter.com/${name}`, {
    timeout: REQUEST_TIMEOUT_MILLIS
  }).then(response => {
    return response.status == 404;
  });
}
