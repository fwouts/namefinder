import * as chalk from "chalk";
import * as dns from "dns";
import * as fs from "fs";

import { exec } from "child_process";
import fetch from "node-fetch";

const REQUEST_TIMEOUT_MILLIS = 2000;
const DEFAULT_ERROR_BACKOFF_SECONDS = 2;
const MIN_WORD_COUNT = 1;
const MAX_WORD_COUNT = 2;
const MAX_LENGTH = 10;
const WORDS = fs.readFileSync("words.txt", "utf8").split("\n");

let errorBackoffSeconds = DEFAULT_ERROR_BACKOFF_SECONDS;
checkInfinitely();

async function checkInfinitely() {
  try {
    await checkRandomName();
    checkInfinitely();
  } catch (error) {
    console.error(error);
    console.log(`Retrying in ${errorBackoffSeconds} seconds...`);
    setTimeout(checkInfinitely, errorBackoffSeconds * 1000);
    errorBackoffSeconds *= 2;
  }
}

async function checkRandomName(): Promise<void> {
  let name = inventName();
  let availabilityList = await Promise.all([
    isDomainAvailable(name, "io"),
    isFacebookPageAvailable(name),
    isTwitterPageAvailable(name)
  ]);
  let available = availabilityList.reduce(
    (accumulator, currentValue) => accumulator && currentValue,
    true
  );
  if (available) {
    let dotComAvailableToo = await isDomainAvailable(name, "com");
    let domainName = name + ".io";
    if (dotComAvailableToo) {
      domainName += " + .com";
    }
    console.log(chalk.green(domainName));
    fs.appendFileSync("domains.txt", domainName + "\n");
  }
}

function inventName(): string {
  let name: string;
  do {
    name = pickWords(MIN_WORD_COUNT, MAX_WORD_COUNT).join("");
  } while (name.length > MAX_LENGTH);
  return name;
}

function pickWords(minCount: number, maxCount: number): string[] {
  // Pick a number between minCount and maxCount.
  let count = minCount + Math.round(Math.random() * (maxCount - minCount));
  let pickedWords = [];
  for (let i = 0; i < count; i++) {
    // Pick a random word from the list (we don't mind picking it twice).
    let picked: string;
    do {
      picked = WORDS[Math.floor(Math.random() * WORDS.length)];
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

async function isFacebookPageAvailable(name: string): Promise<boolean> {
  let response = await fetch(`https://www.facebook.com/${name}`, {
    timeout: REQUEST_TIMEOUT_MILLIS
  });
  return response.status == 404;
}

async function isTwitterPageAvailable(name: string): Promise<boolean> {
  let response = await fetch(`https://www.twitter.com/${name}`, {
    timeout: REQUEST_TIMEOUT_MILLIS
  });
  return response.status == 404;
}
