const assert = require('node:assert/strict');
const { frameAt } = require('../public/assets/js/main.js');

const viewports = [[1440,824],[1366,692],[880,540],[768,700],[390,780],[360,610]];
const unitFields = ['p','split','heroOpacity','paper','paperLeave','anatomy','propsEnter','assemble','floatingFit','boxEnter','boxTurn','close','sink','comboCaption','shakeCaption'];
const increasingPhases = ['paper','paperLeave','propsEnter','assemble','boxEnter','boxTurn','close','sink'];

function screenGeometry(frame, width, height) {
  const unit = height / 10;
  return {
    x: width / 2 + frame.burgerX * unit,
    y: height / 2 - frame.burgerY * unit,
    size: frame.burgerSize * unit,
    layers: frame.offsets.map(offset => height / 2 - (frame.burgerY + offset * frame.split) * unit),
  };
}

for (const [width,height] of viewports) {
  const at = progress => frameAt(progress,width,height);
  const opening = at(0);
  assert.equal(opening.heroOpacity,1,'Opening copy must be visible');
  for (const key of ['split','paper','anatomy','propsEnter','assemble','boxEnter','close']) {
    assert.equal(opening[key],0,`${key} must not start before the opening`);
  }
  assert.deepEqual(at(-1),opening,'Scrolling above the scene must clamp to the opening');

  const stack = at(.36);
  assert.equal(stack.split,1,'Stack navigation must land on fully separated ingredients');
  assert.equal(stack.anatomy,1,'Stack navigation must show the ingredient labels');
  assert.equal(stack.heroOpacity,0,'Opening copy must have left before the stack');
  assert.equal(stack.paper,1,'The cream wipe must have reached the whole stage');
  assert.equal(stack.paperLeave,0,'The cream stage must remain during the stack');
  assert.equal(stack.propsEnter,0,'Accompaniments must enter after the stack');
  const geometry = screenGeometry(stack,width,height);
  assert(geometry.x-geometry.size/2>=0 && geometry.x+geometry.size/2<=width,'The separated burger must fit horizontally');
  geometry.layers.forEach((y,i) => {
    assert(y-geometry.size/2>=0 && y+geometry.size/2<=height,'Each separated ingredient must fit vertically');
    assert(stack.labelY[i]>=16 && stack.labelY[i]<=height-16,'Ingredient callouts must stay inside the stage');
    if(i>0) {
      assert(geometry.layers[i]>geometry.layers[i-1],'Ingredients must retain their top-to-bottom order');
      assert(stack.labelY[i]-stack.labelY[i-1]>=32,'Callout lines must have readable vertical spacing');
    }
  });

  const regroup = at(.49);
  assert.equal(regroup.split,0,'The burger must reform before entering the box');
  assert.equal(regroup.propsEnter,1,'Separate accompaniments must arrive before box assembly');
  assert.equal(regroup.assemble,0,'Box assembly must start after the floating meal appears');
  const combo = at(.68);
  assert.equal(combo.assemble,1,'Combo navigation must land after the food enters the box');
  assert.equal(combo.boxEnter,1,'The whole carton must have entered at the combo stop');
  assert.equal(combo.close,0,'The combo stop must leave the lid open');
  assert.equal(combo.sink,0,'Food must still be visible at the combo stop');
  assert.equal(combo.comboCaption,1,'The combo title must be visible at its navigation stop');

  const closing = at(.82);
  assert(closing.close>0 && closing.close<1,'Lid closing must have an intermediate pose');
  assert(closing.sink>0 && closing.sink<1,'Contents must settle while the lid closes');
  const end = at(1);
  for(const key of ['assemble','boxEnter','boxTurn','close','sink','paperLeave']) assert.equal(end[key],1,`${key} must reach its final state`);
  for(const key of ['split','heroOpacity','anatomy','comboCaption','shakeCaption']) assert.equal(end[key],0,`${key} must be clear at the end`);
  assert.deepEqual(at(2),end,'Scrolling beyond the scene must hold the closed carton');

  let previous = opening;
  let previousGeometry = screenGeometry(opening,width,height);
  for(let step=1;step<=2000;step++) {
    const progress = step/2000;
    const frame = at(progress);
    assert(Object.values(frame).flat().every(Number.isFinite),'Every frame must contain finite coordinates');
    unitFields.forEach(key => assert(frame[key]>=0 && frame[key]<=1,`${key} must stay normalized`));
    assert(frame.burgerSize>0 && frame.boxScale>0,'Food and carton dimensions must stay positive');
    increasingPhases.forEach(key => assert(frame[key]>=previous[key],`${key} must not reverse during forward scrolling`));
    assert(frame.heroOpacity<=previous.heroOpacity,'Opening copy must leave only once');
    if(frame.anatomy>.99) assert.equal(frame.split,1,'Fully visible callouts require a stationary separated stack');
    if(frame.close>0) assert.equal(frame.assemble,1,'The lid must not close before assembly finishes');

    const currentGeometry = screenGeometry(frame,width,height);
    assert(Math.abs(currentGeometry.x-previousGeometry.x)<width*.008,'Burger position must not jump horizontally');
    assert(Math.abs(currentGeometry.y-previousGeometry.y)<height*.008,'Burger position must not jump vertically');
    assert(Math.abs(currentGeometry.size-previousGeometry.size)<height*.008,'Burger scale must change continuously');
    currentGeometry.layers.forEach((y,i) => assert(Math.abs(y-previousGeometry.layers[i])<height*.008,'Ingredient motion must be continuous'));
    unitFields.forEach(key => assert(Math.abs(frame[key]-previous[key])<.03,`${key} must not jump at phase boundaries`));

    // Seek elsewhere, then return: no accumulated transform or time dependency.
    at(1-progress); at(0); at(1);
    assert.deepEqual(at(progress),frame,'Reverse scrolling must reproduce the same scene state');
    previous = frame;
    previousGeometry = currentGeometry;
  }
}
console.log('Motion validated across 6 viewport sizes and 12,000 sampled frames: timeline stops, stack bounds, readable callout spacing, continuous transforms, and reversible scrolling.');
console.log('These checks cover the scroll model; browser review is required for rendered textures, occlusion, and the articulated lid.');
