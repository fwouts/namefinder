import * as chalk from "chalk";
import * as randomWords from "random-words";

import { exec } from "child_process";
import fetch from "node-fetch";

checkInfinitely();

function checkInfinitely() {
  checkRandomName().then(checkInfinitely);
}

function checkRandomName(): Promise<any> {
  let name = randomWords(2).join("");
  return Promise.all([
    isDomainAvailable(name, "io"),
    isFacebookPageAvailable(name),
    isTwitterPageAvailable(name)
  ])
    .then(availabilityList => {
      if (availabilityList[0] && availabilityList[1] && availabilityList[2]) {
        console.log(chalk.green(name + ".io"));
      }
    })
    .catch(e => {
      console.error(e);
    });
}

function isDomainAvailable(name: string, extension: string): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    exec(`whois ${name}.${extension}`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      resolve(stdout.startsWith("NOT FOUND\n"));
    });
  });
}

function isFacebookPageAvailable(name: string): Promise<boolean> {
  return fetch(`https://www.facebook.com/${name}`).then(response => {
    return response.status == 404;
  });
}

function isTwitterPageAvailable(name: string): Promise<boolean> {
  return fetch(`https://www.twitter.com/${name}`).then(response => {
    return response.status == 404;
  });
}
