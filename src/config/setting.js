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

const script = document.currentScript || (function () {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
})();

const get = script ? script.getAttribute.bind(script) : function () {
    return null;
};

export class Setting {
    #parameter;
    #defaultValue;
    #logged;
    #validate;
    // potential additional field: nullable or required? Or should that be part of the validate function

    #value;

    /**
     * Creates a new setting for the userale handler.
     * @param  {String} parameter       Data tag name to fetch from script tag
     * @param  {Object} defaultValue    Default value
     * @param  {Boolean} logged         Wether setting is included in userale logs
     * @param  {Function} validate      Function to check if a value is valid
     */
    constructor(parameter, defaultValue, logged, validate) {
        this.#parameter = parameter;
        this.#defaultValue = defaultValue;
        this.#logged = logged;
        this.#validate = validate;
        this.reset();
    }

    init() {
        if(this.#parameter) {
            let val = get('data-' + this.#parameter);
            if(val) {
                try {
                    this.update(val);
                } catch (error) {
                    return false;
                }
            }
        }

        return true;
    }

    update(val) {
        this.#validate(val);

        let oldVal = this.#value;
        this.#value = val;
        return oldVal
    }

    reset() {
        try {
            return this.update(this.#defaultValue);
        } catch (error) {
            return false;
        }
    }

    get() {
        return this.#value;
    }

    isLogged() {
        return this.#logged
    }
}