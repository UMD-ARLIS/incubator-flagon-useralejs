## Overview

This example shows how to autoinstrument a Node.js application with OpenTelemetry, as detailed in the following link:

https://opentelemetry.io/docs/js/getting-started/nodejs/#tracing  

First, the core dependencies to configure the tracing SDK and create spans must be installed:

```
npm install @opentelemetry/sdk-node @opentelemetry/api
```

Then, instrumentations maintained by OpenTelemetry authors can be installed:

```
npm install @opentelemetry/auto-instrumentations-node
```

Lastly, in the directory of the server.js file, a JS file named OTel_tracing.js can be created and populated with the following:

```
/* OTel_tracing.js */

// Require dependencies
const opentelemetry = require("@opentelemetry/sdk-node");
const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");

const sdk = new opentelemetry.NodeSDK({
  traceExporter: new opentelemetry.tracing.ConsoleSpanExporter(),
  instrumentations: [getNodeAutoInstrumentations()]
});

sdk.start()
```
To view OpenTelemetry tracing information in the console, navigate in the terminal to the directory of the server.js and OTel_tracing.js files, and run the following command:
```
node --require './OTel_tracing.js' server.js
```
After navigating to localhost:8000 in the browser, refreshing, and interacting with the index.html page, logs will appear in the console, and a logs folder in the directory will populate with the UserALE logs (to be updated to include OTel logs).