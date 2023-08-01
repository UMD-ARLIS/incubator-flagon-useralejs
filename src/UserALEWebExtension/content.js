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
  if (typeof path !== 'undefined') {
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
  };
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
    for ( let i =0; i < storedArray.length; i++){
    if (storedArray[i] != null){
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
    isShiftPressed = true;
  }
});
var batchEditingMode = false;
var editingMode = false;
var batchState = "default";
var conditional = 0;
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
      addHighlight()
    } else {
      conditional = 0;
      clearHighlight()
  }
  }
});


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "updateBatchEditingMode") {
    batchEditingMode = request.value;
    setBatchState("batch");
    count++;
    addHighlight()
    // when the user clicks the context menu again, we want the popup to then assign all of the elements their labels
    if (count % 2 == 0 && clickedElements.length > 0) {
      openPopup();
      setBatchState('default');
      if (conditional == 0){
      clearHighlight()
      }
    }
  }
});

function pathPopup(path){
  
  elements = selectorizePath(path);

  list = "<ol start='0'>" + elements.map(element => `<li>${element}</li>`).join("") + "</ol>";

  panel = window.open("", "pathWindow", "width=500, height=400");

  panel.document.write(list);
  
  panel.document.write(`
  <style>
    ol {
      list-style-type: none; 
      counter-reset: my-counter 0; 
    }
    li {
      counter-increment: my-counter; 
    }
    li::before {
      content: counter(my-counter) ":"; 
      margin-right: 5px; 
      color: red;
    }
  </style>
`);
};

function clearHighlight(){
  const highlight = sessionStorage.getItem('userFriendlyArray')
  const noHighlight = JSON.parse(highlight);
  if (noHighlight!= null){
  for (let i=0; i < noHighlight.length; i++){
  checkHighlight = noHighlight[i]['targetPath']
  let parsedHighlight = JSON.parse(checkHighlight)
  console.log(parsedHighlight)
  finalVar = parsedHighlight[0]
  if (finalVar.indexOf('.') !== -1){
    splitVar = finalVar.split('.')[0]
    j= document.querySelectorAll(splitVar)
    for (let k=0; k < j.length; k++){
      if (j[k].hasAttribute('style') == true){
        check = j[k].getAttribute('style')
          if (check.includes("thick dashed rgb(255, 165, 0)")){
            j[k].style.border ='thick dashed #ffffff00'
      }
    }
    }
  }else{
    j= document.querySelectorAll(finalVar)
    for (let k=0; k < j.length; k++){
      if (j[k].hasAttribute('style') == true){
        check = j[k].getAttribute('style')
          if (check.includes("thick dashed rgb(255, 165, 0)")){
            j[k].style.border ='thick dashed #ffffff00'
    }

}
    }
  }
}
  }
}
function addHighlight(){
  const highlight = sessionStorage.getItem('userFriendlyArray')
  const addHighlight = JSON.parse(highlight);
  if (addHighlight != null){
    for (let i=0; i < addHighlight.length; i++){
      checkHighlight = addHighlight[i]['targetPath']
      checkLabel = addHighlight[i]['label']
      let parsedHighlight = JSON.parse(checkHighlight)
      finalVar = parsedHighlight[0]
    if (finalVar.indexOf('.') !== -1){      
      divHighlight = finalVar.split('.')[0]
      j = document.querySelectorAll(divHighlight)
      for (let k=0; k < j.length; k++){
      if (j[k].hasAttribute('style') == true){  
        let check = j[k].getAttribute('style')
        if (check.includes('border: thick dashed rgba(255, 255, 255, 0)') && checkLabel != ""){
        j[k].style.border ='thick dashed #FFA500' 
      }
    }
    }
  }else{
    checkLabel = addHighlight[i]['label']
    j = document.querySelectorAll(finalVar)
        for (let k=0; k < j.length; k++){
          if (j[k].hasAttribute('style') == true){   
            let check = j[k].getAttribute('style')
        if (check.includes('border: thick dashed rgba(255, 255, 255, 0)')  && checkLabel != ""){
            j[k].style.border ="thick dashed #FFA500";
        }
        }
      }
    }
    }
  }
}
//handles user label clicks
function handleClick(event) {
  lastBatchState = getBatchState();
  //sets the target variable and eventPath variable
  var target = event.target;
  var eventPath = event.composedPath();



  // begin clicking batch elements
  if (batchState == "batch" && count % 2 == 1) {
    target.style.border = "thick dashed #FFA500";
    
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


    // single editing
  } else if (
    batchState === "default" &&
    editingMode === true &&
    conditional == 1 
  ) {
    //checks to see if a user has previously selected an element on the page by checking if the element has a border around it
    if (event.target.hasAttribute('style') == true){
      if (event.target.getAttribute('style').includes("border: thick dashed rgb(255, 165, 0);")){
        //opens the popup
        editPopup = window.open('', 'name', 'width=200, height=200')
        editPopup.document.write("<label>Click here to undo a previous label</label><br/><button onClick=\"javascript:window.close('','_parent','')\" id = 'clear' style=\"float: center;\" >Clear</button></br><label>Click here to clear all previous labels</label></br><button onClick=\"javascript:window.close('','_parent','')\" id = 'clearAll' style=\"float: center;\" >Clear All</button><br><button onClick=\"javascript:window.close('','_parent','')\" id = 'cancel' style=\"float: right;\">Cancel</button>")
        //clears all the previously labelled elements on that webpage
        editPopup.document.getElementById('clearAll').addEventListener("click", function(){
          clickedElements = []
          console.log(clickedElements)
          clearHighlight()
          sessionStorage.clear()
          editPopup.close()
      })
       //clears only the selected element label on that webpage
      editPopup.document.getElementById('clear').addEventListener("click", function(){
        storedLabel = sessionStorage.getItem('userFriendlyArray')
        storedLabel = JSON.parse(storedLabel)
        newArr = []
        for (let i=0; i < storedLabel.length; i++){
          interate = storedLabel[i]['targetPath']
          if(JSON.stringify(selectorizePath(eventPath)) != interate){
            newArr.push(storedLabel[i])
          }
        }
            clickedElements = newArr
            sessionStorage.setItem('userFriendlyArray', JSON.stringify(newArr))
            event.target.style.border = 'none'
            editPopup.close()

      })
      editPopup.document
      .getElementById("cancel")
      .addEventListener("click", function () {
        editPopup.close();
      });
    }
  }
    if (event.target.getAttribute('style') !== "border: thick dashed rgb(255, 165, 0);"){
      target.style.border = "thick dashed #FFA500";
    popup = window.open("", "name", "width=200, height=200");
      if (
        popup.document.contains(popup.document.getElementById("clear")) == false
       && popup.document.contains(popup.document.getElementById("button")) == false) {
    popup.document.write(
      "<form><label>Input your relabel here</label><input id='input1'><br/><label>Input your functionality here (optional)</label><input id='input2'><br/></form><div style='display: flex; justify-content: space-between; margin-top: 10px'><button id='button' type='submit' onClick=\"javascript:window.close('','_parent','')\">Save</button><button id='cancel' onClick=\"javascript:window.close('','_parent','')\">Cancel</button><button id='path'>Show Path</button></div>"
    );
    }
    if (
      popup.document.contains(popup.document.getElementById("button")) == true
    ) {
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

        // Log the clicked elements and closes the tab
        popup.close();
      });
    //closes the tab if cancel is clicked
    popup.document
      .getElementById("cancel")
      .addEventListener("click", function () {
        popup.close();
        target.style.border = 'none'
      });
      //event handler for 'show path' button
    popup.document
    .getElementById("path")
    .addEventListener("click", function () {
      pathPopup(eventPath);
    });
    }
  }

  }
  // when to actually assign all elements the same label
  if (count > 0 && count % 2 == 0 && batchState == 'batch') {

    //  build popup window
    popup = window.open("", "name", "width=200, height=200");
    if (
      popup.document.contains(popup.document.getElementById("button")) == false
    ) {
      popup.document.write(
        "<form><label>Input your relabel here</label><input id='input1'><br/><label>Input your functionality here (optional)</label><input id='input2'><br/></form><div style='display: flex; justify-content: space-between; margin-top: 10px'><button id='button' type='submit' onClick=\"javascript:window.close('','_parent','')\">Save</button><button id='cancel' onClick=\"javascript:window.close('','_parent','')\">Cancel</button><button id='path'>Show Path</button></div>"
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
      popup.document
      .getElementById("path")
      .addEventListener("click", function () {
        pathPopup(eventPath);
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
      clickedElements.push(batchElements);

      clickedElements.pop()

      sessionStorage.setItem(
          "userFriendlyArray",
          JSON.stringify(clickedElements)
        );
      // Log the clicked elements and closes the tab

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