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

import {SourceParser, SourceParseException} from "./source-parser.js";

class StructoCodeParser extends SourceParser {

  getFileType() {
    return 'spc';
  }

  getDescription() {
    return "";
  }
  
  parseSourceContent(fileContent) {
    this.diagram = this.parseStructCode(fileContent);
  }
  queryDiagramNames() {
    if(this.diagram){
      if(this.diagram.caption)
        return this.diagram.caption;
      else
        return 'diagram';
    }
    return undefined;
  }
  getDiagram(diagramName) {
    return this.diagram;
  }

  parseStructCode(structCode) {
    var stack = [new StructDiagram()];

    var lastlineindex;
    var lines = structCode.split('\n');

    function checkBlock(blockname) {
      var stackblock = stack[0].getName();
      if (stack[0] instanceof StructBlock) {
        stackblock = stack[1].getName();
      }
      if (stackblock !== blockname) {
        throw 'illegal end of block. Expecting END' + stackblock + ':';
      }
    }
    function checkEmptyBlock(block) {
      if (block.children.length === 0) {
        block.appendChild(new StructSequence());//.textContent=' ';
      }
    }

    for (var i = 0; i < lines.length; i++) {
      try {
        var trimmed = lines[i].trim();
        if (trimmed.length === 0)
          continue;
        lastlineindex = i;
        if (trimmed.startsWith('#')) {
          let comment = trimmed.substr(1).trim();
          if (comment.length > 0) {
            if (!(stack[0].lastElementChild instanceof StructComment)) {
              let item = new StructComment();
              item.dataset.line = "" + i;
              stack[0].appendChild(item);
            }
            stack[0].lastElementChild.addComment(comment);
          }
        } else if (trimmed.startsWith('CAPTION:')) {
          stack[0].caption = trimmed.substr(8).trim();
        } else if (trimmed.startsWith('IF:')) {
          var item = new StructDecision();
          item.dataset.line = "" + i;
          item.condition = trimmed.substr(3).trim();
          stack.unshift(item);
          stack.unshift(item.thenBlock);
        } else if (trimmed.startsWith('ELSE:')) {
          var block = stack.shift();
          let item = stack[0].elseBlock;
          item.dataset.line = "" + i;
          stack.unshift(item);
        } else if (trimmed.startsWith('ENDIF:')) {
          checkBlock('IF');
          var block = stack.shift();
          var item = stack.shift();
          checkEmptyBlock(item.elseBlock);
          stack[0].appendChild(item);
        } else if (trimmed.startsWith('SELECT:')) {
          var item = new StructChoose();
          item.dataset.line = "" + i;
          item.condition = trimmed.substr(7).trim();
          stack.unshift(item);
        } else if (trimmed.startsWith('CASE:')) {
          var item = stack[0];
          if (item instanceof StructBlock) {
            var prevcase = stack.shift();
            checkEmptyBlock(prevcase);
          }
          var block = stack[0].createNextCase();
          block.dataset.line = "" + i;
          block.condition = trimmed.substr(5).trim();
          stack.unshift(block);
        } else if (trimmed.startsWith('DEFAULT:')) {
          var item = stack[0];
          if (item instanceof StructBlock) {
            var prevcase = stack.shift();
            checkEmptyBlock(prevcase);
          }
          let defitem = stack[0].defaultBlock;
          defitem.dataset.line = "" + i;
          stack.unshift(defitem);
        } else if (trimmed.startsWith('ENDSELECT:')) {
          checkBlock('SELECT');
          var item = stack[0];
          if (item instanceof StructBlock) {
            var prevcase = stack.shift();
            checkEmptyBlock(prevcase);
          }
          var item = stack.shift();
          checkEmptyBlock(item.defaultBlock);
          stack[0].appendChild(item);
        } else if (trimmed.startsWith('FOR:')) {
          var item = new StructIteration();
          item.dataset.line = "" + i;
          item.condition = trimmed.substr(4).trim();
          stack.unshift(item);
          stack.unshift(item.loopBlock);
        } else if (trimmed.startsWith('ENDFOR:')) {
          checkBlock('FOR');
          var block = stack.shift();
          var item = stack.shift();
          checkEmptyBlock(item.loopBlock);
          stack[0].appendChild(item);
        } else if (trimmed.startsWith('REPEAT:')) {
          var item = new StructRepeat();
          item.dataset.line = "" + i;
          item.condition = trimmed.substr(7).trim();
          stack.unshift(item);
          stack.unshift(item.loopBlock);
        } else if (trimmed.startsWith('ENDREPEAT:')) {
          checkBlock('REPEAT');
          var BLOCK = stack.shift();
          var item = stack.shift();
          checkEmptyBlock(item.loopBlock);
          stack[0].appendChild(item);
        } else if (trimmed.startsWith('LOOP:')) {
          var item;
          if (trimmed !== 'LOOP:') {
            item = new StructIteration();
            item.condition = trimmed.substr(5).trim();
          } else {
            item = new StructLoop();
          }
          item.dataset.line = "" + i;
          stack.unshift(item);
          stack.unshift(item.loopBlock);
        } else if (trimmed.startsWith('ENDLOOP:')) {
          checkBlock('LOOP');
          var block = stack.shift();
          var item = stack.shift();
          if (item instanceof StructLoop && trimmed !== 'ENDLOOP:') {
            item.condition = trimmed.substr(8).trim();
          }
          checkEmptyBlock(item.loopBlock);
          stack[0].appendChild(item);
        } else if (trimmed.startsWith('CALL:')) {
          let item = new StructCall();
          item.dataset.line = "" + i;
          stack[0].appendChild(item).textContent = trimmed.substr(5).trim();
        } else if (trimmed.startsWith('BREAK:')) {
          let item = new StructBreak();
          item.dataset.line = "" + i;
          stack[0].appendChild(item).textContent = trimmed.substr(6).trim();
        } else if (trimmed.startsWith('RETURN:')
                || trimmed.startsWith('EXIT:')) {
          let item = new StructBreak();
          item.dataset.line = "" + i;
          item.exit = true;
          stack[0].appendChild(item).textContent = trimmed.substr(7).trim();
        } else if (trimmed.startsWith('CONCURRENT:')) {
          var item = new StructConcurrent();
          item.dataset.line = "" + i;
          //item.condition = trimmed.substr(7).trim();
          stack.unshift(item);
        } else if (trimmed.startsWith('THREAD:')) {
          var item = stack[0];
          if (item instanceof StructBlock) {
            var prevcase = stack.shift();
            checkEmptyBlock(prevcase);
          }
          var block = stack[0].createThread();
          stack.unshift(block);
        } else if (trimmed.startsWith('ENDCONCURRENT:')) {
          checkBlock('CONCURRENT');
          var item = stack[0];
          if (item instanceof StructBlock) {
            var prevcase = stack.shift();
            checkEmptyBlock(prevcase);
          }
          var item = stack.shift();
          //checkEmptyBlock(item.defaultBlock);
          stack[0].appendChild(item);
        } else {
          let item = new StructSequence();
          item.dataset.line = "" + i;
          stack[0].appendChild(item).textContent = trimmed;
        }
      } catch (e) {
        throw new StructCodeParseException(i, lines[i], e);
      }
    }
    if (stack.length !== 1) {
      var blockname = stack[0].getName();
      if (stack[0] instanceof StructBlock) {
        blockname = stack[1].getName();
      }
      throw new StructCodeParseException(lastlineindex, lines[lastlineindex],
              'illegal stack size. Expecting END' + blockname + ':');
    }

    return stack.shift();
  }
}

SourceParser.register(new StructoCodeParser());
