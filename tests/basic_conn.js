import { Comet } from "@botcomet/comet";
import { Station } from "@botcomet/station";
import { Plugin } from "@botcomet/plugin";
import { readFileSync } from "fs";


const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


let comet, plugin;

console.info("Starting station...");

new Station();

console.info("Starting comet...");

comet = new Comet();
comet.start();

// TODO: Get event from comet/station instead of sleep
await sleep(3000);
if (!comet.has_station_connection) {
  console.error("Failed to connect to station.");
  process.exit(1);
}

console.info("Starting plugin...");

const publicKey = readFileSync("example_plugin.pub", "utf8");
const privateKey = readFileSync("example_plugin.pem", "utf8");

plugin = new Plugin(publicKey, privateKey);
plugin.start();

await sleep(3000);
if (!plugin.has_station_connection) {
  console.error("Failed to connect to station.");
  process.exit(1);
}

console.info("Verifying plugin connection...");

const added = await comet.addPlugin(publicKey);
if (!added) {
  console.error("Failed to add plugin.");
  process.exit(1);
}

console.info("Passed all tests.");

process.exit(0);