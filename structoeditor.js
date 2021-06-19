/* 
 * Copyright 2021 nigjo.
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
import {hljs as hljs} from './highlight.js';
//import javascript from './highlight.js/lib/languages/javascript';
//hljs.registerLanguage('javascript', javascript);
//import "./structoview.js"

if (document.readyState !== 'complete') {
  document.addEventListener('DOMContentLoaded', initEditor);
} else {
  initEditor();
}

function initEditor() {
  console.log("loaded");
  let editor = document.getElementById('editor');
  hljs.registerLanguage("structcode", () => {
    return {
      case_insensitive: false, // language is case-insensitive
      keywords: 'CAPTION'
              + ' IF THEN ELSE ENDIF'
              + ' SELECT CASE DEFAULT ENDSELECT'
              + ' FOR ENDFOR'
              + ' LOOP ENDLOOP'
              + ' CALL'
              + ' BREAK RETURN'
              + ''
      ,
      contains: [
        {
          scope: 'string',
          begin: '"', end: '"'
        },
        hljs.COMMENT(
                '#'
                )
      ]
    };
  });


  let result = hljs.highlight(editor.innerHTML,
          {language: 'structcode'});
  console.log(result);
  editor.innerHTML = result.value;
  editor.addEventListener('input', handleInput);
}

function handleInput(event) {
  console.log(event, window.module);
  let sel = window.getSelection();
  console.log(sel);
  let pos = sel.anchorOffset;
  let node = sel.anchorNode;
  do {
    while (node.previousSibling !== null) {
      node = node.previousSibling;
      pos += node.textContent.length;
    }
    if (node.parentNode === event.target) {
      break;
    }
    node = node.parentNode;
    if (node.parentNode !== event.target
            && node.previousSibling) {
      pos += node.previousSibling.textContent.length;
    }
  } while (true);
  console.log(pos);
  event.target.innerHTML = hljs.highlight(event.target.textContent,
          {language: 'structcode'}).value;
  let setnode = event.target.firstChild;
  while (setnode && pos > 0) {
    let l = setnode.textContent.length;
    console.log(pos, l);
    if (pos <= l) {
      console.log(setnode);

      var range = document.createRange();
      if (setnode.nodeType === Node.TEXT_NODE) {
        range.setStart(setnode, pos);
      } else {
        range.setStart(setnode.firstChild, pos);
      }
      range.collapse(true);

      sel.removeAllRanges();
      sel.addRange(range);

      break;
    }
    setnode = setnode.nextSibling;
    pos -= l;
  }
}