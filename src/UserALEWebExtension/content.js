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
import { addCallbacks, options, packageCustomLog, packageLog, start } from '../main.js';

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
  addCallbacks({reroute (log) {
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

// https://stackoverflow.com/a/46781845/21168950
function getElementXPath (element) {
  if (!element) return null;

  if (element.tagName === 'HTML') {
    return '/html';
  } else {
    const sameTagSiblings = Array.from(element.parentNode.childNodes)
      .filter(e => e.nodeName === element.nodeName);
    const idx = sameTagSiblings.indexOf(element);

    return getElementXPath(element.parentNode) +
      '/' +
      element.tagName.toLowerCase() +
      (sameTagSiblings.length > 1 ? `[${idx + 1}]` : '');
  }
}

const observer = new MutationObserver( (mutationList, observer) => {
  packageCustomLog(
    {type: "mutation"},
    () => {
      return mutationList.map(mutation => {
        switch(mutation.type) {
          case "attributes":
            return {
              type: mutation.type,
              target: getElementXPath(mutation.target),
              attributeName: mutation.attributeName,
              attributeNamespace: mutation.attributeNamespace,
              newValue: mutation.target.getAttributeNS(mutation.attributeNamespace, mutation.attributeName)
            };
          case "characterData":
            // TODO
          case "childList":
            // TODO
            return {
              type: mutation.type,
              target: getElementXPath(mutation.target),
            }
        };
      });
    }, false);
});

observer.observe(document, {childList: true, subtree: true, attributes: true});

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