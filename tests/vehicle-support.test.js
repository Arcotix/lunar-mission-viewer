import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createPlayerPhysics} from '../src/player-physics.js';
import {createRover,ROVER_COLLIDER,ROVER_SCALE} from '../src/rover.js';
import {SUSPENSION_LIMITS} from '../src/vehicle-support.js';
const idle={x:0,z:0};
function simulate(physics,seconds,input=idle,hz=120){for(let i=0;i<seconds*hz;i++)physics.update(1/hz,input);}
function vehicle(x,z=0,terrain=()=>0,y=ROVER_COLLIDER.eyeHeight){
 const position=new THREE.Vector3(x,y,z),physics=createPlayerPhysics(position,terrain,[],ROVER_COLLIDER);
 return {position,physics};
}
function shortTravel(physics){
 for(const wheel of physics.support.wheels){
  assert(wheel.offset>=-SUSPENSION_LIMITS.droop&&wheel.offset<=SUSPENSION_LIMITS.compression);
  assert(Number.isFinite(wheel.offset));
 }
}

test('all eight wheels support a stable chassis on level ground without body lift',()=>{
 const {position,physics}=vehicle(0);simulate(physics,4);
 assert(Math.abs(position.y-ROVER_COLLIDER.eyeHeight)<.015);assert(Math.abs(physics.velocity.y)<.001);
 assert(Math.abs(physics.support.pitch)<.02);assert(Math.abs(physics.support.roll)<.001);
 assert.equal(physics.support.heave,0);assert(physics.support.wheels.every(w=>w.contact));shortTravel(physics);
});

test('centre of mass beyond the remaining wheel support tips and falls off a ledge',()=>{
 const {position,physics}=vehicle(.15,0,x=>x<0?0:-6);
 simulate(physics,.4);assert(physics.support.roll<-.15,'left contacts create a tipping torque');
 simulate(physics,.8);assert(position.y<-1.5,'the high terrain ray does not hold the chassis in the air');
 assert(physics.velocity.y<-3);shortTravel(physics);
 simulate(physics,3);assert(position.y<-4,'the chassis settles at the lower terrain');shortTravel(physics);
});

test('an unsupported axle cannot stretch down to the floor of a crater',()=>{
 const {position,physics}=vehicle(0,0,(x,z)=>z<0?0:-8);
 simulate(physics,.15);shortTravel(physics);
 for(const index of [1,3,5,7])assert.equal(physics.support.wheels[index].contact,false);
 simulate(physics,1.5);assert(position.y<-1);shortTravel(physics);
});

test('a ledge inside the old circular footprint cannot support any wheel or the chassis',()=>{
 const {position,physics}=vehicle(.65,0,x=>x<0?0:-6);
 simulate(physics,.4);assert(position.y<.3);assert(!physics.grounded);
 assert(Math.abs(physics.support.roll)<.001,'no invented rotation without contact');
 simulate(physics,3);assert(Math.abs(position.y-(-6+ROVER_COLLIDER.eyeHeight))<.02);shortTravel(physics);
});

test('a centre-of-mass position inside supported axles remains stable at an edge',()=>{
 const {position,physics}=vehicle(-.65,0,x=>x<0?0:-6);simulate(physics,3);
 assert(Math.abs(position.y-ROVER_COLLIDER.eyeHeight)<.02);assert(Math.abs(physics.support.roll)<.001);
 assert(physics.support.wheels.every(w=>w.contact));
});

test('the chassis conforms to gentle slopes with bounded suspension',()=>{
 const terrain=(x,z)=>x*.3-z*.2,{position,physics}=vehicle(0,0,terrain);
 simulate(physics,3);assert(physics.support.pitch>.15&&physics.support.pitch<.25);assert(physics.support.roll>.25&&physics.support.roll<.35);
 assert(physics.support.wheels.every(w=>w.contact));shortTravel(physics);assert(Number.isFinite(position.y));
});

test('support and tipping use fixed steps at 30, 60 and 144 FPS',()=>{
 function result(hz){const v=vehicle(.15,0,x=>x<0?0:-6);simulate(v.physics,1,idle,hz);return v;}
 const a=result(30);for(const hz of [60,144]){
  const b=result(hz);assert(a.position.distanceTo(b.position)<1e-7);assert(Math.abs(a.physics.support.roll-b.physics.support.roll)<1e-7);
 }
});

test('rendered tires obey the same short travel and actual contact state as physics',()=>{
 const rover=createRover(),terrain=x=>x<0?0:-6,{position,physics}=vehicle(.15,0,terrain);
 simulate(physics,.2);
 const feet=position.clone();feet.y-=ROVER_COLLIDER.eyeHeight;
 rover.update(1/60,feet,physics.velocity,0,physics.grounded,terrain,physics.support);rover.root.updateMatrixWorld(true);
 const wheels=[];rover.root.traverse(object=>{if(object.name.startsWith('Wheel '))wheels.push(object);});
 assert.equal(wheels.length,8);
 for(let i=0;i<8;i++){
  const extension=wheels[i].position.y-.43;
  assert(extension>=-SUSPENSION_LIMITS.droop-1e-8&&extension<=SUSPENSION_LIMITS.compression+1e-8);
  assert.equal(rover.getWheelContact(i,new THREE.Vector3()),physics.support.wheels[i].contact);
 }
 assert((SUSPENSION_LIMITS.droop+SUSPENSION_LIMITS.compression)*ROVER_SCALE<.14);
});

test('vehicle fall and booster release settle without a crash mode or automatic repositioning',()=>{
 const {position,physics}=vehicle(0,0,()=>0,20);
 simulate(physics,4);assert(position.y<ROVER_COLLIDER.eyeHeight+.02);assert(physics.grounded);shortTravel(physics);
 simulate(physics,2,{...idle,jetpack:true});assert(position.y>4);assert(!physics.grounded);
 simulate(physics,7);assert(position.y<ROVER_COLLIDER.eyeHeight+.02);assert(Math.abs(physics.velocity.y)<.01);shortTravel(physics);
 assert.equal(physics.recoverAt,undefined);assert.equal(physics.impact,undefined);
});
