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

import {StructoEdit}
from '../editor/structoedit.js';

class XMLView {
  constructor() {
  }

  generateStructure(diagram) {
    let xdoc = document.implementation.createDocument(
            "https://nigjo.github.io/structogramview/", "", null);
    let copy = diagram.cloneNode(true);
    xdoc.appendChild(copy);
    var xmllines = new XMLSerializer().serializeToString(xdoc)
            .replace(/ xmlns=([\"])[^\"]+[\"]/, "")
            .replace(/ data-\w+=([\"])[^\"]+[\"]/g, "")
            .replace(/ (draggable)=([\"])[^\"]+[\"]/g, "")
            .replace(/<([^\/][-a-z]*)><\/\1>/g, '<$1>	</$1>')
            .replace(/>(?=<)/g, '>\n')
            .replace(/>	</g, '><')
            .split('\n');
    var indended = '';
    var indent = '';
    for (var l in xmllines) {
      if (xmllines[l].indexOf('</') >= 0) {
        if (xmllines[l].indexOf('<struct-') < 0)
          indent = indent.substr(2);
        indended += indent + xmllines[l] + '\n';
      } else {
        indended += indent + xmllines[l] + '\n';
        indent += '  ';
      }
    }
    return indended.replace(/<(\/)?struct-/g, '<$1');
  }

  generateStructureView(diagram, xmlviewid) {
    document.getElementById(xmlviewid).textContent =
            this.generateStructure(diagram);
  }
}

function createStorageTree(e) {
  let config = e.detail;

  var sourcecode = document.getElementById("xmlview");
  let outcontent = sourcecode.textContent
          .replace(/>/, " xmlns:structo=\"https://nigjo.github.io/structogramview/\">")
          .replace(/<(\/)?/g, "<$1structo:");
  //console.log("textContent", outcontent);
  const parser = new DOMParser();
  let xmldata = parser.parseFromString(outcontent, 'application/xml');
  //console.log("xmldata", xmldata);
  let outData = xmldata.firstElementChild.cloneNode(true);
  outData.removeAttribute("xmlns:structo");

  let astCopy = config.doc.createElementNS(config.namespace, "structo:ast");
  astCopy.append(outData);

  config.metadata.append(astCopy, "\n");

  return outData;
}


document.addEventListener('DOMContentLoaded', () => {

  StructoEdit.addView({name: 'XML', position: 8500, caption: 'Structured view',
    viewContent: '<div class="structtree" id="xmlview"></div>'
  });

  let structOpt = StructoEdit.addOption({name: 'withStructure', position: 400,
    label: 'Structure', title: "store 'Source Structure' within svg"});
  structOpt.type = 'checkbox';
  structOpt.onstoreview = createStorageTree;

});
document.addEventListener('structoedit.update', evt => {
  var diagram = evt.detail.diagram;
  //var structview = evt.detail.view;
  let generator = new XMLView();
  generator.generateStructureView(diagram, "xmlview");
});

//window.xmlView = new XMLView();
