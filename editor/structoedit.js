/*
 Copyright 2021-2022 Jens Hofschröer <structogramview@nigjo.de>
 
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 
 http://www.apache.org/licenses/LICENSE-2.0
 
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
/* global StructBlock, StructComment */

import {SourceParser, SourceParseException} from "./source-parser.js";
const StructoEdit = {};

const LOGGER = "StructoEdit";

//window.StructoEdit = StructoEdit;
/**
 * Add a new View
 * 
 * @param {Object} arguments[0] Aktuelle Konfiguration
 * @returns {Element} figure
 */
StructoEdit.addView = function ( {name, position = 8000, caption = "", viewContent = ""}) {

  console.assert(name !== undefined, "name must be set in config");
  let firstView = false;

  let styles = document.getElementById("viewStyles");
  if (!styles) {
    firstView = true;

    styles = document.createElement("style");
    styles.id = "viewStyles";
    document.head.append(styles);
  }
  styles.textContent = styles.textContent
          + 'input#show' + name + ':checked~main #view' + name
          + '{display:inline-block;}\n'
          + 'input#show' + name + ':checked~nav label[for="show' + name + '"]'
          + '{color:var(--structoedit-menu-sel);'
          + 'background-color:var(--structoedit-menu-sel-bg);}\n'
          + 'input#show' + name + ':focus~nav label[for="show' + name + '"]'
          + '{box-sizing:border-box;outline:1px dotted gray;}\n'
          ;

  //<input type="radio" name="viewOption" tabindex="2" id="showSVG">
  var radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = 'viewOption';
  radio.tabIndex = 2;
  radio.id = 'show' + name;
  radio.checked = firstView;
  document.body.insertAdjacentElement('afterbegin', radio);

  //<li><label class="menuitem" for="showSVG">SVG</label></li>
  var item = document.createElement('li');
  item.className = 'viewOption';
  item.dataset.position = position;
  var label = document.createElement('label');
  label.className = 'menuitem';
  label.htmlFor = 'show' + name;
  label.textContent = name;
  item.append(label);

  _addAtPosition(
          document.querySelector("nav ul[id='viewOptions'] .buttons"),
          item, position);

  //<figure id="imageview">
  let figure = document.createElement('figure');
  figure.id = 'view' + name;
  figure.className = 'view';
  //`figureContent`
  if (viewContent && viewContent !== '') {
    figure.insertAdjacentHTML('afterbegin', viewContent);
  }
  //<figcaption>`figureCaption`</figcaption>
  let fcaption = document.createElement('figcaption');
  fcaption.append(caption);
  figure.append(fcaption);
  document.querySelector('main').append(figure);
  //</figure>

  return figure;
};

function _addAtPosition(parent, item, position) {
  let buttons = parent.querySelectorAll("li[data-position]");
  let added = false;
  item.dataset.position = position;
  for (var i = 0; i < buttons.length; i++) {
    if (position < buttons[i].dataset.position) {
      //console.log('addView', buttons[i]);
      buttons[i].parentNode.insertBefore(item, buttons[i]);
      added = true;
      break;
    }
  }
  if (!added) {
    parent.append(item);
  }
}

StructoEdit.addAction = function ( {caption, href,
        category = "actions", position = 8000,
        callback, generator }) {
  let item = document.createElement('li');

  let action;

  if (generator) {
    action = generator();
    item.append(action);
  } else {
    //<a class="menuitem" href="diagram.svg"
    // onclick="downloadSvgWithOptions(event, 'diagramView');return false;">📥 Store SVG</a>
    action = document.createElement('a');
    action.className = 'menuitem';
    action.href = href;
    action.insertAdjacentHTML('afterbegin', caption);
    action.onclick = (evt) => {
      callback(evt);
      return false;
    };
    item.append(action);
  }
  _addAtPosition(document.querySelector('nav ul[id="' + category + '"] .buttons'),
          item, position);
  return action;
};

StructoEdit.addOption = function ( {name,
        category = "actions",
        position = 8000,
        label, title,
        generator }) {
  //<li>
  //<label title="store current sources within svg">
  //<input type="checkbox" checked name="withSources"> Source</label>
  //</li>
  let item = document.createElement('li');
  let option;
  if (generator) {
    option = generator();
    item.append(option);
  } else {
    option = document.createElement("input");
    option.name = name;
    if (label) {
      let labelElement = document.createElement('label');
      if (title)
        labelElement.title = title;
      labelElement.append(option);
      labelElement.append(' ');
      labelElement.insertAdjacentHTML('beforeend', label);
      item.append(labelElement);
    } else {
      item.append(option);
    }
  }
  _addAtPosition(document.querySelector('nav ul[id="' + category + '"] .options'),
          item, position);
  return option;
};

function _generateDiagram(viewer) {
  let codeid = viewer.dataset.structcodeId;
  let sourcecode = document.querySelector('#' + codeid);
  /**
   * @type SourceParser
   */
  var importer = SourceParser.createParser();
  if (sourcecode.value)
    importer.parseSourceContent(sourcecode.value);
  else
    importer.parseSourceContent(sourcecode.textContent);
  let firstname = importer.queryDiagramNames()[0];
  let diagram = importer.getDiagram(firstname);
  while (viewer.children.length > 0)
    viewer.removeChild(viewer.firstChild);
  viewer.appendChild(diagram);
  return viewer.firstElementChild;
}

StructoEdit.updateView = function (structview) {
  var codeid = structview.dataset.structcodeId;
  var sourcecode = document.querySelector('#' + codeid);
  var erroritem = sourcecode.parentNode;
  if (sourcecode.dataset.erroritem) {
    erroritem = document.getElementById(sourcecode.dataset.erroritem);
  }

  if (!sourcecode.onkeyup) {
    sourcecode.onkeyup = (event) => _checkCurrentContent(sourcecode, event);
  }

  try {
    erroritem.dataset.parsererror = '';

    var diagram = _generateDiagram(structview);
    var usecompact = document.getElementById('usecompactselect');
    if (usecompact && usecompact.checked) {
      diagram.classList.add('compactselect');
    }
    var locale = document.querySelector("select[name='locale']");
    if (locale) {
      if (locale.value === 'default')
        diagram.removeAttribute('lang');
      else
        diagram.lang = locale.value;
    }

    document.dispatchEvent(new CustomEvent('structoedit.update', {
      detail: {
        source: sourcecode,
        view: structview,
        diagram: diagram
      }
    }));
  } catch (e) {
    console.warn('parser:', e);
    if (e instanceof SourceParseException) {
      erroritem.dataset.parsererror = e.toString();
    }
  }
  _hightlightText(sourcecode);
};

function _hightlightText(sourcecode) {
  //console.log(sourcecode);
  if (sourcecode.dataset.marks) {
    let marker = document.getElementById(sourcecode.dataset.marks);
    //console.log(marker);
    let content = sourcecode.value;
    marker.textContent = '';
    const Commands = /^(\s*)([A-Z]+:)(.*)$/;
    let linenum = 0;
    for (let line of content.split('\n')) {
      let parts = line.match(Commands);
      let textparent = marker;
      if (sourcecode.dataset.line) {
        if (Number(sourcecode.dataset.line) === linenum) {
          let selection = document.createElement('SPAN');
          selection.className = "selected";
          textparent.append(selection);
          textparent = selection;
        }
      }
      //console.log(line,parts);
      if (parts) {
        textparent.append(parts[1]);
        let mark = document.createElement('SPAN');
        mark.className = 'mark';
        mark.textContent = parts[2];
        textparent.append(mark);
        textparent.append(parts[3]);
      } else {
        //console.log(line);
        textparent.append(line);
      }
      marker.append('\n');
      ++linenum;
    }
    //marker.textContent = content;
  }

  // let copy = sourcecode.cloneNode(false);
  // copy.selectionStart = sourcecode.selectionStart;
  // copy.selectionEnd = sourcecode.selectionEnd;


  //sourcecode.replaceWith(copy);
}

document.addEventListener("structoedit.refresh", () => StructoEdit.generateViews());

StructoEdit.generateViews = function () {
  var allCodes = document.querySelectorAll('.structcode');
  for (var i = 0; i < allCodes.length; i++) {
    if (allCodes[i].dataset.marks) {
      let marker = document.getElementById(allCodes[i].dataset.marks);
      if (marker) {
        allCodes[i].addEventListener('scroll', (evt) => {
          //console.log(marker, evt);
          let mstyle = getComputedStyle(marker);
          marker.style.top =
                  -evt.target.scrollTop
                  + parseInt(mstyle.insetInlineStart) + 'px';
        });
      }
    }
  }
  var allViews = document.querySelectorAll('.structview');
  function updateLineNum(structview, num) {
    if (structview) {
      var codeid = structview.dataset.structcodeId;
      var sourcecode = document.querySelector('#' + codeid);
      sourcecode.dataset.line = num;
      _hightlightText(sourcecode);
    }
  }
  ;
  for (var i = 0; i < allViews.length; i++) {
    allViews[i].addEventListener('mouseleave', (evt) => {
      let structview = evt.target.closest('.structview');
      updateLineNum(structview, null);
    });
    allViews[i].addEventListener('mouseover', (evt) => {
      let structview = evt.target.closest('.structview');
      let nextline = evt.target.closest('*[data-line]');
      if (nextline) {
        updateLineNum(structview, nextline.dataset.line);
      } else {
        updateLineNum(structview, null);
      }
    });
    StructoEdit.updateView(allViews[i]);
  }
};

//StructoEdit.addOption("language", 9000, );

function _updateContent(ta, keyevent) {
  var sourceid = typeof ta === 'string' ? ta : ta.id;
  var viewer = document.querySelector('.structview[data-structcode-id="' + sourceid + '"]');
  StructoEdit.updateView(viewer);
}
var nextContentUpdate;
function _checkCurrentContent(ta, e) {
  clearTimeout(nextContentUpdate);
  nextContentUpdate = setTimeout(function () {
    _updateContent(ta, e);
  }, 500);
  _hightlightText(e.target);
}

StructoEdit.addView({name: "HTML", position: 100, caption: "Nassi–Shneiderman diagram",
  viewContent: '<div class="structview" id="diagramView"\
     data-structcode-id="sample1" data-structcode-xml="xmlview" data-structcode-svg="svgdiagram"></div>'});

StructoEdit.addAction({category: "viewOptions", position: 9000, generator: () => {
    let selector = document.createElement("select");
    selector.name = "locale";
    selector.className = "menuitem";
    selector.onchange = StructoEdit.generateViews;
    selector.insertAdjacentHTML("beforeend", '<option>default');
    selector.insertAdjacentHTML("beforeend", '<option value="en">english');
    selector.insertAdjacentHTML("beforeend", '<option value="de">deutsch');
    return selector;
  }});

(() => {
//<li data-position="200"><label><input id="usecompactselect" type="checkbox" onchange="updateContent('sample1', event)"> Vertical 'Select'</label></li>
  let selectOption = StructoEdit.addOption({position: 200, category: "viewOptions", label: "Vertical 'Select'",
    title: "'CASE:' elements with vertical alignment"});
  selectOption.id = "usecompactselect";
  selectOption.type = "checkbox";
  selectOption.onchange = e => StructoEdit.generateViews();
})();

export {StructoEdit};
