const fs = require("fs");
const util = require("util");
const path = require("path");
const { cleanEnv, str, host } = require("envalid");
const cupi = require("./lib/cupiRest.js");
const csv = require("csvtojson");
const winston = require("winston");
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  defaultMeta: { service: "unity-audio-importer" },
  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    new winston.transports.File({ filename: "./files/error.log", level: "error" }),
    new winston.transports.File({ filename: "./files/combined.log" }),
  ],
});

// Use dotenv for enviromental variables if development
if (process.env.NODE_ENV === "development") {
  require("dotenv").config({ path: path.join(__dirname, ".", "env", "development.env") });
} else if (process.env.NODE_ENV === "test") {
  require("dotenv").config({ path: path.join(__dirname, ".", "env", "test.env") });
} else if (process.env.NODE_ENV === "staging") {
  require("dotenv").config({ path: path.join(__dirname, ".", "env", "staging.env") });
}

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

var env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ["development", "test", "production", "staging"],
    desc: "Node environment",
  }),
  CUC_HOSTNAME: host({ desc: "Cisco Unity Connections Hostname or IP Address." }),
  CUC_USERNAME: str({ desc: "Cisco Unity Connections REST Username." }),
  CUC_PASSWORD: str({ desc: "Cisco Unity Connections REST Password." }),
});

// Let's get the Unity Connection variables from the environment
let server = env.CUC_HOSTNAME;
let username = env.CUC_USERNAME;
let password = env.CUC_PASSWORD;

const greetingTypes = ["Alternate", "Busy", "Error", "Internal", "Closed", "Standard", "Holiday", "Voice"];

(async () => {
  const jsonArray = await csv().fromFile("./files/input.csv");
  for (rows in jsonArray) {
    // Let's get the Call Handlers info from the CSV file
    var rowName = jsonArray[rows].name;
    var rowExtension = jsonArray[rows].extension;
    var rowFile = jsonArray[rows].file;
    var rowGreeting = jsonArray[rows].greeting;

    let queryUri = `vmrest/handlers/callhandlers/?query=(DisplayName is ${rowName})`;
    const getCallHandlers = await cupi.getRequest(server, username, password, queryUri);
    if (getCallHandlers && getCallHandlers.Callhandlers._attributes.total > 0) {
      let output = {
        id: getCallHandlers.Callhandlers.Callhandler.ObjectId._text, // Call Handler ID
        name: getCallHandlers.Callhandlers.Callhandler.DisplayName._text, // Call Handler Name
        greetingsURI: getCallHandlers.Callhandlers.Callhandler.GreetingsURI._text, // URI to get greetings
        dtmfAccessId: getCallHandlers.Callhandlers.Callhandler.DtmfAccessId ? getCallHandlers.Callhandlers.Callhandler.DtmfAccessId._text : "", // DTMF Access ID
      };

      if (rowExtension !== output.dtmfAccessId) {
        logger.error({
          message: `Extension ${rowExtension} does not match the DTMF Access ID ${output.dtmfAccessId} for ${output.name}. Exiting...`,
          time: new Date()
        });
        return;
      }

      let contentType = "audio/wav";
      // Convert fs.readFile into Promise version of same
      const readFile = util.promisify(fs.readFile);
      let data = await readFile(`./files/${rowFile}`);
      let findGreeting = greetingTypes.findIndex((item) => item.toLowerCase() === rowGreeting.toLowerCase());
      let uri = "";
      if (greetingTypes[findGreeting] === "Voice") {
        uri = `vmrest/handlers/callhandlers/${output.id}/voicename`;
      } else {
        uri = `vmrest/handlers/callhandlers/${output.id}/greetings/${greetingTypes[findGreeting]}/greetingstreamfiles/1033/audio`;
      }
      let updateCallHandler = await cupi.putRequest(server, username, password, uri, contentType, data);
      logger.info({
        message: `${updateCallHandler.message} ${output.name} with dtmfAccessId, ${output.dtmfAccessId} updated ${greetingTypes[findGreeting]} greeting.`,
        time: new Date()
      });
    } else {
      logger.error({
          message: `No Call Handler found for ${rowName}`,
          time: new Date()
      });
      return;
    }
  }
})();
