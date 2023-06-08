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
import { addCallbacks, options, packageCustomLog, start } from '../main.js';

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
  addCallbacks({function (log) {
    queueLog(Object.assign({}, log, {
      pageUrl: document.location.href,
    }));
    console.log(log);
    return false;
  }});
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

/*
 eslint-enable
 */

// Filter out unimportant logs
addCallbacks({
  filter(log) {
      var type_array = ['mouseup', 'mouseover', 'mousedown', 'keydown', 'dblclick', 'blur', 'focus', 'input', 'wheel'];
      var logType_array = ['interval'];
      if(type_array.includes(log.type) || logType_array.includes(log.logType)) {
          return false;
      }
      return log;
  }
});

const nameRegex = /(Node|Way): ((.*) \((\d{9,10})\)|(\d{9,10}))/g;
const hashRegex = /#map=(\d+)\/(-?\d+.\d+)\/(-?\d+.\d+)/g;

// Scrape changing sidebar content for visit events
const visitObserver = new MutationObserver( (mutationList, observer) => {
  for (const mutation of mutationList) {
    if (mutation.addedNodes.length == 0) {
      continue;
    }

    const name = mutation.addedNodes[0].innerText;
    const parsedName = Array.from(name.matchAll(nameRegex));

    if (parsedName.length == 0) {
      continue;
    }

    const tagKeys = Array.from(
      document.querySelectorAll("th.browse-tag-k"),
      (node, i) => node.innerText,
    );

    const tagValues = Array.from(
      document.querySelectorAll("td.browse-tag-v"),
      (node, i) => node.innerText,
    );

    var tags = {};
    tagKeys.forEach((key, i) => tags[key] = tagValues[i]);

    packageCustomLog({
      details: {
        class: parsedName[0][1],
        id: parsedName[0][4] ? parsedName[0][4] : parsedName[0][5],
        name: parsedName[0][3],
        tags: tags,
      },
      type: "visit",
    }, null, true);

  }
});

var visitTarget = document.getElementById("sidebar_content");
visitObserver.observe(visitTarget, {childList: true, subtree: true});


// Watch for changes in the url for viewChange events
var urlHash = window.location.hash;
document.addEventListener('click', function(e){
  if (window.location.hash !== urlHash) {
    urlHash = window.location.hash;
    const parsedHash = Array.from(urlHash.matchAll(hashRegex));

    if (parsedHash.length == 0) {
      return;
    }

    packageCustomLog({
      details: {
        zoom: parsedHash[0][1],
        latitude: parsedHash[0][2],
        longitude: parsedHash[0][3],
      },
      type: "viewChange",
    }, null, true);

  }
});
