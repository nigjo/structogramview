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
class StructElement extends HTMLElement {
  getName(){
    return this.constructor.name.substr(6).toUpperCase();
  }
}
class StructBlock extends StructElement {
}
class StructContainer extends StructElement {
  set condition(condition){this.setAttribute('condition', condition);}
  get condition(){return this.getAttribute('condition');}
  setBlock(index, block){
    if(this.children.length<index)
      throw "IndexOutOfBound: "+index+' > '+(this.children.length-1);
    if(index<this.children.length)
      this.replaceChild(block, this.children[index]);
    else
      this.appendChild(block);
  }
  getBlock(index){
    if(this.children.length<index)
      throw "IndexOutOfBound: "+index+' > '+this.children.length;
    if(index<this.children.length)
      return this.children[index];
    else
      return this.appendChild(new StructBlock());
  }
}
class StructSequence extends StructElement {
}
class StructComment extends StructSequence {
  isMultiline() {
    return this.textContent.indexOf("\n") > 0;
  }
  get lines() {
    return this.textContent.split("\n");
  }
  addComment(line) {
    if (this.textContent.length !== 0) {
      this.textContent += "\n" + line;
    } else {
      this.textContent = line;
    }
  }
}
class StructDecision extends StructContainer {
  getName(){
    return "IF";
  }
  set thenBlock(block){
    this.setBlock(0, block);
  }
  get thenBlock(){
    return this.getBlock(0);
  }
  set elseBlock(block){
    this.getBlock(0);//ensure block 0
    this.setBlock(1, block);
  }
  get elseBlock(){
    this.getBlock(0);//ensure block 0
    return this.getBlock(1);
  }
}
class StructChoose extends StructContainer {
  getName(){
    return "SELECT";
  }
  set defaultBlock(block){
    this.lastBlock = block;
  }
  get defaultBlock(){
    if(!this.lastBlock){
      this.lastBlock = new StructBlock();
      this.lastBlock.kind = 'defaultBlock';
      this.appendChild(this.lastBlock);
    }
    return this.lastBlock;
  }
  createNextCase(){
    var block = new StructCaseBlock();
    this.insertBefore(block, this.defaultBlock);
    return block;
  }
}
class StructCaseBlock extends StructBlock {
  set condition(condition){this.setAttribute('condition',condition);}
  get condition(){return this.getAttribute('condition');}
}
class StructLoop extends StructContainer {
  set loopBlock(block){
    this.setBlock(0, block);
  }
  get loopBlock(){
    return this.getBlock(0);
  }
}
class StructIteration extends StructLoop {
  getName(){
    return "FOR";
  }
}
class StructRepeat extends StructIteration {
  getName(){
    return "REPEAT";
  }
}
class StructCall extends StructSequence {
}
class StructBreak extends StructSequence {
  set exit(isexit){
    if(isexit){
      this.setAttribute("exit", "true");
    }else{
      this.removeAttribute("exit");
    }
  }
  get exit(){
    return this.getAttribute("exit")==="true";
  }
}
class StructConcurrent extends StructContainer {
  createThread(){
    var nextThread = new StructBlock();
    this.appendChild(nextThread);
    return nextThread;
  }
}
class StructDiagram extends StructElement {
  set caption(caption){this.setAttribute('caption',caption);}
  get caption(){return this.getAttribute('caption');}
}

customElements.define('struct-diagram',StructDiagram);
customElements.define('struct-sequence',StructSequence);
customElements.define('struct-comment',StructComment);
customElements.define('struct-block',StructBlock);
customElements.define('struct-decision',StructDecision);
customElements.define('struct-select',StructChoose);
customElements.define('struct-case',StructCaseBlock);
customElements.define('struct-loop',StructLoop);
customElements.define('struct-iteration',StructIteration);
customElements.define('struct-repeat',StructRepeat);
customElements.define('struct-call',StructCall);
customElements.define('struct-break',StructBreak);
customElements.define('struct-concurrent',StructConcurrent);

function StructCodeParseException(linenum, line, error){
  this.linenum=linenum;
  this.line = line;
  this.contextError = error?error.toString():'unknown';
  this.toString = function() {
    return "Error in line " + linenum + ": '"+line+"', " + this.contextError;
  };
}
