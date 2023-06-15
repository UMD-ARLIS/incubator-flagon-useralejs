/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint-disable */

import * as globals from './globals';
import * as MessageTypes from './messageTypes.js';
import { addCallbacks, options, start } from '../main.js';

// browser is defined in firefox, but not in chrome. In chrome, they use
// the 'chrome' global instead. Let's map it to browser so we don't have
// to have if-conditions all over the place.

var browser = browser || chrome;

// creates a Future for retrieval of the named keys
// the value specified is the default value if one doesn't exist in the storage
let store = browser.storage.local.get({
  sessionId: null,
  userAleHost: globals.userAleHost,
  userAleScript: globals.userAleScript,
  toolUser: globals.toolUser,
  toolName: globals.toolName,
  toolVersion: globals.toolVersion,
}, storeCallback);

function storeCallback(item) {
  injectScript({
    url: item.userAleHost,
    userId: item.toolUser,
    sessionID: item.sessionId,
    toolName: item.toolName,
    toolVersion: item.toolVersion
  });
}

function queueLog(log) {
  browser.runtime.sendMessage({ type: MessageTypes.ADD_LOG, payload: log });
}

function injectScript(config) {
  options(config);
  //  start();  not necessary given that autostart in place, and option is masked from WebExt users
  addCallbacks({
    function(log) {
      queueLog(Object.assign({}, log, {
        pageUrl: document.location.href,
      }));
      console.log(log);
      return false;
    }
  });
}

browser.runtime.onMessage.addListener(function (message) {
  if (message.type === MessageTypes.CONFIG_CHANGE) {
    options({
      url: message.payload.userAleHost,
      userId: message.payload.toolUser,
      toolName: message.payload.toolName,
      toolVersion: message.payload.toolVersion
    });
  }
});

//   document.addEventListener('click', (event) => {
//     var target = event.target;

//     var labelName = window.prompt("Add label", "label name");
//     console.log(labelName);

// });

// initialize empty array
var clickedElements = [];

function handleClick(event) {
  var target = event.target;

  var label = window.prompt("Add a label for the element", "Label name");

  // Create an object to store the element and its label
  var elementWithLabel = {
    element: target,
    label: label
  };

  // add to clicked array
  clickedElements.push(elementWithLabel);

  //highlight the clicked element
  target.style.backgroundColor = 'yellow';

  // Log the clicked elements
  console.log(clickedElements);
}
// // Add the click event listener to the document
document.addEventListener('click', handleClick);

// work with different toggle mode for labeling

// chrome.devtools.inspectedWindow.eval(
//   "inspect($$('head script[data-soak=main]')[0])",
//   function(result, isException) { 

//   }
// );

console.log("musa did this push work?")
/*
 eslint-enable
 */