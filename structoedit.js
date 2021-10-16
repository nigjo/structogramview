function generateDiagram(viewer){
  var codeid = viewer.dataset.structcodeId;
  var sourcecode = document.querySelector('#'+codeid);
  var diagram;
  if(sourcecode.value)
    diagram = parseStructCode(sourcecode.value);
  else
    diagram = parseStructCode(sourcecode.textContent);
  while(viewer.children.length>0)
    viewer.removeChild(viewer.firstChild);
  viewer.appendChild(diagram);
  return viewer.firstElementChild;
}
function generateStructureView(diagram, xmlviewid){
  let xdoc = document.implementation.createDocument(
          "https://nigjo.github.io/structogramview/", "", null);
  let copy = diagram.cloneNode(true);
  xdoc.appendChild(copy);
  var xmllines = new XMLSerializer().serializeToString(xdoc)
          .replace(/ xmlns=([\"])[^\"]+[\"]/, "")
          .replace(/>(?=<)/g, '>\n')
          .split('\n');
  var indended = '';
  var indent = '';
  for(var l in xmllines){
    if(xmllines[l].indexOf('</')>=0){
      if(xmllines[l].indexOf('<struct-')<0)
        indent = indent.substr(2);
      indended+=indent+xmllines[l]+'\n';
    }else{
      indended+=indent+xmllines[l]+'\n';
      indent+='  ';
    }
  }
  document.getElementById(xmlviewid).textContent = indended.replace(/<(\/)?struct-/g,'<$1');
}
function updateView(structview){
  var codeid = structview.dataset.structcodeId;
  var sourcecode = document.querySelector('#'+codeid);
  var erroritem = sourcecode.parentNode;
  if(sourcecode.dataset.erroritem){
    erroritem = document.getElementById(sourcecode.dataset.erroritem);
  }
  try{
    erroritem.dataset.parsererror = '';
    var diagram = generateDiagram(structview);
    generateStructureView(diagram, structview.dataset.structcodeXml);
    let svggen = new SVGGenerator();
    svggen.generateDownloadImage(diagram, structview);
    var uscompact = document.getElementById('usecompactselect');
    if(uscompact && uscompact.checked){
      diagram.classList.add('compactselect');
    }
  }catch(e){
    console.warn('parser:', e);
    if(e instanceof StructCodeParseException){
      erroritem.dataset.parsererror = e.toString();
    }
  }
  hightlightText(sourcecode);
}

function hightlightText(sourcecode){
  //console.log(sourcecode);
  if(sourcecode.dataset.marks){
    let marker=document.getElementById(sourcecode.dataset.marks);
    //console.log(marker);
    let content = sourcecode.value;
    marker.textContent='';
    const Commands = /^(\s*)([A-Z]+:)(.*)$/;
    for(let line of content.split('\n')){
      let parts = line.match(Commands);
      //console.log(line,parts);
      if(parts){
        marker.append(parts[1]);
        let mark = document.createElement('SPAN');
        mark.className='mark';
        mark.textContent = parts[2];
        marker.append(mark);
        marker.append(parts[3]+'\n');
      }else{
        //console.log(line);
        marker.append(line+'\n');
      }
    }
    //marker.textContent = content;
  }

  // let copy = sourcecode.cloneNode(false);
  // copy.selectionStart = sourcecode.selectionStart;
  // copy.selectionEnd = sourcecode.selectionEnd;


  //sourcecode.replaceWith(copy);
}

function generateViews(){
  var allCodes = document.querySelectorAll('.structcode');
  for(var i=0;i<allCodes.length;i++){
    if(allCodes[i].dataset.marks){
      let marker = document.getElementById(allCodes[i].dataset.marks);
      if(marker){
        allCodes[i].addEventListener('scroll',(evt)=>{
          //console.log(marker, evt);
          let mstyle=getComputedStyle(marker);
          marker.style.top =
              -evt.target.scrollTop
              +parseInt(mstyle.insetInlineStart);
        });
      }
    }
  }
  var allViews = document.querySelectorAll('.structview');
  for(var i=0;i<allViews.length;i++){
    updateView(allViews[i]);
  }


}
window.addEventListener('DOMContentLoaded', generateViews);

function updateContent(ta, keyevent){
  var sourceid = typeof ta === 'string'?ta:ta.id;
  var viewer = document.querySelector('.structview[data-structcode-id="'+sourceid+'"]');
  updateView(viewer);
}
function checkCurrentContent(ta, e){
  clearTimeout(window.nextUpdate);
  window.nextUpdate = setTimeout(function(){updateContent(ta, e)}, 500);
  hightlightText(e.target);
}

function parseStructCode(structCode){
  var stack = [new StructDiagram()];

  var lastlineindex;
  var lines = structCode.split('\n');

  function checkBlock(blockname){
    var stackblock=stack[0].getName();
    if(stack[0] instanceof StructBlock){
      stackblock=stack[1].getName();
    }
    if(stackblock!==blockname){
      throw 'illegal end of block. Expecting END'+ stackblock+':';
    }
  }
  function checkEmptyBlock(block){
    if(block.children.length===0){
      block.appendChild(new StructSequence());//.textContent=' ';
    }
  }

  for(var i=0;i<lines.length;i++){
    try{
      var trimmed = lines[i].trim();
      if(trimmed.length===0)
        continue;
      lastlineindex = i;
      if (trimmed.startsWith('#')) {
        let comment = trimmed.substr(1).trim();
        if (comment.length > 0) {
          if (!(stack[0].lastElementChild instanceof StructComment)) {
            stack[0].appendChild(new StructComment());
          }
          stack[0].lastElementChild.addComment(comment);
        }
      }else if(trimmed.startsWith('CAPTION:')){
        stack[0].caption = trimmed.substr(8).trim();
      }else if(trimmed.startsWith('IF:')){
        var item = new StructDecision();
        item.condition = trimmed.substr(3).trim();
        stack.unshift(item);
        stack.unshift(item.thenBlock);
      }else if(trimmed.startsWith('ELSE:')){
        var block = stack.shift();
        stack.unshift(stack[0].elseBlock);
      }else if(trimmed.startsWith('ENDIF:')){
        checkBlock('IF');
        var block = stack.shift();
        var item = stack.shift();
        checkEmptyBlock(item.elseBlock);
        stack[0].appendChild(item);
      }else if(trimmed.startsWith('SELECT:')){
        var item = new StructChoose();
        item.condition = trimmed.substr(7).trim();
        stack.unshift(item);
      }else if(trimmed.startsWith('CASE:')){
        var item = stack[0];
        if(item instanceof StructBlock){
          var prevcase = stack.shift();
          checkEmptyBlock(prevcase);
        }
        var block = stack[0].createNextCase();
        block.condition = trimmed.substr(5).trim();
        stack.unshift(block);
      }else if(trimmed.startsWith('DEFAULT:')){
        var item = stack[0];
        if(item instanceof StructBlock){
          var prevcase = stack.shift();
          checkEmptyBlock(prevcase);
        }
        stack.unshift(stack[0].defaultBlock);
      }else if(trimmed.startsWith('ENDSELECT:')){
        checkBlock('SELECT');
        var item = stack[0];
        if(item instanceof StructBlock){
          var prevcase = stack.shift();
          checkEmptyBlock(prevcase);
        }
        var item = stack.shift();
        checkEmptyBlock(item.defaultBlock);
        stack[0].appendChild(item);
      }else if(trimmed.startsWith('FOR:')){
        var item = new StructIteration();
        item.condition = trimmed.substr(4).trim();
        stack.unshift(item);
        stack.unshift(item.loopBlock);
      }else if(trimmed.startsWith('ENDFOR:')){
        checkBlock('FOR');
        var block = stack.shift();
        var item = stack.shift();
        checkEmptyBlock(item.loopBlock);
        stack[0].appendChild(item);
      }else if(trimmed.startsWith('LOOP:')){
        var item;
        if(trimmed!=='LOOP:'){
          item = new StructIteration();
          item.condition = trimmed.substr(5).trim();
        }else{
          item = new StructLoop();
        }
        stack.unshift(item);
        stack.unshift(item.loopBlock);
      }else if(trimmed.startsWith('ENDLOOP:')){
        checkBlock('LOOP');
        var block = stack.shift();
        var item = stack.shift();
        if(item instanceof StructLoop && trimmed!=='ENDLOOP:'){
          item.condition = trimmed.substr(8).trim();
        }
        checkEmptyBlock(item.loopBlock);
        stack[0].appendChild(item);
      } else if(trimmed.startsWith('CALL:')) {
        stack[0].appendChild(new StructCall()).textContent = trimmed.substr(5).trim();
      } else if(trimmed.startsWith('BREAK:')) {
        stack[0].appendChild(new StructBreak()).textContent = trimmed.substr(6).trim();
      } else if(trimmed.startsWith('RETURN:')) {
        stack[0].appendChild(new StructBreak()).textContent = trimmed.substr(7).trim();
      } else if(trimmed.startsWith('CONCURRENT:')) {
        var item = new StructConcurrent();
        //item.condition = trimmed.substr(7).trim();
        stack.unshift(item);
      } else if(trimmed.startsWith('THREAD:')) {
        var item = stack[0];
        if(item instanceof StructBlock){
          var prevcase = stack.shift();
          checkEmptyBlock(prevcase);
        }
        var block = stack[0].createThread();
        stack.unshift(block);
      } else if(trimmed.startsWith('ENDCONCURRENT:')) {
        checkBlock('CONCURRENT');
        var item = stack[0];
        if(item instanceof StructBlock){
          var prevcase = stack.shift();
          checkEmptyBlock(prevcase);
        }
        var item = stack.shift();
        //checkEmptyBlock(item.defaultBlock);
        stack[0].appendChild(item);
      } else {
        stack[0].appendChild(new StructSequence()).textContent = trimmed;
      }
    }catch(e){
      throw new StructCodeParseException(i, lines[i], e);
    }
  }
  if(stack.length!==1){
    var blockname=stack[0].getName();
    if(stack[0] instanceof StructBlock){
      blockname=stack[1].getName();
    }
    throw new StructCodeParseException(lastlineindex,lines[lastlineindex],
    'illegal stack size. Expecting END'+ blockname+':');
  }

  return stack.shift();
}
