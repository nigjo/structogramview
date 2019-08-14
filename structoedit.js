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
  return diagram;
}
function generateStructureView(diagram, xmlviewid){
//data-structcode-xml
  var xmllines = diagram.outerHTML
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
  var erroritem = sourcecode.parentNode.lastElementChild;
  try{
    erroritem.dataset.parsererror = '';
    var diagram = generateDiagram(structview);
    generateStructureView(diagram, structview.dataset.structcodeXml);
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
}
function generateViews(){
  //document.body.style.
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
