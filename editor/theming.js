/* 
 * Copyright 2023 nigjo.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {StructoEdit} from './structoedit.js';

Promise.all([
  new Promise(ok => {
    if (document.readyState !== 'loading') {
      ok();
    } else {
      document.addEventListener('readystatechange', (e) => {
        if (document.readyState === 'interactive') {
          ok();
        }
      });
    }
  }),
  new Promise(ok => {
    StructoEdit.addOption({position: 500, category: "viewOptions",
      generator: () => {
          /*
           <li data-position="500">Theme:
           <input type="radio" name="theme" onclick="updateTheme(event)" id="theme_light" value="light">
           <label title="Light Theme" for="theme_light">⬜</label>
           <input type="radio" name="theme" onclick="updateTheme(event)" id="theme_dark" value="dark">
           <label title="Dark Theme" for="theme_dark">⬛</label>
           </li>
           */
        let frag = document.createDocumentFragment();
        frag.append("Theme: ");

        let btnAdder = (kind, label) => {
          let light = document.createElement("input");
          light.id = "theme_" + kind;
          light.type = "radio";
          light.name = "theme";
          light.value = kind;
          light.onclick = (e) => updateTheme(e);
          frag.append(light);
          let lblLight = document.createElement("label");
          lblLight.title = kind + " theme";
          lblLight.htmlFor = "theme_" + kind;
          lblLight.textContent = label;
          frag.append(lblLight);
        };
        btnAdder("light", "⬜");
        frag.append(" ");
        btnAdder("dark", "⬛");

        return frag;
      }});
    ok();
  })
]).then(initialize);
function initialize() {
  console.log("THEME", "init");
  let storedTheme = sessionStorage.getItem('structoedit.theme');
  if (storedTheme) {
    setTheme(storedTheme);
  }
}

function updateTheme(event) {
  setTheme(event.target.value);
}
function setTheme(theme) {
  let them = theme === 'light' ? 'dark' : 'light';
  document.body.classList.remove("structoview-" + them);
  document.body.classList.remove("structoedit-" + them);
  if (document.body.classList.contains("structoview-" + theme)) {
    document.body.classList.remove("structoview-" + theme);
    document.body.classList.remove("structoedit-" + theme);
    document.getElementById('theme_light').checked = false;
    document.getElementById('theme_dark').checked = false;
    sessionStorage.removeItem('structoedit.theme');
  } else {
    document.body.classList.add("structoview-" + theme);
    document.body.classList.add("structoedit-" + theme);
    document.getElementById('theme_' + theme).checked = true;
    sessionStorage.setItem('structoedit.theme', theme);
  }
}
