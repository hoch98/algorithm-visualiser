var canvas = document.getElementById("canvas");
var edgeSettings = document.getElementById("edges");
var algorithmSelector = document.getElementById("algorithmSelector")
var nodes = [];
var neighbours = [];
var edges = [];
var quadraticEdges = [];
var visited = [];
var dragging = false;
var selectedNode = undefined;
var selectedEdge = undefined;

var algorithms = {
  "dfs": dfs,
  "bfs": bfs
}

var lineCanvas = document.querySelector('canvas');
var context = lineCanvas.getContext('2d');
fitToContainer();

function isNumeric(str) {
  if (typeof str != "string") return false // we only process strings!  
  return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
         !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

function selectNode(node) {
  deselectNodes();
  selectedNode = node;
  selectedNode.classList.add("selected");
  deselectEdges();
}

function selectEdge(edge) {
  selectedEdge = edge;
  context.lineWidth = 2;
  deselectNodes();
  drawEdges();
}

function deselectNodes() {
  if (selectedNode) {
    selectedNode.classList.remove("selected");
    selectedNode = undefined;
  }
}

function deselectEdges() {
  if (selectedEdge) {
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

function addEdge(edge) {
  neighbours[edge[0]].push(edge[1])
  neighbours[edge[1]].push(edge[0])

  edges.push([edge[0], edge[1]])
}
function updateEdges() {
  neighbours = []
  for (var i = 0; i < nodes.length; i++) {
    neighbours.push([])
  }
  edges = []
  for (var i = 0; i < edgeSettings.children.length; i++) {
    var child = edgeSettings.children[i];
    var inputs = child.querySelectorAll("input")
    
    if (inputs[0].value == "") {
      inputs[0].value = "0"
    } if (inputs[1].value == "") {
      inputs[1].value = "0"
    }
    
    addEdge([parseInt(inputs[0].value), parseInt(inputs[1].value)])
  }
  drawEdges();
}

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
  drawQuadraticEdges();
}

function distance(p1, p2) {
  return Math.sqrt(Math.pow(p1.x-p2.x, 2)+Math.pow(p1.y-p2.y, 2))
}

function drawArrowhead(locx, locy, angle, sizex, sizey) {
  var hx = sizex / 2;
  var hy = sizey / 2;

  context.translate((locx ), (locy));
  context.rotate(angle);
  context.translate(-hx,-hy);

  context.beginPath();
  context.moveTo(0,0);
  context.lineTo(0,1*sizey);    
  context.lineTo(1*sizex,1*hy);
  context.closePath();
  context.fill();

  context.translate(hx,hy);
  context.rotate(-angle);
  context.translate(-locx,-locy);
}        

// returns radians
function findAngle(sx, sy, ex, ey) {
  return Math.atan2((ey - sy), (ex - sx));
}

function drawQuadraticEdges() {
  quadraticEdges.forEach((edge) => {
    var point1 = nodes[edge[0]].getBoundingClientRect();
    var point2 = nodes[edge[1]].getBoundingClientRect();
    point1 = {x: point1.x+25, y: point1.y+25};
    point2 = {x: point2.x+25, y: point2.y+25};
    var orientation = 1;
    if (point1.x >= point2.x) {
      orientation = -orientation;
    }

    var angle = Math.atan((point1.y-point2.y)/(point1.x-point2.x));
    var angleOffset = Math.PI/4
    var startPoint = {x: point1.x+25*orientation*Math.cos(angle-angleOffset), y: point1.y+25*orientation*Math.sin(angle-angleOffset)}
    var endPoint = {x: point2.x+35*-orientation*Math.cos(angle+angleOffset), y: point2.y+35*-orientation*Math.sin(angle+angleOffset)}
    
    var orientation = -1;
    if (startPoint.x >= endPoint.x) {
      orientation = -orientation;
    }

    var offsetHeight = distance(point1, point2)/4;

    var center = {x: (startPoint.x+endPoint.x)/2, y: (startPoint.y+endPoint.y)/2};
    var angle = Math.atan((startPoint.y-endPoint.y)/(startPoint.x-endPoint.x));
    var point3 = {x: center.x+offsetHeight*orientation*Math.cos(angle+Math.PI/2), y: center.y+offsetHeight*orientation*Math.sin(angle+Math.PI/2)}

    context.beginPath();
    context.lineWidth = 2;
    context.moveTo(startPoint.x, startPoint.y);
    context.quadraticCurveTo(point3.x, point3.y, endPoint.x, endPoint.y)
    context.stroke();

    var angle = findAngle(point3.x, point3.y, endPoint.x, endPoint.y);
    context.fillRect(endPoint.x, endPoint.y, 2, 2);
    drawArrowhead(endPoint.x, endPoint.y, angle, 12, 12);
  })
}


function generateNodes(n, nodeEdges=[]) {
  nodes = []
  edges = []
  canvas.innerHTML = ""
  for (var i = 0; i < n; i++) {
    var node = createNode(i);
    nodes.push(node);
    canvas.appendChild(node);
    node.onpointerdown = (event) => {
      dragging = elementsFromPoint(event.clientX, event.clientY)[0];

      deselectNodes();
      
      if (selectedNode !== dragging) {
        selectNode(dragging);
      }
    }
  }
  neighbours = []
  for (var i = 0; i < nodes.length; i++) {
    neighbours.push([])
  }

  nodeEdges.forEach((edge) => {
    addEdge(edge);
  })
  drawEdges();
}

lineCanvas.onpointerdown = (event) => {
  deselectEdges();
  deselectNodes();

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
      selectEdge(edge);
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

edgeSettings.oninput = updateEdges

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createEdgeContainer(a=0, b=0) {
  var edgeInputContainer = document.createElement("div");
  edgeInputContainer.classList.add("edgeInputContainer");

  var horLine = document.createElement("div");
  horLine.classList.add("hor-line");

  var nodeInput = document.createElement("div");
  nodeInput.classList.add("node");
  
  var nodeIdInput = document.createElement("input");
  nodeIdInput.type = "number";
  nodeIdInput.classList.add("nodeIdInput");
  nodeIdInput.setAttribute("min", 0);
  nodeIdInput.setAttribute("max", nodes.length-1);
  nodeIdInput.value = a+""
  nodeIdInput.required = true

  nodeInput.appendChild(nodeIdInput)

  var nodeInput2 = nodeInput.cloneNode(true);
  nodeInput2.firstChild.value = b+""

  var deleteButton = document.createElement("button");
  deleteButton.classList.add("deleteButton")
  deleteButton.innerText = "X"
  deleteButton.style.display = "inline-flex"

  deleteButton.onclick = () => {
    deleteButton.parentElement.parentElement.removeChild(deleteButton.parentElement);
    updateEdges();
  }

  edgeInputContainer.appendChild(nodeInput);
  edgeInputContainer.appendChild(horLine);
  edgeInputContainer.appendChild(nodeInput2);

  edgeInputContainer.appendChild(deleteButton)

  edgeSettings.appendChild(edgeInputContainer)
}

document.getElementById("createEdgeContainer").onclick = createEdgeContainer;

async function dfs(node) {
  var neighbour = neighbours[node];
  nodes[node].classList.add("visited")
  visited.push(node)
  selectNode(nodes[node])
  await sleep(1000)
  for (var i = 0; i < neighbour.length; i++) {
    var n = neighbour[i];
    if (!visited.includes(n)) {
      await dfs(n);
      quadraticEdges.push([n, node])
      drawQuadraticEdges();
      selectNode(nodes[node])
      await sleep(1000);
    }
  }
  deselectNodes();
}

async function bfs() {

}

function reset(ignoreNode=false) {
  if (!ignoreNode) {
    deselectNodes();
  }
  quadraticEdges = []
  visited  = []
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].classList.contains("visited")) {
      nodes[i].classList.remove("visited");
    }
  }
  drawEdges();
}

document.getElementById("importEdges").onclick = () => {
  $( '#edgeInputDialog' ).dialog({
    resizable: true,
    height: 500,
    width: 200,
    modal: true,
    buttons: {
      "Import": function() {
        var lines = document.getElementById("edgeInput").value.split("\n");
        var ed = 0
        edges = []
        deselectEdges();
        edgeSettings.innerHTML = ""
        lines.forEach((line) => {
          var valid = true;
          var split = line.split(" ");
          if (split.length != 2) {
            valid = false;
          } if (!isNumeric(split[0]) || !isNumeric(split[1])) {
            valid = false;
          }
          ;
          if (valid) {
            var parsedSplit = [parseInt(split[0]), parseInt(split[1])]
            addEdge(parsedSplit);
            createEdgeContainer(parsedSplit[0], parsedSplit[1]);
            ed++
          }
        })
        drawEdges()
        $( this ).dialog( "close" );
        if (ed != lines.length) {
          alert("partially invalid edges, only imported valid ones")
        }
      }
    }
  });
}

document.getElementById("loopSwitch").onclick = () => {
  if (selectedNode) {
    var selection = algorithmSelector.value;
    reset(true);
    if (selection == "dfs") {
      algorithms["dfs"](nodes.indexOf(selectedNode))
    }
  } else {
    alert("Select a starting node")
  }
}
generateNodes(5, []);