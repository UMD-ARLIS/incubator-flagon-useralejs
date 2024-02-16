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

import * as MessageTypes from './messageTypes.js';
import * as userale from '../main.js';
import { rerouteLog, browser } from './globals.js';

browser.storage.local.get("useraleConfig", (res) => {
  userale.options(res.useraleConfig);
  userale.addCallbacks({rerouteLog});
  
  // Send httpSession to background scirpt to inject into tab events.
  let payload = JSON.parse(window.sessionStorage.getItem('userAleHttpSessionId'));
  browser.runtime.sendMessage({type: MessageTypes.HTTP_SESSION, payload});
});

browser.runtime.onMessage.addListener(function (message) {
  if (message.type === MessageTypes.CONFIG_CHANGE) {
    userale.options(message.payload);
  }
});

/*
 eslint-enable
 */

async function getTargetStr(event) {
  let el = event.target;

  if(el instanceof Element && el.classList.contains("leaflet-interactive")) {
    await new Promise(r => setTimeout(r, 1));
    return document.location.pathname;
  }

  // https://stackoverflow.com/questions/8588301/how-to-generate-unique-css-selector-for-dom-element
  let path = [], parent;
  while(parent = el.parentNode) {
    path.unshift(`${el.tagName}:nth-child(${[].indexOf.call(parent.children, el)+1})`);
    el = parent;
  }
  return `${path.join(' > ')}`.toLowerCase();
}

// https://stackoverflow.com/questions/40031688/javascript-arraybuffer-to-hex
function buf2hex(buffer) {
  return [...new Uint8Array(buffer)]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

async function getTargetHash(event) {
  if(!(event instanceof window.Event)) {
    return null
  }

  const encoder = new TextEncoder();
  const data = await getTargetStr(event);
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return buf2hex(hash);
}

addCallbacks({
  filter(log) {
    var type_array = ['mouseup', 'mouseover', 'mousedown', 'keydown', 'dblclick', 'blur', 'focus', 'input', 'wheel'];
    var logType_array = ['interval'];
    if(type_array.includes(log.type) || logType_array.includes(log.logType)) {
      return false;
    }
    return log;
  },

  addTargetHash(log, e) {
    getTargetHash(e).then((hash) => log["targetHash"] = hash)
    return log;
  }
});

const nameRegex = /(Node|Way): ((.*) \((\d+)\)|(\d+))/g;
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

    userale.packageCustomLog({
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

    userale.packageCustomLog({
      details: {
        zoom: parsedHash[0][1],
        latitude: parsedHash[0][2],
        longitude: parsedHash[0][3],
      },
      type: "viewChange",
    }, null, true);

  }
});
