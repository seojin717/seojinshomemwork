// Matter.js 모듈 구조 분해 할당 (대소문자 정확히 일치)
const { Engine, World, Bodies, Body } = Matter;

let engine;
let world;

let size = 70;
let pieces = [];

function setup() {
  createCanvas(windowWidth, windowHeight);

  engine = Engine.create();
  world = engine.world;
  world.gravity.y = 1;

  let ground = Bodies.rectangle(
    width / 2,
    height - 20,
    width,
    40,
    { isStatic: true }
  );

  World.add(world, ground);

  makeSquare(width / 2 - size * 3, -50, "#ff3030");
  makeT(width / 2, -200, "#9b51e0");
  makeL(width / 2 + size * 2, -350, "#25d34f");
  makeLine(width / 2 - size * 3, -500, "#2864ff");
  makeT(width / 2 - size, -650, "#ffd92f");
  makeVertical(width / 2 + size * 4, -800, "#ff4fa3");
}

function draw() {
  background(240);
  Engine.update(engine);

  fill(40);
  noStroke();
  rectMode(CENTER);

  rect(width / 2, height - 20, width, 40);

  for (let i = 0; i < pieces.length; i++) {
    let pieceBody = pieces[i].body;

    fill(pieces[i].color);
    stroke(0);
    strokeWeight(2);

    for (let j = 1; j < pieceBody.parts.length; j++) {
      let part = pieceBody.parts[j];
      beginShape();
      for (let k = 0; k < part.vertices.length; k++) {
        vertex(part.vertices[k].x, part.vertices[k].y);
      }
      endShape(CLOSE);
    }
  }
}

function makeBox(x, y) {
  return Bodies.rectangle(x, y, size, size);
}

function makeSquare(x, y, color) {
  let a = makeBox(x, y);
  let b = makeBox(x + size, y);
  let c = makeBox(x, y + size);
  let d = makeBox(x + size, y + size);
  makeBody(a, b, c, d, color);
}

function makeT(x, y, color) {
  let a = makeBox(x, y);
  let b = makeBox(x - size, y + size);
  let c = makeBox(x, y + size);
  let d = makeBox(x + size, y + size);
  makeBody(a, b, c, d, color);
}

function makeL(x, y, color) {
  let a = makeBox(x, y);
  let b = makeBox(x, y + size);
  let c = makeBox(x, y + size * 2);
  let d = makeBox(x + size, y + size * 2);
  makeBody(a, b, c, d, color);
}

function makeLine(x, y, color) {
  let a = makeBox(x, y);
  let b = makeBox(x + size, y);
  let c = makeBox(x + size * 2, y);
  let d = makeBox(x + size * 3, y);
  makeBody(a, b, c, d, color);
}

function makeVertical(x, y, color) {
  let a = makeBox(x, y);
  let b = makeBox(x, y + size);
  let c = makeBox(x, y + size * 2);
  let d = makeBox(x, y + size * 3);
  makeBody(a, b, c, d, color);
}

function makeBody(a, b, c, d, color) {
  let newBody = Body.create({
    parts: [a, b, c, d],
    restitution: 0,
    friction: 1,
    frictionStatic: 1,
    inertia: Infinity
  });

  World.add(world, newBody);
  pieces.push({
    body: newBody,
    color: color
  });
}
