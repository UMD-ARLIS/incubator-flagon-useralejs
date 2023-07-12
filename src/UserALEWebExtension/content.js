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
import { getSelector } from '../packageLogs.js';

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

function getFriendly(target){
  //checking if the target value is also a key in an object in the clickedElements array
  //if it is, append the label of the matched target

  const value = sessionStorage.getItem('userFriendlyArray');


  if (value !== null) {
    //looks in session storage for label array and stores it locally
    const storedArray = JSON.parse(value);

    //finds the target value for each labeled element and tries to find a match
    const foundElement = storedArray.filter(obj => obj.element === target);

    //if it has been labeled, search for the label value in the object and re-log it
    if (foundElement.length > 0){
      const firstElement = foundElement[0]
      const matchedLabel = firstElement['label'];

      if (matchedLabel) {
        return (matchedLabel)
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

      friendly = getFriendly(log['target'])
      log['friendlyTarget'] = friendly

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


document.addEventListener("keydown", function (event) {
  if (event.key == "Shift") {
    isShiftPressed = true;
  }
});


var editingMode = false;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'updateEditingMode') {
    editingMode = request.value;
    console.log('Boolean variable updated:', editingMode);
  }
});


// chrome.runtime.sendMessage({ action: 'getEditingMode' }, function(response) {
//   // Access the value from the response
//   var editingMode = response.editingMode;
//   // Perform actions with the boolean variable
//   if (editingMode == true) {
//     // The variable is true
//     console.log('The boolean variable is true');
//   } else {
//     // The variable is false
//     console.log('The boolean variable is false');
//   }
// });


//handles user label clicks
function handleClick(event) {

  //sets the target variable
  var target = event.target;

  //initialize session storage
  sessionStorage.setItem("target", event.target.tagName.toLowerCase());

  if (isShiftPressed == true) {

    //build popup window
    popup = window.open('', 'name', 'width=200, height=200')
    if (popup.document.contains(popup.document.getElementById('button')) == false){
      popup.document.write("<form><label>Input your relabel here</label><input id = 'input1'><br/><label>Input your functionality here (optional)</label><input id = 'input2'><br/></form><button id = 'button' type = 'submit' onClick=\"javascript:window.close('','_parent','')\">Save</button><button onClick=\"javascript:window.close('','_parent','')\" id = 'cancel' style=\"float: right;\">Cancel</button>")
    }
    popup.document.getElementById('button').addEventListener("click", function(){

    //creates the two input fields
    userlabel = popup.document.querySelector("#input1").value
    userFunction = popup.document.querySelector("#input2").value  

    // Create an object to store the element and its label
    var batchElements = {
      element: getSelector(target),
      label: userlabel,
      functionality : userFunction
    };

    // add to clicked array
    clickedElements.push(batchElements);
    sessionStorage.setItem("userFriendlyArray", JSON.stringify(clickedElements))

    //highlight the clicked element
    target.style.border = "thick dashed #FFA500";

    // Log the clicked elements and closes the tab
    // console.log(clickedElements);
    popup.close()
    })

    //closes the tab if cancel is clicked
    popup.document.getElementById('cancel').addEventListener("click", function(){
    popup.close()})

}else{
  popup = window.open('', 'name', 'width=200, height=200')
    popup.document.write("<form><label>Input your relabel here</label><input id = 'input1'><br/><label>Input your functionality here (optional)</label><input id = 'input2'><br/></form><button id = 'button' type = 'submit' onClick=\"javascript:window.close('','_parent','')\">Save</button><button onClick=\"javascript:window.close('','_parent','')\" id = 'cancel' style=\"float: right;\">Cancel</button>")
    popup.document.getElementById('button').addEventListener("click", function(){

    //creates the two input fields
    userlabel = popup.document.querySelector("#input1").value
    userFunction = popup.document.querySelector("#input2").value  

    // Create an object to store the element and its label
    var elementWithLabel = {
      element: getSelector(target),
      label: userlabel,
      functionality : userFunction
    };

    // add to clicked array
    clickedElements.push(elementWithLabel);
    sessionStorage.setItem("userFriendlyArray", JSON.stringify(clickedElements))

    //highlight the clicked element
    target.style.border = "thick dashed #FFA500";

    // Log the clicked elements and closes the tab
    // console.log(clickedElements);
    popup.close()
    })

    //closes the tab if cancel is clicked
    popup.document.getElementById('cancel').addEventListener("click", function(){
    popup.close()})
}};
//};
document.addEventListener("keyup", function (event) {
  if (event.key == "Shift") {
    isShiftPressed = false;
    // label = window.prompt("Add a label for these elements", "Label name");
    for (var i = 0; i < batchElements.length; i++) {
      batchElements[i].label = userlabel;
    }
  }
});

// Add the click event listener to the document
document.addEventListener('click', handleClick);


/*
 eslint-enable
 */