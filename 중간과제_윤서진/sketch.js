// 뉴럴 마인드맵 데이터
let nodes = [];
let links = [];

// 카메라(뷰포트) 변수
let camX = 0;
let camY = 0;
let zoom = 1.0;
let isPanning = false;
let panStartX, panStartY;

// 인터랙션 상태 변수
let draggingNode = null;
let connectingNode = null;
let editingNode = null;
let textInput;

// 📱 모바일/아이패드 꾹 누르기(Long Press) 변수
let touchStartTime = 0;
let potentialConnectNode = null;

// 📱 아이패드 더블탭 감지용 타이머 변수
let lastTapTime = 0;
let lastTapX = 0;
let lastTapY = 0;

// ⚡ 흔들기(Shake) 감지용 변수
let shakeCount = 0;
let lastShakeDir = 0;

// 📄 상세 메모 모달 상태
let activeModalNode = null;
let isModalOpen = false;
let selectedModalColor = '#00ffff'; 

// 클릭 위치 저장 (단순 클릭 vs 드래그 구분)
let clickStartX = 0;
let clickStartY = 0;
let clickedNodeCandidate = null;

// 테마 색상 팔레트 목록
const colors = ['#00ffff', '#b026ff', '#ffd700', '#ff26a0', '#00ff66', '#ff4500', '#ffffff']; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  textInput = select('#node-input');
  
  // 브라우저 기본 우클릭 방지
  document.addEventListener('contextmenu', event => event.preventDefault());

  let savedData = localStorage.getItem('neuralMindMap');
  if (savedData) {
    let data = JSON.parse(savedData);
    nodes = data.nodes || [];
    links = data.links || [];
  } else {
    createNode(0, 0, "핵심 주제", "여기에 상세 회의 내용이나 아이디어 메모를 기재할 수 있습니다.");
  }

  textInput.elt.addEventListener('keydown', e => {
    if (e.key === 'Enter') finishEditing();
  });

  select('#detail-modal').elt.addEventListener('click', e => {
    if (e.target.id === 'detail-modal') closeDetailModal();
  });
}

function getWorldCoords(mx, my) {
  return {
    x: (mx - width / 2) / zoom - camX,
    y: (my - height / 2) / zoom - camY
  };
}

function createNode(wx, wy, defaultText = "새 아이디어", detailText = "") {
  let newNode = {
    id: Date.now() + Math.random(),
    x: wx,
    y: wy,
    text: defaultText,
    detailText: detailText,
    color: random(colors),
    pulseOffset: random(TWO_PI),
    dendrites: []
  };
  
  let branchCount = floor(random(5, 9));
  for(let i=0; i<branchCount; i++) {
    newNode.dendrites.push({
      angle: random(TWO_PI),
      length: random(30, 80),
      wiggle: random(0.5, 2)
    });
  }

  nodes.push(newNode);
  saveData();
  return newNode;
}

function saveData() {
  localStorage.setItem('neuralMindMap', JSON.stringify({ nodes: nodes, links: links }));
}

function renderColorPalette() {
  let paletteContainer = select('#color-palette');
  paletteContainer.html(''); 
  
  for (let col of colors) {
    let dot = createDiv('');
    dot.addClass('color-dot');
    dot.style('background-color', col);
    
    if (col.toLowerCase() === selectedModalColor.toLowerCase()) {
      dot.addClass('active');
    }

    dot.mousePressed(() => {
      selectedModalColor = col;
      renderColorPalette(); 
    });

    paletteContainer.child(dot);
  }
}

function openDetailModal(node) {
  activeModalNode = node;
  isModalOpen = true;
  selectedModalColor = node.color || colors[0];

  select('#detail-title').value(node.text || '');
  select('#detail-text').value(node.detailText || '');
  
  renderColorPalette(); 
  
  select('#detail-modal').style('display', 'flex');
  setTimeout(() => select('#detail-text').elt.focus(), 100);
}

function closeDetailModal() {
  select('#detail-modal').style('display', 'none');
  activeModalNode = null;
  isModalOpen = false;
}

function saveDetailModal() {
  if (activeModalNode) {
    let newTitle = select('#detail-title').value().trim();
    activeModalNode.text = newTitle || "새 아이디어";
    activeModalNode.detailText = select('#detail-text').value().trim();
    activeModalNode.color = selectedModalColor; 
    saveData();
  }
  closeDetailModal();
}

function draw() {
  background(5, 5, 10);

  push();
  translate(width / 2, height / 2);
  scale(zoom);
  translate(camX, camY);

  drawLinks();

  if (connectingNode) {
    let w = getWorldCoords(mouseX, mouseY);
    stroke(connectingNode.color);
    strokeWeight(2);
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = connectingNode.color;
    line(connectingNode.x, connectingNode.y, w.x, w.y);
    drawingContext.shadowBlur = 0;
  }

  drawNodes();

  if (potentialConnectNode && mouseIsPressed && !connectingNode) {
    if (millis() - touchStartTime > 400) { 
      connectingNode = potentialConnectNode; 
      draggingNode = null; 
      if (navigator.vibrate) navigator.vibrate(30); 
    }
  }
  pop();

  if (draggingNode) {
    drawTrashCircle();
  }

  if (editingNode) {
    let screenX = (editingNode.x + camX) * zoom + width / 2;
    let screenY = (editingNode.y + camY) * zoom + height / 2;
    textInput.position(screenX, screenY);
  }
}

function drawTrashCircle() {
  let trashX = width / 2;
  let trashY = height - 75;
  let baseRadius = 35;
  
  let d = dist(mouseX, mouseY, trashX, trashY);
  let isHoveringTrash = d < baseRadius + 15;

  push();
  if (isHoveringTrash) {
    let glowRadius = baseRadius + 10 + sin(frameCount * 0.2) * 3;
    
    drawingContext.shadowBlur = 35;
    drawingContext.shadowColor = 'rgba(255, 30, 60, 0.9)';
    fill(255, 30, 60, 230);
    stroke(255, 150, 160);
    strokeWeight(3);
    circle(trashX, trashY, glowRadius * 2);

    noStroke();
    fill(255);
    textAlign(CENTER, CENTER);
    textFont('Malgun Gothic');
    textSize(28);
    text("🗑️", trashX, trashY - 2);

    textSize(12);
    fill(255, 220, 220);
    text("삭제", trashX, trashY + 45);

  } else {
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = 'rgba(255, 50, 50, 0.4)';
    fill(25, 10, 15, 200);
    stroke(255, 70, 70, 180);
    strokeWeight(2);
    circle(trashX, trashY, baseRadius * 2);

    noStroke();
    fill(255, 180, 180, 220);
    textAlign(CENTER, CENTER);
    textFont('Malgun Gothic');
    textSize(24);
    text("🗑️", trashX, trashY);
  }
  drawingContext.shadowBlur = 0;
  pop();
}

function drawLinks() {
  for (let link of links) {
    let source = nodes.find(n => n.id === link.source);
    let target = nodes.find(n => n.id === link.target);
    if (!source || !target) continue;

    noFill();
    stroke(source.color);
    strokeWeight(1.5);
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = source.color;
    
    stroke(red(source.color), green(source.color), blue(source.color), 100);
    line(source.x, source.y, target.x, target.y);

    let flowSpeed = 0.005;
    let t = (frameCount * flowSpeed + link.source) % 1; 
    let px = lerp(source.x, target.x, t);
    let py = lerp(source.y, target.y, t);

    noStroke();
    fill(255);
    drawingContext.shadowBlur = 20;
    drawingContext.shadowColor = '#ffffff';
    circle(px, py, 4);
    
    drawingContext.shadowBlur = 0;
  }
}

function drawNodes() {
  for (let node of nodes) {
    let pulse = sin(frameCount * 0.05 + node.pulseOffset);
    let nodeRadius = 15 + pulse * 3;

    stroke(node.color);
    strokeWeight(1);
    noFill();
    for (let d of node.dendrites) {
      let endX = node.x + cos(d.angle) * d.length;
      let endY = node.y + sin(d.angle) * d.length;
      let midX = lerp(node.x, endX, 0.5) + cos(frameCount * 0.02 * d.wiggle) * 10;
      let midY = lerp(node.y, endY, 0.5) + sin(frameCount * 0.02 * d.wiggle) * 10;
      
      stroke(red(node.color), green(node.color), blue(node.color), 80);
      beginShape();
      vertex(node.x, node.y);
      quadraticVertex(midX, midY, endX, endY);
      endShape();
    }

    drawingContext.shadowBlur = 30 + pulse * 10;
    drawingContext.shadowColor = node.color;
    
    fill(10, 10, 20); 
    stroke(node.color);
    strokeWeight(3);
    circle(node.x, node.y, nodeRadius * 2);

    noStroke();
    fill(255, 255, 255, 200);
    drawingContext.shadowBlur = 10;
    circle(node.x, node.y, nodeRadius * 0.5);
    drawingContext.shadowBlur = 0;

    if (editingNode !== node) {
      fill(220, 220, 240);
      noStroke();
      textAlign(CENTER, CENTER);
      textFont('Malgun Gothic');
      textSize(14);
      
      let labelText = node.text || "새 아이디어";
      if (node.detailText && node.detailText.trim() !== "") {
        labelText += " 📄";
      }

      let txtW = textWidth(labelText) + 16;
      fill(0, 0, 0, 150);
      rect(node.x - txtW/2, node.y + nodeRadius + 10, txtW, 24, 12);

      fill(255);
      text(labelText, node.x, node.y + nodeRadius + 22);
    }
  }
}

function finishEditing() {
  if (editingNode) {
    editingNode.text = textInput.value() || "새 아이디어";
    editingNode = null;
    textInput.style('display', 'none');
    saveData();
  }
}

function mouseWheel(event) {
  if (isModalOpen) return;
  let zoomFactor = event.ctrlKey ? 0.01 : 0.001;
  zoom -= event.deltaY * zoomFactor;
  zoom = constrain(zoom, 0.2, 3.0);
  return false; 
}

function mousePressed() {
  if (isModalOpen) return;

  if (editingNode && mouseX > 0 && mouseY > 0) {
    finishEditing();
  }

  // 📱 [아이패드/모바일 호환] 터치 시간차(350ms)와 이동 거리를 계산하여 더블탭 감지
  let now = millis();
  let tapDist = dist(mouseX, mouseY, lastTapX, lastTapY);
  
  if (now - lastTapTime < 350 && tapDist < 30) {
    let w = getWorldCoords(mouseX, mouseY);
    let clickedNode = null;
    for (let node of nodes) {
      if (dist(w.x, w.y, node.x, node.y) < 25) {
        clickedNode = node;
        break;
      }
    }
    // 노드가 없는 빈 공간을 더블탭하면 바로 새 노드 생성 및 모달 열기!
    if (!clickedNode) {
      let newNode = createNode(w.x, w.y, "새 아이디어", "");
      openDetailModal(newNode);
      lastTapTime = 0;
      return false;
    }
  }
  lastTapTime = now;
  lastTapX = mouseX;
  lastTapY = mouseY;

  clickStartX = mouseX;
  clickStartY = mouseY;

  let w = getWorldCoords(mouseX, mouseY);
  let clickedNode = null;

  for (let i = nodes.length - 1; i >= 0; i--) {
    let node = nodes[i];
    if (dist(w.x, w.y, node.x, node.y) < 25) {
      clickedNode = node;
      break;
    }
  }

  if (clickedNode) {
    clickedNodeCandidate = clickedNode;
    if (mouseButton === RIGHT) {
      connectingNode = clickedNode; 
    } else {
      draggingNode = clickedNode;   
      potentialConnectNode = clickedNode; 
      touchStartTime = millis();
      shakeCount = 0; 
      lastShakeDir = 0;
    }
  } else {
    clickedNodeCandidate = null;
    if (mouseButton === LEFT) {
      isPanning = true;
      panStartX = mouseX;
      panStartY = mouseY;
    }
  }
}

function mouseDragged() {
  if (isModalOpen) return;

  if (potentialConnectNode && !connectingNode) {
    let d = dist(mouseX, mouseY, pmouseX, pmouseY);
    if (d > 5) potentialConnectNode = null; 
  }

  if (draggingNode) {
    let w = getWorldCoords(mouseX, mouseY);
    draggingNode.x = w.x;
    draggingNode.y = w.y;

    let dx = mouseX - pmouseX;
    if (abs(dx) > 4) { 
      let currentDir = Math.sign(dx);
      if (lastShakeDir !== 0 && currentDir !== lastShakeDir) {
        shakeCount++;
        if (shakeCount >= 4) {
          links = links.filter(l => l.source !== draggingNode.id && l.target !== draggingNode.id);
          shakeCount = 0; 
          if (navigator.vibrate) navigator.vibrate([50, 50, 50]); 
          saveData();
        }
      }
      lastShakeDir = currentDir;
    }

  } else if (isPanning && !connectingNode) {
    camX += (mouseX - panStartX) / zoom;
    camY += (mouseY - panStartY) / zoom;
    panStartX = mouseX;
    panStartY = mouseY;
  }
  return false;
}

function mouseReleased() {
  if (isModalOpen) return;

  let moveDist = dist(mouseX, mouseY, clickStartX, clickStartY);
  let trashX = width / 2;
  let trashY = height - 75;

  if (draggingNode && dist(mouseX, mouseY, trashX, trashY) < 50) {
    nodes = nodes.filter(n => n.id !== draggingNode.id);
    links = links.filter(l => l.source !== draggingNode.id && l.target !== draggingNode.id);
    if (navigator.vibrate) navigator.vibrate(100); 
    saveData();
  } 
  else if (clickedNodeCandidate && moveDist < 6 && !connectingNode && shakeCount === 0) {
    openDetailModal(clickedNodeCandidate);
  }

  if (connectingNode) {
    let w = getWorldCoords(mouseX, mouseY);
    let targetNode = null;
    for (let node of nodes) {
      if (node !== connectingNode && dist(w.x, w.y, node.x, node.y) < 30) {
        targetNode = node;
        break;
      }
    }

    if (targetNode) {
      let exists = links.find(l => 
        (l.source === connectingNode.id && l.target === targetNode.id) ||
        (l.source === targetNode.id && l.target === connectingNode.id)
      );
      if (!exists) {
        links.push({ source: connectingNode.id, target: targetNode.id });
        saveData();
      }
    }
    connectingNode = null;
  }

  clickedNodeCandidate = null;
  potentialConnectNode = null; 
  draggingNode = null;
  isPanning = false;
  shakeCount = 0; 
}

function doubleClicked() {
  if (isModalOpen) return;

  let w = getWorldCoords(mouseX, mouseY);
  let clickedNode = null;

  for (let node of nodes) {
    if (dist(w.x, w.y, node.x, node.y) < 25) {
      clickedNode = node;
      break;
    }
  }

  if (!clickedNode) {
    let newNode = createNode(w.x, w.y, "새 아이디어", "");
    openDetailModal(newNode);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
