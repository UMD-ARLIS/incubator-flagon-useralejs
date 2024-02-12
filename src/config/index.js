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

import {Setting} from "./setting.js"

export const config = {
    autostart: new Setting(
        parameter = "autostart",
        defaultValue = true,
        logged = false,
        validate = function(value) {
            return;
        }
    ),
    url: new Setting(
        parameter="url",
        defaultValue="http://localhost:8000",
        logged = true,
        validate = function(value) {
            return;
        }
    ),
    transmitInterval: new Setting(
        parameter="interval",
        defaultValue="5000",
        logged = false,
        validate = function(value) {
            return;
        }
    ),
    logCountThreshold: new Setting(
        parameter="threshold",
        defaultValue="5",
        logged = false,
        validate = function(value) {
            return;
        }
    ),
    userId: new Setting(
        parameter="user",
        defaultValue=null,
        logged = true,
        validate = function(value) {
            return;
        }
    ),
    logDetails: new Setting(
        parameter="log-details",
        defaultValue=false,
        logged = true,
        validate = function(value) {
            return;
        }
    ),
}