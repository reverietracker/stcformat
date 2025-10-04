const fs = require("fs");
const path = require("path");
const { readSTC } = require('..');

test("can read STC files", () => {
    const buf = fs.readFileSync(path.join(__dirname, 'neverland.stc'));
    const stc = readSTC(buf);

    expect(stc.tempo).toBe(4);
    expect(stc.length).toBe(35);

    const sample = stc.samples[7];
    expect(sample.repeat).toBe(26);
    expect(sample.repeatLength).toBe(7);
    expect(sample.volumes[0]).toBe(15);
    expect(sample.noiseLevels[0]).toBe(0);
    expect(sample.toneMasks[0]).toBe(false);
    expect(sample.noiseMasks[0]).toBe(true);
    expect(sample.tones[3]).toBe(2);

    expect(stc.positions[0]).toStrictEqual([7, 0]);

    const ornament = stc.ornaments[1];
    expect(ornament.tones[0]).toBe(12);

    const pattern = stc.patterns[1];
    expect(pattern.length).toBe(64);
    const channel = pattern.channels[0];
    expect(channel[0]).toStrictEqual(['C-5', 11, 15, 0]);
});
