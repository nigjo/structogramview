/* global StructSequence, URL, StructContainer, StructDiagram, StructDecision, StructChoose, StructBlock */

function downloadSvg(event) {
  event.preventDefault();
  console.log(SVGGenerator.SVGLOGGER, event);
  let dlLink = document.createElement("a")
  dlLink.style.display = "none";
  let svg = document.querySelector("#imageview svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  var file = new Blob([svg.outerHTML], {type: "application/svg"});
  var data = URL.createObjectURL(file);
  dlLink.href = data;
  dlLink.download = "diagram.svg";
  dlLink.click();
  setTimeout(function () {
    dlLink.remove();
    window.URL.revokeObjectURL(data);
  }, 0);
  return false;
}

class SVGGenerator {
  static SVGLOGGER = "svgimage";
  static SVGNS = "http://www.w3.org/2000/svg";

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

  addText(container, structElement, x, y) {
    let text = document.createElementNS(SVGGenerator.SVGNS, "text");
    text.setAttribute("x", x);
    text.setAttribute("y", y);
    text.append(structElement.textContent);
    container.appendChild(text);
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


    } else if (structElement instanceof StructSequence) {
      //let textHeight = cRect.height / 1.5;
      this.addText(group, structElement,
              this.textHeight * .20, this.textHeight * 1.4);
    } else if (structElement instanceof StructChoose) {
      console.log(structElement.lastChild);
      let ebRect = structElement.lastChild.getBoundingClientRect();
      this.addBorder(group, "", 0, 0, ebRect.left - cRect.left, ebRect.top - cRect.top);
      this.addBorder(group, "",
              ebRect.left - cRect.left, ebRect.top - cRect.top,
              cRect.width, 0);
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

  generateDownloadImage(diagram, svgImageId) {
    let bounding = diagram.getBoundingClientRect();

    let org = document.getElementById(svgImageId);
    let orgsvg = org.querySelector("svg");
    let orgstyles = orgsvg.querySelector("style");

    this.textHeight = parseFloat(getComputedStyle(diagram, null)
            .getPropertyValue("font-size"));

    //<svg xmlns="http://www.w3.org/2000/svg"></svg>
    let svg = orgsvg.cloneNode();
    svg.setAttribute("width", bounding.width);
    svg.setAttribute("height", bounding.height);

    let svgstyles = orgstyles.cloneNode(true);
    //the "first child" is the original css text
    svgstyles.textContent = svgstyles.firstChild.textContent;
    svgstyles.append("svg{font-size:" + this.textHeight + "px}");
    console.log(svgstyles);
    svg.appendChild(svgstyles);

    //console.log(SVGGenerator.SVGLOGGER,bounding,
    //    diagram.offsetLeft,diagram.offsetTop);
    this.addStructure(svg, diagram, bounding.left, bounding.top);

    orgsvg.replaceWith(svg);
  }

}
