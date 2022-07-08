# stcfile

A parser for ZX Spectrum Soundtracker (.stc) files

## Installation

```
npm install stcfile
```

## Usage

This package exports a function `readSTC` which accepts a buffer containing the binary data of the .stc file, and returns the data as a structured JSON-like object.

```javascript
const fs = require("fs");
const { readSTC } = require('stcfile');

const buf = fs.readFileSync('myfile.stc'));
const stc = readSTC(buf);
```

The returned object contains the following items:

* `tempo` - the song tempo, in frames per row
* `length` - the number of positions in the song
* `samples` - an array of sample objects
* `positions` - an array of positions, where each position is a two-element array of pattern number and transposition value
* `ornaments` - an array of ornament objects
* `patterns` - an array of pattern objects

Sample objects consist of the items:

* `repeat` - the offset from which the sample will be repeated after reaching the end of the sample
* `repeatLength` - the length of the repeating section
* `volumes` - an array of 32 integers from 0 to 15, giving the volume over time
* `noiseLevels` - an array of 32 integers from 0 to 31, giving the noise periods over time
* `toneMasks` - an array of 32 booleans indicating the frames on which the tone generator is masked
* `noiseMasks` - an array of 32 booleans indicating the frames on which the noise generator is masked
* `tones` - an array of 32 integers giving the pitch offsets over time

Ornament objects consist of a single item `tones`, an array of 32 integers giving the semitone offsets over time.

Pattern objects consist of the items:

* `length` - the number of rows in the pattern
* `channels` - an array of 3 items, giving the note data for each channel. Each channel is an array of rows, where each row is a four-element array consisting of:
  * Note name as a string, e.g. `"C-4"` or `"F#4"`
  * Sample number
  * Effect number (8-14 to select an envelope, 15 for an ornament)
  * Effect parameter (envelope period or ornament number)
