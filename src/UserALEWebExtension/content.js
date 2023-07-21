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
import { selectorizePath } from '../packageLogs.js';

let popup = ""
var userlabel = ""
var userFunction = ""
var isShiftPressed = false
var label;

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

function getFriendlyPath(path) {
  let rawPath = path.slice(); // Copy the array to avoid mutating the original
  let stored = sessionStorage.getItem('userFriendlyArray');

  if (stored !== null) {
    let storedArray = JSON.parse(stored);

    storedArray.forEach(item => {
      let curPath = JSON.parse(item.targetPath);

      // Find the start index of curPath in rawPath
      let startIndex = rawPath.findIndex((element, index) => 
        rawPath.slice(index, index + curPath.length).every((val, subIndex) => val === curPath[subIndex])
      );

      // If curPath is found in rawPath, replace the starting element with the label
      if (startIndex !== -1) {
        rawPath[startIndex] = item.label;
      }
    });
  }

  return rawPath;
}

function getFriendlyTarget(targetPath){
  //checking if the target value is also a key in an object in the clickedElements array
  //if it is, append the label of the matched target

  var path = JSON.stringify(targetPath)

  const value = sessionStorage.getItem('userFriendlyArray');


  if (value !== null) {
    //looks in session storage for label array and stores it locally
    const storedArray = JSON.parse(value);

    //finds the target value for each labeled element and tries to find a match
    const foundElement = storedArray.filter(obj => obj.targetPath === path);

    //if it has been labeled, search for the label value in the object and re-log it
    if (foundElement.length > 0){
      const firstElement = foundElement[0]
      const matchedLabel = firstElement['label'];
      const labelFunc = firstElement['functionality'];
      const returnArray = [matchedLabel, labelFunc]
      if (matchedLabel) {
        return (returnArray)
        }
      else{
        return(null)
      };
    };
  };
};

function injectScript(config) {
  options(config);
  //  start();  not necessary given that autostart in place, and option is masked from WebExt users
  addCallbacks({
    function(log) {

      const friendlyTarget = getFriendlyTarget(log['path'])
      if (friendlyTarget != null){
        log['friendlyTarget'] = friendlyTarget[0]
        log['functionality'] = friendlyTarget[1]
      }

      const friendlyPath = getFriendlyPath(log['path'])
      log['friendlyPath'] = friendlyPath


      queueLog(Object.assign({}, log, {
        pageUrl: document.location.href,
      }));

      console.log(log)
      return false;
    }
  });
};


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

var clickedElements = [];
var batchElements = [];

document.addEventListener("keydown", function (event) {
  if (event.key == "Shift") {
    isShiftPressed = true;
  }
});

document.addEventListener("keydown", function (event) {
  if (event.key == "Shift") {
    //&& batchEditingMode == true
    isShiftPressed = true;
  }
});
var batchEditingMode = false;
var editingMode = false;
var batchState = "default";
var conditional = 0;
//var tempBatchElements = [];
var count = 0;

function setBatchState(mode) {
  batchState = mode;
}
function getBatchState() {
  return batchState;
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "updateEditingMode") {
    editingMode = request.value;
    setBatchState("default");

    if (conditional == 0) {
      conditional = 1;
    } else {
      conditional = 0;
    }
  }
});


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "updateBatchEditingMode") {
    batchEditingMode = request.value;
    setBatchState("batch");
    count++;

    // when the user clicks the context menu again, we want the popup to then assign all of the elements their labels
    if (count % 2 == 0 && clickedElements.length > 0) {
      openPopup();
    }
  }
});


//handles user label clicks
function handleClick(event) {

  //sets the target variable and eventPath variable
  var target = event.target;
  var eventPath = event.composedPath();



  // begin clicking batch elements
  if (batchState == "batch" && count % 2 == 1) {
    console.log("clicking elements");
    
    target.style.border = "thick dashed #FFA500";

    // Create an object to store the element and its label
    var batchElementWithLabel = {
      targetPath: JSON.stringify(selectorizePath(eventPath)),
      label: userlabel,
      functionality: userFunction,
    };

    // add to clicked array
    clickedElements.push(batchElementWithLabel);
    batchElements.push(batchElementWithLabel);

    sessionStorage.setItem(
      "userFriendlyArray",
      JSON.stringify(clickedElements)
    );

    console.log(clickedElements);


    // single editing
  } else if (
    batchState === "default" &&
    editingMode === true &&
    conditional == 1
  ) {
    target.style.border = "thick dashed #FFA500";
    popup = window.open("", "name", "width=200, height=200");
    popup.document.write(
      "<form><label>Input your relabel here</label><input id = 'input1'><br/><label>Input your functionality here (optional)</label><input id = 'input2'><br/></form><button id = 'button' type = 'submit' onClick=\"javascript:window.close('','_parent','')\">Save</button><button onClick=\"javascript:window.close('','_parent','')\" id = 'cancel' style=\"float: right;\">Cancel</button>"
    );
    popup.document
      .getElementById("button")
      .addEventListener("click", function () {
        //creates the two input fields
        userlabel = popup.document.querySelector("#input1").value;
        userFunction = popup.document.querySelector("#input2").value;

        // Create an object to store the element and its label
        var elementWithLabel = {
          targetPath: JSON.stringify(selectorizePath(eventPath)),
          label: userlabel,
          functionality: userFunction,
        };

        // add to clicked array
        clickedElements.push(elementWithLabel);
        sessionStorage.setItem(
          "userFriendlyArray",
          JSON.stringify(clickedElements)
        );

        //highlight the clicked element
        //target.style.border = "thick dashed #FFA500";

        // Log the clicked elements and closes the tab
        // console.log(clickedElements);
        popup.close();
      });

    //closes the tab if cancel is clicked
    popup.document
      .getElementById("cancel")
      .addEventListener("click", function () {
        popup.close();
      });
  }

  // when to actually assign all elements the same label
  //if (lastBatchState == 'batch' && batchState == 'default') {
  if (count > 0 && count % 2 == 0) {

    //  build popup window
    popup = window.open("", "name", "width=200, height=200");
    if (
      popup.document.contains(popup.document.getElementById("button")) == false
    ) {
      popup.document.write(
        "<form><label>Input your relabel here</label><input id = 'input1'><br/><label>Input your functionality here (optional)</label><input id = 'input2'><br/></form><button id = 'button' type = 'submit' onClick=\"javascript:window.close('','_parent','')\">Save</button><button onClick=\"javascript:window.close('','_parent','')\" id = 'cancel' style=\"float: right;\">Cancel</button>"
      );
    }
    popup.document
      .getElementById("button")
      .addEventListener("click", function () {
        //creates the two input fields
        userlabel = popup.document.querySelector("#input1").value;
        userFunction = popup.document.querySelector("#input2").value;

        popup.close();
      });

    //closes the tab if cancel is clicked
    popup.document
      .getElementById("cancel")
      .addEventListener("click", function () {
        popup.close();
      });

 
  }
};

// Add the click event listener to the document
document.addEventListener('click', handleClick);

function openPopup() {
  //  // build popup window
  popup = window.open("", "name", "width=200, height=200");
  if (
    popup.document.contains(popup.document.getElementById("button")) == false
  ) {
    popup.document.write(
      "<form><label>Input your relabel here</label><input id = 'input1'><br/><label>Input your functionality here (optional)</label><input id = 'input2'><br/></form><button id = 'button' type = 'submit' onClick=\"javascript:window.close('','_parent','')\">Save</button><button onClick=\"javascript:window.close('','_parent','')\" id = 'cancel' style=\"float: right;\">Cancel</button>"
    );
  }
  popup.document
    .getElementById("button")
    .addEventListener("click", function () {
      //creates the two input fields
      userlabel = popup.document.querySelector("#input1").value;
      userFunction = popup.document.querySelector("#input2").value;

     
      //assign labels for the clicked elements
      for (var i = 0; i < batchElements.length; i++) {
        batchElements[i].label = userlabel;
      }
      // target.style.border = "thick dashed #FFA500";
      clickedElements.push(batchElements);
      console.log(clickedElements);

      // Log the clicked elements and closes the tab
      // console.log(clickedElements);
      popup.close();
    });

  //closes the tab if cancel is clicked
  popup.document
    .getElementById("cancel")
    .addEventListener("click", function () {
      popup.close();
    });
}

/*
 eslint-enable
 */