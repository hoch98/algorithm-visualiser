var canvas = document.getElementById("canvas")
var nodeSlider = document.getElementById("nodes");
var numOfNodes = 5;
var nodes = [];
var edges = []
var dragging = false;
var selectedNode = undefined;
var selectedEdge = undefined;

var lineCanvas = document.querySelector('canvas');
var context = lineCanvas.getContext('2d');
fitToContainer();

function deselectNode() {
  if (selectedNode) {
    selectedNode.classList.remove("selected");
    selectedNode = undefined;
  }
}

function deselectEdge() {
  if (selectedNode) {
    selectedEdge = undefined;
    drawEdges();
  }
}

function fitToContainer(){
  lineCanvas.width  = lineCanvas.offsetWidth;
  lineCanvas.height = lineCanvas.offsetHeight;
  drawEdges();
}

window.onresize = fitToContainer

function elementsFromPoint(x, y) { // pointer-events: none;
  const elements = nodes;
  var elementsList = Array.prototype.slice.call(elements);

  var results = []
  elementsList.forEach(element => {
      var rect = element.getBoundingClientRect();

      if (rect.left < x && x < rect.right && rect.top < y && y < rect.bottom) {
          results.push(element)
      }
  });
  return results;
}

function isOverlapping(x, y) {
  var xBounds = [x-25, x+25];
  var yBounds = [y-25, y+25];
  for (var i = 0; i < nodes.length; i++) {
    var check = nodes[i];
    var rect2 = check.getBoundingClientRect();
    var xCheckBounds = [rect2.x-25, rect2.x+25];
    var yCheckBounds = [rect2.y-25, rect2.y+25];
    var overlapping = (xBounds[1] >= xCheckBounds[0] && xCheckBounds[1] >= xBounds[0]) && (yBounds[1] >= yCheckBounds[0] && yCheckBounds[1] >= yBounds[0])
    if (overlapping) {
      return true;
    }
  }
  return false;
}

function getRandomCoords() {
  return{x: Math.floor(Math.random() * 500), y: Math.floor(Math.random() * 500)};
}

function createNode(text) {
  var circle = document.createElement("div");

  var pos = getRandomCoords();

  while (isOverlapping(pos.x, pos.y)) {
    pos = getRandomCoords();
  }

  circle.classList.add("node")
  circle.style.position = "absolute";
  circle.style.left = pos.x+"px";
  circle.style.top = pos.y+"px";

  circle.textContent = text
  return circle
}

function drawEdges() {
  context.clearRect(0, 0, lineCanvas.width, lineCanvas.height);
  edges.forEach((edge) => {
    var bound1 = nodes[edge[0]].getBoundingClientRect();
    var bound2 = nodes[edge[1]].getBoundingClientRect();
    
    context.beginPath();
    context.lineWidth = 2;
    context.strokeStyle = "black";
    if (selectedEdge == edge) {
      context.strokeStyle = "red";
      context.lineWidth = 4;
    }
    context.moveTo(bound1.x+25, bound1.y+25);
    context.lineTo(bound2.x+25, bound2.y+25);
    context.stroke();
  })
}


function generateNodes(n) {
  nodes = []
  edges = []
  canvas.innerHTML = ""
  for (var i = 0; i < n; i++) {
    var node = createNode(i);
    nodes.push(node);
    canvas.appendChild(node);
    node.onpointerdown = (event) => {
      dragging = elementsFromPoint(event.clientX, event.clientY)[0];
      deselectNode();
      
      if (selectedNode !== dragging) {
        selectedNode = dragging;
        selectedNode.classList.add("selected");
        deselectEdge();
      }
    }
    for (var k = 0; k < nodes.length-1; k++) {
      var edge = [i, k];
      edges.push(edge);
    }
  }
  drawEdges();
}

lineCanvas.onpointerdown = (event) => {
  deselectNode();

  var mouse = {
    x: event.clientX,
    y: event.clientY
  }

  for (var i = 0; i < edges.length; i++) {
    var edge = edges[i]
    var bound1 = nodes[edge[0]].getBoundingClientRect();
    var bound2 = nodes[edge[1]].getBoundingClientRect();

    context.beginPath();
    context.lineWidth = 10
    context.moveTo(bound1.x+25, bound1.y+25);
    context.lineTo(bound2.x+25, bound2.y+25);

    if (context.isPointInStroke(mouse.x, mouse.y)) {
      selectedEdge = edge
      deselectNode();
      context.lineWidth = 2
      drawEdges();
      break;
    }
  }
}

window.onpointermove = (event) => {
  if (dragging) {
    dragging.style.left = (event.clientX-25)+"px";
    dragging.style.top = (event.clientY-25)+"px";
    drawEdges();
  }
}
window.onpointerup = () => {
  dragging = undefined;
}

nodeSlider.oninput = () => {
  numOfNodes = document.getElementById("nodes").value;
  document.getElementById("numOfNodes").textContent = numOfNodes;
  generateNodes(numOfNodes);
}

generateNodes(3);