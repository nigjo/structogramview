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
    let svggen = new SVGGenerator();
    svggen.generateDownloadImage(diagram, structview.dataset.structcodeSvg);
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

class SVGGenerator{
  static SVGLOGGER="svgimage";
  static SVGNS="http://www.w3.org/2000/svg";
  
  addBorder(group,styleVal,x1,y1,x2,y2){
    if(styleVal!=='0px'){
      let br = document.createElementNS(SVGGenerator.SVGNS, "line");
      br.setAttribute("x1", x1);br.setAttribute("y1", y1);
      br.setAttribute("x2", x2);br.setAttribute("y2", y2);      
      group.appendChild(br);
    }
  }

  addStructure(container, structElement, offsetx,offsety){
    let group = document.createElementNS(SVGGenerator.SVGNS, "g");
    group.setAttribute("class", structElement.nodeName.toLowerCase());
    let cRect = structElement.getBoundingClientRect();
    group.setAttribute("transform",
        "translate("+(cRect.left-offsetx)+","+(cRect.top-offsety)+")");

    if(structElement instanceof StructSequence
        ||structElement instanceof StructContainer
        ||structElement instanceof StructDiagram){
      let rect = document.createElementNS(SVGGenerator.SVGNS, "rect");
      rect.setAttribute("width", cRect.width);
      rect.setAttribute("height", cRect.height);
      group.appendChild(rect);
      //console.log(SVGGenerator.SVGLOGGER, structElement);
    }
    
    let style=getComputedStyle(structElement);
    //console.log(SVGGenerator.SVGLOGGER, style);
    this.addBorder(group, style.borderRightWidth, cRect.width, 0, cRect.width, cRect.height);
    this.addBorder(group, style.borderLeftWidth, 0, 0, 0, cRect.height);
    this.addBorder(group, style.borderTopWidth, 0, 0, cRect.width, 0);
    this.addBorder(group, style.borderBottomWidth, 0, cRect.height, cRect.width, cRect.height);

    if(structElement instanceof StructDecision){
      let tbRect=structElement.thenBlock.getBoundingClientRect();
      this.addBorder(group,"",0,0,tbRect.width,tbRect.top-cRect.top);
      this.addBorder(group,"",tbRect.width,tbRect.top-cRect.top,cRect.width,0);
    }
    
    if(structElement instanceof StructSequence){
      let text = document.createElementNS(SVGGenerator.SVGNS, "text");
      let textHeight=cRect.height/1.5;
      text.setAttribute("x",textHeight*.20);
      text.setAttribute("y", textHeight);
      text.append(structElement.textContent);
      group.appendChild(text);
    }
    
    if(structElement instanceof StructContainer
        ||structElement instanceof StructBlock
        ||structElement instanceof StructDiagram){
      //TODO: Kindelemente auch
      for(let i=0;i<structElement.children.length;i++){
        this.addStructure(group, structElement.children[i],
          cRect.left, cRect.top);
      }
    }

    container.appendChild(group);
  }

  generateDownloadImage(diagram, svgImageId){
    let bounding = diagram.getBoundingClientRect();

    let org = document.getElementById(svgImageId);
    let orgsvg = org.querySelector("svg");
    let orgstyles = orgsvg.querySelector("style");

    //<svg xmlns="http://www.w3.org/2000/svg"></svg>
    let svg = document.createElementNS(SVGGenerator.SVGNS, "svg");
    svg.setAttribute("width", bounding.width);
    svg.setAttribute("height", bounding.height);

    svg.appendChild(orgstyles.cloneNode(true));

    //console.log(SVGGenerator.SVGLOGGER,bounding,
    //    diagram.offsetLeft,diagram.offsetTop);
    this.addStructure(svg, diagram, bounding.left, bounding.top);

    let next = org.cloneNode(false);
    orgsvg.replaceWith(svg);
  }

}