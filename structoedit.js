function generateDiagram(viewer){
  var codeid = viewer.dataset.structcodeId;
  var sourcecode = document.querySelector('#'+codeid);
  var diagram;
  if(sourcecode.value)
    diagram = StructDiagram.parseStructCode(sourcecode.value);
  else
    diagram = StructDiagram.parseStructCode(sourcecode.textContent);
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
}
