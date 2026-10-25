const Engine = Matter.Engine;
const Composite = Matter.Composite;
const Composites = Matter.Composites;
const Bodies = Matter.Bodies;
const Body = Matter.Body;
const Constraint = Matter.Constraint;

let engine;
let stack;
let col = 40;
let row = 30;
let w = 10;
let canvas;
let fingers = new Map(); // 손가락 번호(id) + 잡은 줄

function setup() {
canvas = createCanvas(windowWidth, windowHeight);
rectMode(CENTER);
noStroke(0);
  // Matter setting
engine = Engine.create();
  // Walls
let margin = 20;
Composite.add(engine.world, [
    Bodies.rectangle(width / 2, height - margin, width, margin, {
    isStatic: true,
    }),
    Bodies.rectangle(margin / 2, height / 2, margin, height, {
    isStatic: true,
    }),
    Bodies.rectangle(width - margin / 2, height / 2, margin, height, {
    isStatic: true,
    }),
]);
  /////////////////////////// Mesh
stack = Composites.stack(
    width / 2,
    height / 2 - 200,
    col,
    row,
    0,
    0,
    makeBox,
);
Composites.mesh(stack, col, row, false, {
    stiffness: 0.2,
    damping: 0.01,
});
Composite.add(engine.world, stack);
  ////////////////////////// Pointer events
  // 캔버스의 실제 html 요소 - 에 브라우저 이벤트 등록
canvas.elt.addEventListener("pointerdown", down);
canvas.elt.addEventListener("pointermove", move);
canvas.elt.addEventListener("pointerup", release);
  canvas.elt.addEventListener("pointercancel", release); //브라우저가 중간에 끊었을 때
}

// 손가락과 가장 가까운 상자 -> constraint 선으로 연결하기
function down(e) {
print("down");

  // 1. 가장 가까이있는 박스와 거리 체크
let nearBox = null;
let nearDist = 50;

for (let b of stack.bodies) {
    //offsetX,Y : 이벤트가 발생한 대상 요소의 좌측상단을 (0,0)로 한 좌표.
    //즉, 캔버스 클릭시 캔버스 기준좌표이므로 유용함
    // 1. 터치위치와 모든 바디사이 거리 구하기
    let d = dist(e.offsetX, e.offsetY, b.position.x, b.position.y);
    if (d < nearDist) {
    nearDist = d;
    nearBox = b;
    }
}
  if (nearBox === null) return; //가까운상자가 없으면 끝

  // 2. 줄 생성하기
let link = Constraint.create({
    pointA: { x: e.offsetX, y: e.offsetY },
    bodyB: nearBox,
    length: 0,
    stiffness: 0.3,
});
Composite.add(engine.world, link);

  // 3. 이 손가락번호로 줄 기억하기 Map() 구조
fingers.set(e.pointerId, link);
}

// 손가락이 잡고있는 줄 위치 업데이트 시키기
function move(e) {
print("move");
  // 아무것도 잡지않은 손가락이면 끝내기
if (fingers.has(e.pointerId) === false) return;

  // 아까 down에서 저장한.. 이 손가락의 줄 꺼내기
let link = fingers.get(e.pointerId);
  // 줄의 위치 업데이트 시키기
link.pointA.x = e.offsetX;
link.pointA.y = e.offsetY;
}

// 손가락의 줄 지우기
function release(e) {
print("release");
  //print(e);
if (fingers.has(e.pointerId) === false) return;

let link = fingers.get(e.pointerId);
Composite.remove(engine.world, link);
fingers.delete(e.pointerId);
}

function makeBox(x, y) {
return Bodies.rectangle(x, y, w, w);
}

function draw() {
Engine.update(engine);
background(255);

  // mesh
stroke("#9fe5f2");
strokeWeight(4);
noFill();
  // for (let b of stack.bodies) {
  //   rect(b.position.x, b.position.y, w);
  // }
for (let s of stack.constraints) {
    let a = s.bodyA;
    let b = s.bodyB;
    line(a.position.x, a.position.y, b.position.x, b.position.y);
}
}
