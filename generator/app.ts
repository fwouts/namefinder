import * as chalk from "chalk";
import * as randomWords from "random-words";

import { exec } from "child_process";

checkInfinitely();

function checkInfinitely() {
  checkRandomDomain().then(checkInfinitely);
}

function checkRandomDomain(): Promise<any> {
  let domainName =
    randomWords({
      exactly: 2
    }).join("") + ".io";
  return isDomainAvailable(domainName)
    .then(available => {
      if (available) {
        console.log(chalk.green(domainName));
      }
    })
    .catch(e => {
      console.error(e);
    });
}

function isDomainAvailable(domainName: string): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    exec(`whois ${domainName}`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      resolve(stdout.startsWith("NOT FOUND\n"));
    });
  });
}
