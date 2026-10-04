let notes=[],pieces=[],draggingNote=null;
let pressX,pressY,pressTime,emptyTime=null;
let clickDistance=8,clickTime=250,swipeDistance=100,swipeTime=450;
let trashX,trashY,trashW=110,trashH=130;

function setup(){
createCanvas(windowWidth,windowHeight);
createNewNotes();
updateTrashPosition();
}

function draw(){
drawDesktop();

for(let i=notes.length-1;i>=0;i--){
notes[i].display();

if(notes[i].death===true){
console.log("[MEMORY OS] deleted:",notes[i].textContent);
notes.splice(i,1);
}
}

for(let i=pieces.length-1;i>=0;i--){
pieces[i].update();
pieces[i].display();

if(pieces[i].alpha<=0){
pieces.splice(i,1);
}
}

drawTrash();

if(notes.length===0&&pieces.length===0){
if(emptyTime===null)emptyTime=millis();

if(millis()-emptyTime>1500){
createNewNotes();
emptyTime=null;
}
}else{
emptyTime=null;
}
}

function createNewNotes(){
let texts=[
"후회했던 말",
"답장 기다리기",
"괜히 했던 말",
"그때 그렇게 하지 말걸",
"잊었다고 생각했는데",
"괜히 신경 쓰이는 것",
"아직 남아 있는 생각",
"다시 떠오른 기억"
];

for(let i=0;i<4;i++){
let x=random(220,width-250);
let y=random(180,height-230);
let t=random(texts);

notes.push(new Note(x,y,t));
}
}

function drawDesktop(){
for(let y=0;y<height;y++){
let t=map(y,0,height,0,1);
let c=lerpColor(
color(165,205,255),
color(235,210,255),
t
);

stroke(c);
line(0,y,width,y);
}

noStroke();
fill(255,255,255,25);
ellipse(width*.2,height*.3,450,450);
ellipse(width*.8,height*.4,550,550);

rectMode(CORNER);
fill(255,255,255,180);
rect(0,0,width,38);

fill(40);
textAlign(LEFT,CENTER);
textStyle(BOLD);
textSize(14);
text("MEMORY OS",20,19);

textStyle(NORMAL);
textSize(12);
fill(80);
text("File",125,19);
text("Edit",165,19);
text("Memory",205,19);

textAlign(RIGHT,CENTER);
text("09.30",width-25,19);

textAlign(LEFT,TOP);
textStyle(BOLD);
textSize(46);
fill(255,255,255,175);
text("DELETE\nTHE THOUGHT",55,80);

textStyle(NORMAL);
textSize(13);
fill(255,255,255,150);
text("click / swipe / drag to delete",58,190);

rectMode(CENTER);
fill(255,255,255,90);
stroke(255,255,255,150);
strokeWeight(1);
rect(width/2,height-60,400,72,22);

let startX=width/2-105;

drawAppIcon(
startX,
height-60,
"NOTE",
color(255,230,130)
);

drawAppIcon(
startX+70,
height-60,
"MEM",
color(215,195,255)
);

drawAppIcon(
startX+140,
height-60,
"IMG",
color(190,225,255)
);

drawAppIcon(
startX+210,
height-60,
"ARC",
color(190,240,215)
);
}

function drawAppIcon(x,y,label,c){
rectMode(CENTER);

noStroke();
fill(c);
rect(x,y,46,46,11);

fill(60);
textAlign(CENTER,CENTER);
textSize(8);
textStyle(BOLD);
text(label,x,y);

textStyle(NORMAL);
}

function mousePressed(){
pressX=mouseX;
pressY=mouseY;
pressTime=millis();
draggingNote=null;

for(let i=notes.length-1;i>=0;i--){

if(notes[i].death===false&&notes[i].isMouseInside()){

draggingNote=notes[i];

draggingNote.offsetX=
mouseX-draggingNote.x;

draggingNote.offsetY=
mouseY-draggingNote.y;

notes.splice(i,1);
notes.push(draggingNote);

break;
}
}
}

function mouseDragged(){
if(
draggingNote!==null&&
draggingNote.death===false
){
draggingNote.x=
mouseX-draggingNote.offsetX;

draggingNote.y=
mouseY-draggingNote.offsetY;
}
}

function mouseReleased(){
if(draggingNote===null)return;

let moveDistance=
dist(
pressX,
pressY,
mouseX,
mouseY
);

let duration=
millis()-pressTime;


// LEVEL 3
// 쓰레기통 삭제
if(isInsideTrash(draggingNote)){

console.log(
"[TRASH]",
draggingNote.textContent
);

deleteNote(draggingNote);
}


// LEVEL 2
// 스와이프 삭제
else if(
moveDistance>swipeDistance&&
duration<swipeTime
){

console.log(
"[SWIPE]",
draggingNote.textContent
);

tearNote(draggingNote);
}


// LEVEL 1
// 클릭 삭제
else if(
moveDistance<clickDistance&&
duration<clickTime
){

console.log(
"[CLICK]",
draggingNote.textContent
);

deleteNote(draggingNote);
}

draggingNote=null;
}

function deleteNote(note){
note.death=true;
}

function tearNote(note){
let cols=5;
let rows=5;

let pieceW=
note.w/cols;

let pieceH=
note.h/rows;

for(let row=0;row<rows;row++){

for(let col=0;col<cols;col++){

let px=
note.x-note.w/2+
pieceW/2+
col*pieceW;

let py=
note.y-note.h/2+
pieceH/2+
row*pieceH;

pieces.push(
new PaperPiece(
px,
py,
pieceW,
pieceH
)
);
}
}

deleteNote(note);
}

class Note{

constructor(x,y,textContent){

this.x=x;
this.y=y;

this.w=180;
this.h=180;

this.textContent=
textContent;

this.angle=
random(-.05,.05);

this.offsetX=0;
this.offsetY=0;

// 삭제 여부
this.death=false;
}

display(){

push();

translate(
this.x,
this.y
);

rotate(
this.angle
);

rectMode(CENTER);

noStroke();

fill(0,25);

rect(
7,
9,
this.w,
this.h,
3
);

fill(
255,
236,
145
);

rect(
0,
0,
this.w,
this.h,
3
);

fill(
255,
247,
185,
140
);

rect(
0,
-this.h/2+10,
this.w,
20
);

fill(50);

textAlign(
CENTER,
CENTER
);

textSize(17);

text(
this.textContent,
0,
0,
this.w-35,
this.h-35
);

pop();
}

isMouseInside(){

return (
mouseX>this.x-this.w/2&&
mouseX<this.x+this.w/2&&
mouseY>this.y-this.h/2&&
mouseY<this.y+this.h/2
);
}
}

class PaperPiece{

constructor(x,y,w,h){

this.x=x;
this.y=y;

this.w=w;
this.h=h;

this.vx=
random(-4,4);

this.vy=
random(-5,-1);

this.gravity=
random(.18,.3);

this.angle=
random(-.4,.4);

this.rotationSpeed=
random(-.09,.09);

this.alpha=255;
}

update(){

this.vy+=
this.gravity;

this.x+=
this.vx;

this.y+=
this.vy;

this.angle+=
this.rotationSpeed;

this.alpha-=3;
}

display(){

push();

translate(
this.x,
this.y
);

rotate(
this.angle
);

rectMode(CENTER);

noStroke();

fill(
255,
236,
145,
this.alpha
);

rect(
0,
0,
this.w+1,
this.h+1
);

pop();
}
}

function drawTrash(){

let hovering=false;

if(draggingNote!==null){
hovering=
isInsideTrash(draggingNote);
}

push();

translate(
trashX,
trashY
);

if(hovering){
scale(1.15);
}

rectMode(CENTER);

noStroke();

fill(0,25);

rect(
6,
8,
trashW,
trashH,
12
);

if(hovering){
fill(
255,
165,
165
);
}else{
fill(245);
}

rect(
0,
0,
trashW,
trashH,
12
);

stroke(180);
strokeWeight(2);

line(
-25,
-35,
-25,
35
);

line(
0,
-35,
0,
35
);

line(
25,
-35,
25,
35
);

noStroke();

fill(225);

if(hovering){

push();

translate(
0,
-trashH/2-8
);

rotate(-.35);

rect(
10,
-5,
trashW+18,
18,
5
);

pop();

}else{

rect(
0,
-trashH/2-8,
trashW+18,
18,
5
);
}

pop();

noStroke();

fill(
255,
255,
255,
190
);

textAlign(
CENTER,
TOP
);

textSize(11);

text(
"DELETE",
trashX,
trashY+
trashH/2+
18
);
}

function isInsideTrash(note){

return (
note.x>trashX-trashW/2&&
note.x<trashX+trashW/2&&
note.y>trashY-trashH/2&&
note.y<trashY+trashH/2
);
}

function updateTrashPosition(){

trashX=
width-105;

trashY=
height-155;
}

function windowResized(){

resizeCanvas(
windowWidth,
windowHeight
);

updateTrashPosition();
}
