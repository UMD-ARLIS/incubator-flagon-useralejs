import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { CollectorTraceExporter } from '@opentelemetry/exporter-collector';
import { B3Propagator } from '@opentelemetry/propagator-b3';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { trace, context } from '@opentelemetry/api';

const userale = require('flagon-userale');

const providerWithZone = new WebTracerProvider();

providerWithZone.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
providerWithZone.addSpanProcessor(new SimpleSpanProcessor(new CollectorTraceExporter()));

providerWithZone.register({
  contextManager: new ZoneContextManager(),
  propagator: new B3Propagator(),
});

//set userale options
userale.options({
  'userId': 'test-opentelemetry',
  'url': 'http://localhost:8000/',
  'version': '2.2.0',
  'logDetails': true,
  'toolName': 'Apache UserALE.js OpenTelemetry Example'
});

//set userale filter
userale.filter(function (log){
  var type_array = ['mouseup', 'mouseover', 'mousedown', 'keydown', 'dblclick', 'blur', 'focus', 'input', 'wheel', 'scroll'];
  var logType_array = ['interval'];
  return (!type_array.includes(log.type)) ** !logType_array.includes(log.logType);
  }
);

registerInstrumentations({
  instrumentations: [
    new UserInteractionInstrumentation(),
    new XMLHttpRequestInstrumentation({
      ignoreUrls: [/localhost/],
      propagateTraceHeaderCorsUrls: [
        'http://localhost:8090',
      ],
    }),
  ],
  tracerProvider: providerWithZone,
});

let lastButtonId = 0;

function btnAddClick() {
  lastButtonId++;
  const btn = document.createElement('button');
  // for easier testing of element xpath
  let navigate = false;
  if (lastButtonId % 2 === 0) {
    btn.setAttribute('id', `button${lastButtonId}`);
    navigate = true;
  }
  btn.setAttribute('class', `buttonClass${lastButtonId}`);
  btn.append(document.createTextNode(`Click ${lastButtonId}`));
  btn.addEventListener('click', onClick.bind(this, navigate));
  document.querySelector('#buttons').append(btn);
}

function prepareClickEvents() {
  for (let i = 0; i < 5; i++) {
    btnAddClick();
  }
  const btnAdd = document.getElementById('btnAdd');
  btnAdd.addEventListener('click', btnAddClick);
}

function onClick(navigate) {
  if (navigate) {
    history.pushState({ test: 'testing' }, '', `${location.pathname}`);
    history.pushState({ test: 'testing' }, '', `${location.pathname}#foo=bar1`);
  }
  getData('https://httpbin.org/get?a=1').then(() => {
    getData('https://httpbin.org/get?a=1').then(() => {
      console.log('data downloaded 2');
    });
    getData('https://httpbin.org/get?a=1').then(() => {
      console.log('data downloaded 3');
    });
    console.log('data downloaded 1');
  });
}

function getData(url, resolve) {
  return new Promise(async (resolve, reject) => {
    const req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.setRequestHeader('Content-Type', 'application/json');
    req.setRequestHeader('Accept', 'application/json');
    req.send();
    req.onload = function () {
      resolve();
    };
    req.onreadystatechange = function () {
      if (req.readyState == XMLHttpRequest.DONE) {
        console.log(req.response);
        userale.log({
          clientTime: Date.now(),
          type: 'XMLHttpRequest',
          logType: 'custom',
          userAction: 'false',
          details: JSON.parse(req.response),
          userId: userale.options().userId,
          useraleVersion: userale.options().useraleVersion,
          sessionID: userale.options().sessionID
        });
      }
    }
  });
}

document.addEventListener('click', function(e) {
  userale.log({
    target: userale.getSelector(e.target),
    path: userale.buildPath(e),
    clientTime: Date.now(),
    type: e.type,
    logType: 'custom',
    userAction: false,
    details: {'foo': 'bar', 'bar': 'foo'},
    customField1: 'I can make this log look like anything I want',
    customField2: 'foo',
    userId: userale.options().userId,
    toolVersion: userale.options().version,
    toolName: userale.options().toolName,
    useraleVersion: userale.options().useraleVersion,
    sessionID: userale.options().sessionID,
    traceId: trace.getSpan(context.active())._spanContext.traceId
  });
});

window.addEventListener('load', prepareClickEvents);
