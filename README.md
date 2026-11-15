```sh
npm install
npm start
```

Surface detail uses bundled 2048-pixel albedo and normal maps with fine packed
grains, angular aggregates, and restrained contact shading under low-angle lighting. Regenerate
them with `node scripts/generate-regolith.mjs`. These are illustrative material
details, separate from the traversable site terrain and its collision mesh.

Rover movement uses locally bundled CC0 track and drivetrain recordings. Sound
follows driving speed and fades out when stopped, airborne, scanning, or away
from the surface. Booster audio follows actual thrust, including spool-up and
shutdown. The scanner sweep plays with the scan beam and ends with a short
completion cue. Use **Sound on/off** in the lower left to mute all rover effects.

Audio credits: [Tank Tread by 77Pacer](https://freesound.org/people/77Pacer/sounds/425271/)
[engine4_loop.wav by ReadeOnly](https://freesound.org/people/ReadeOnly/sounds/186934/),
[Thrust Loop by unfa](https://freesound.org/people/unfa/sounds/584181/),
[sci-fi long scan by pyth0n11](https://freesound.org/people/pyth0n11/sounds/706447/),
and [Objective Complete by Jerimee](https://freesound.org/people/Jerimee/sounds/527530/),
all [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).
Source URLs and edits are recorded in `public/audio/rover-sources.json`.

Surface driving uses fixed physics steps, sliding rock contacts, swept landings
on raised objects, and a dashed survey perimeter with outward braking. Rover
support comes from eight short-travel suspension springs and chassis contacts
acting around its centre of mass. Unsupported axles lose contact; the vehicle
naturally tips and falls off ledges rather than hovering over the highest nearby
terrain point. Suspension travel is limited to 0.18 model units of droop and 0.20
of compression (about 0.14 scene units total at the rover's scale). There are no
crash triggers, crash animations, recovery controls, or automatic repositioning.
Gravity and handling remain tuned for gameplay.
