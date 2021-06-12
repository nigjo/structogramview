/* global StructSequence, URL, StructContainer, StructDiagram, StructDecision, StructChoose, StructBlock */

function downloadSvg(event) {
  event.preventDefault();
  let dlLink = document.createElement("a");
  dlLink.style.display = "none";
  let svg = document.querySelector("#imageview svg");
  //svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  let resultDoc = document.implementation.createDocument(
          SVGGenerator.SVGNS, "svg");
  [...svg.attributes].forEach(attr => {
    resultDoc.firstChild.setAttribute(attr.nodeName, attr.nodeValue);
  });
  for (let child of svg.children) {
    console.log(child);
    resultDoc.firstChild.append(child.cloneNode(true));
  }
  if (svg.dataset.structcodeId) {
    var codeid = svg.dataset.structcodeId;
    var sourcecode = document.querySelector('#' + codeid);
    var sourceText;
    if (sourcecode.value)
      sourceText = sourcecode.value;
    else
      sourceText = sourcecode.textContent;
    let metadata = resultDoc.querySelector("metadata");
    if (!metadata) {
      metadata = resultDoc.createElementNS(SVGGenerator.SVGNS, "metadata");
      metadata.append("\n");
      resultDoc.firstChild.insertBefore(metadata, resultDoc.firstChild.firstChild);
    }
    let sourcecopy = resultDoc.createElementNS(SVGGenerator.SELFNS, "structo:source");
    //sourcecopy.setAttribute("xmlns:structo", SVGGenerator.SELFNS);
    sourcecopy.append(resultDoc.createCDATASection(sourceText));
    metadata.append(sourcecopy, "\n");
  }
  var serializer = new XMLSerializer();
  var xmlString = serializer.serializeToString(resultDoc);
  var file = new Blob([xmlString], {type: "application/svg"});
  var data = URL.createObjectURL(file);
  dlLink.href = data;
  dlLink.download = "diagram.svg";
  dlLink.click();
  console.log(SVGGenerator.SVGLOGGER, "download svg");
  setTimeout(function () {
    dlLink.remove();
    window.URL.revokeObjectURL(data);
  }, 0);
  return false;
}

class SVGGenerator {
  static SVGLOGGER = "svgimage";
  static SVGNS = "http://www.w3.org/2000/svg";
  static SELFNS = "https://nigjo.github.io/structogramview/";

  addBorder(group, styleVal, x1, y1, x2, y2) {
    if (styleVal !== '0px') {
      let br = document.createElementNS(SVGGenerator.SVGNS, "line");
      br.setAttribute("x1", x1);
      br.setAttribute("y1", y1);
      br.setAttribute("x2", x2);
      br.setAttribute("y2", y2);
      group.appendChild(br);
    }
  }

  addText(container, structElement, attribute = null, before = false) {
    let dx = 0;
    //*for (let i = 0; i < structElement.childNodes.length; i++)*/ {
    let child = attribute
            ? structElement.getAttributeNode(attribute)
            : structElement.childNodes[0];
    //console.log(attribute, child);
    if (child instanceof Text) {
      if (child.wholeText.trim().length === 0) {
        return undefined;
      }
    } else if (child instanceof Attr) {
      if (child.value.trim().length === 0) {
        return undefined;
      }
    } else {
      return undefined;
    }
    structElement.style.position = "relative";
    let textContent = attribute ? child.value : child.wholeText;
    let cstyle = getComputedStyle(structElement, null);
    let sx = parseFloat(cstyle.marginLeft.replace("px", ""))
            + parseFloat(cstyle.paddingLeft.replace("px", ""));
    let sy = parseFloat(cstyle.marginTop.replace("px", ""))
            + parseFloat(cstyle.paddingTop.replace("px", ""));
    if (attribute) {
      let astyle = getComputedStyle(structElement,
              (before ? ":before" : ":after"));
      if (astyle.position === "absolute") {
        sx = sy = 0;
      }
      sx += parseFloat(astyle.marginLeft.replace("px", ""))
              + parseFloat(astyle.paddingLeft.replace("px", ""))
              + parseFloat(astyle.left.replace("px", ""));
      sy += parseFloat(astyle.marginTop.replace("px", ""))
              + parseFloat(astyle.paddingTop.replace("px", ""))
              + parseFloat(astyle.top.replace("px", ""));
    }

    let span = document.createElement("span");
    span.style.color = "red";
    span.style.display = "inline-block";
    span.style.position = "absolute";
    span.style.left = sx;
    span.style.top = sy;
    span.textContent = textContent;
    structElement.append(span);
    let textWidth = span.scrollWidth;
    let sstyle = getComputedStyle(structElement);
    let baseline = parseFloat(sstyle.fontSize.replace("px", ""));
    //console.log(textContent, cstyle, baseline);
    span.remove();

    let text = document.createElementNS(SVGGenerator.SVGNS, "text");
    text.setAttribute("x", sx);
    text.setAttribute("y", sy + baseline + 2);
    text.setAttribute("textLength", textWidth);
    text.append(textContent);
    container.appendChild(text);

    dx += textWidth;

    return text;
  }

  center(parent, text) {
    text.setAttribute("x", (parent.scrollWidth - text.getAttribute("textLength")) / 2);
  }

  addWhiteShadow(text) {
    text.after(text.cloneNode(true));
    text.style.fill = "none";
    text.style.stroke = "white";
    text.style.strokeWidth = "2px";
  }

  addStructure(container, structElement, offsetx, offsety) {
    let group = document.createElementNS(SVGGenerator.SVGNS, "g");
    group.setAttribute("class", structElement.nodeName.toLowerCase());
    let cRect = structElement.getBoundingClientRect();
    group.setAttribute("transform",
            "translate(" + (cRect.left - offsetx) + "," + (cRect.top - offsety) + ")");

    if (structElement instanceof StructSequence
            || structElement instanceof StructContainer
            || structElement instanceof StructDiagram) {
      let rect = document.createElementNS(SVGGenerator.SVGNS, "rect");
      rect.setAttribute("width", cRect.width);
      rect.setAttribute("height", cRect.height);
      group.appendChild(rect);
      //console.log(SVGGenerator.SVGLOGGER, structElement);
    }

    let style = getComputedStyle(structElement);
    //console.log(SVGGenerator.SVGLOGGER, style);
    this.addBorder(group, style.borderRightWidth, cRect.width, 0, cRect.width, cRect.height);
    this.addBorder(group, style.borderLeftWidth, 0, 0, 0, cRect.height);
    this.addBorder(group, style.borderTopWidth, 0, 0, cRect.width, 0);
    this.addBorder(group, style.borderBottomWidth, 0, cRect.height, cRect.width, cRect.height);

    if (structElement instanceof StructDecision) {
      let tbRect = structElement.thenBlock.getBoundingClientRect();
      this.addBorder(group, "", 0, 0, tbRect.width, tbRect.top - cRect.top);
      this.addBorder(group, "", tbRect.width, tbRect.top - cRect.top, cRect.width, 0);
      let t = this.addText(group, structElement, "condition");
      this.center(structElement, t);
      this.addWhiteShadow(t);
    } else if (structElement instanceof StructSequence) {
      //let textHeight = cRect.height / 1.5;
      this.addText(group, structElement);
    } else if (structElement instanceof StructChoose) {
      console.log(structElement.lastChild);
      let ebRect = structElement.lastChild.getBoundingClientRect();
      this.addBorder(group, "", 0, 0, ebRect.left - cRect.left, ebRect.top - cRect.top);
      this.addBorder(group, "",
              ebRect.left - cRect.left, ebRect.top - cRect.top,
              cRect.width, 0);
      let t = this.addText(group, structElement, "condition");
      this.center(structElement, t);
      this.addWhiteShadow(t);
    } else if (structElement instanceof StructIteration) {
      let t = this.addText(group, structElement, "condition", true);
    } else if (structElement instanceof StructLoop) {
      let t = this.addText(group, structElement, "condition");
      t.setAttribute("y", structElement.scrollHeight
              - this.lineHeight + this.textHeight);
    }

    if (structElement instanceof StructContainer
            || structElement instanceof StructBlock
            || structElement instanceof StructDiagram) {
      //TODO: Kindelemente auch
      for (let i = 0; i < structElement.children.length; i++) {
        this.addStructure(group, structElement.children[i],
                cRect.left, cRect.top);
      }
    }

    container.appendChild(group);
  }

  generateDownloadImage(diagram, viewer) {
    let bounding = diagram.getBoundingClientRect();

    let svgImageId = viewer.dataset.structcodeSvg;

    let org = document.getElementById(svgImageId);
    let orgsvg = org.querySelector("svg");
    let orgstyles = orgsvg.querySelector("style");

    let dstyles = getComputedStyle(diagram, null);
    this.textHeight = parseFloat(dstyles.getPropertyValue("font-size"));
    this.lineHeight = parseFloat(dstyles.getPropertyValue("line-height"));

    //<svg xmlns="http://www.w3.org/2000/svg"></svg>
    let svg = orgsvg.cloneNode();
    svg.setAttribute("width", bounding.width);
    svg.setAttribute("height", bounding.height);

    let svgstyles = orgstyles.cloneNode(true);
    //the "first child" is the original css text
    svgstyles.textContent = svgstyles.firstChild.textContent;
    svgstyles.append("svg{font-size:" + this.textHeight + "px}");
    svg.appendChild(svgstyles);

    //console.log(SVGGenerator.SVGLOGGER,bounding,
    //    diagram.offsetLeft,diagram.offsetTop);
    this.addStructure(svg, diagram, bounding.left, bounding.top);
    svg.dataset.structcodeId = viewer.dataset.structcodeId;
    orgsvg.replaceWith(svg);
  }

}
