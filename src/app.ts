import * as chalk from "chalk";
import * as commonWords from "common-english-words";
import * as dns from "dns";
import * as fs from "fs";

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

function checkRandomName(): Promise<void> {
  return getWords().then(words => {
    let name = pickWords(words, 1, 2).join("");
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
        return isDomainAvailable(name, "com").then(dotComAvailableToo => {
          let domainName = name + ".io";
          if (dotComAvailableToo) {
            domainName += " + .com";
          }
          console.log(chalk.green(domainName));
          fs.appendFileSync("domains.txt", domainName + "\n");
        });
      } else {
        return;
      }
    });
  });
}

function getWords(): Promise<string[]> {
  return new Promise<string[]>((resolve, reject) => {
    commonWords.getWords((err, words) => {
      if (err) {
        reject(err);
      } else {
        resolve(words);
      }
    });
  });
}

function pickWords(
  words: string[],
  minCount: number,
  maxCount: number
): string[] {
  // Pick a number between minCount and maxCount.
  let count = minCount + Math.round(Math.random() * (maxCount - minCount));
  let pickedWords = [];
  for (let i = 0; i < count; i++) {
    // Pick a random word from the list (we don't mind picking it twice).
    let picked: string;
    do {
      picked = words[Math.floor(Math.random() * words.length)];
    } while (!picked.match(/^[a-zA-Z]+$/)); // Don't allow words like "I'm" or "ma'am"
    pickedWords.push(picked);
  }
  return pickedWords;
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
              resolve(
                stdout.startsWith("NOT FOUND\n") ||
                  stdout.startsWith("No match for ")
              );
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
