function readSTC(buf) {
    const tempo = buf.readUint8(0);
    const positionsOffset = buf.readUint16LE(1);
    const ornamentsOffset = buf.readUint16LE(3);
    const patternsOffset = buf.readUint16LE(5);

    const samples = new Array(16);

    for (let sampleOffset = 27; sampleOffset < positionsOffset; sampleOffset += 99) {
        const sampleBuffer = buf.subarray(sampleOffset, sampleOffset + 99);
        const sampleNumber = sampleBuffer.readUint8(0);
        const repeat = sampleBuffer.readUint8(97);
        const replen = sampleBuffer.readUint8(98);
        const sample = {
            'volumes': [],
            'noiseLevels': [],
            'toneMasks': [],
            'noiseMasks': [],
            'tones': [],
            'repeat': repeat,
            'repeatLength': replen,
        };
        for (let i = 0; i < 32; i++) {
            const b1 = sampleBuffer.readUint8(i * 3 + 1);
            const b2 = sampleBuffer.readUint8(i * 3 + 2);
            const b3 = sampleBuffer.readUint8(i * 3 + 3);
            sample.volumes[i] = b1 & 0x0f;
            sample.noiseLevels[i] = b2 & 0x1f;
            sample.toneMasks[i] = !!(b2 & 0x40);
            sample.noiseMasks[i] = !!(b2 & 0x80);
            let tone = b3 | ((b1 & 0xf0) << 4);
            if (b2 & 0x20) tone = -tone;
            sample.tones[i] = tone;
        }

        samples[sampleNumber] = sample;
    }

    const positionsBuffer = buf.subarray(positionsOffset);
    const songLength = positionsBuffer.readUint8(0) - 1;
    const positions = [];
    let positionOffset = 1;
    for (let i = 0; i < songLength; i++) {
        const patternNumber = positionsBuffer.readUint8(positionOffset);
        const transpose = positionsBuffer.readInt8(positionOffset + 1);
        positions[i] = [patternNumber, transpose];
        positionOffset += 2;
    }

    const ornaments = new Array(16);
    for (let ornamentOffset = ornamentsOffset; ornamentOffset < patternsOffset; ornamentOffset += 33) {
        const ornamentBuffer = buf.subarray(ornamentOffset, ornamentOffset + 33);
        const ornamentNumber = ornamentBuffer.readUint8(0);
        const ornament = {'tones': []};
        for (let i = 0; i < 32; i++) {
            ornament.tones[i] = ornamentBuffer.readInt8(i+1);
        }
        ornaments[ornamentNumber] = ornament;
    }

    const patterns = [];
    for (let i = 0; i < 31; i++) patterns[i] = {};
    let patternOffset = patternsOffset;
    while (true) {
        const patternBuffer = buf.subarray(patternOffset, patternOffset + 7);
        const patternNumber = patternBuffer.readUint8(0);
        if (patternNumber == 0xff) break;
        const channelDataOffsets = [
            patternBuffer.readUint16LE(1),
            patternBuffer.readUint16LE(3),
            patternBuffer.readUint16LE(5),
        ];
        patternOffset += 7;
        const channels = [];
        let patternLength = 0;
        channelDataOffsets.forEach((offset, channelIndex) => {
            const channelBytes = buf.subarray(offset);
            const channelData = [];
            let i = 0;

            let skip = 0;
            let row = ['---', 0, 0, 0];

            while (true) {
                let code = channelBytes[i++];
                let putNote = false;
                if (code < 0x60) {
                    /* note */
                    row[0] = (
                        ['C-', 'C#', 'D-', 'D#', 'E-', 'F-', 'F#', 'G-', 'G#', 'A-', 'A#', 'B-'][code % 12]
                        + (Math.floor(code / 12) + 1)
                    );
                    putNote = true;
                } else if (code < 0x70) {
                    /* sample */
                    row[1] = code & 0x0f;
                } else if (code < 0x80) {
                    /* ornament */
                    row[2] = 0x0f;
                    row[3] = code & 0x0f;
                } else if (code == 0x80) {
                    /* rest */
                    row[0] = 'R--';
                    putNote = true;
                } else if (code == 0x81) {
                    /* empty note */
                    row[0] = '---';
                    putNote = true;
                } else if (code < 0x88) {
                    /* istanbul ignore next */
                    throw('Unrecognised code: ' + code);
                } else if (code < 0x8f) {
                    /* envelope */
                    row[2] = code & 0x0f;
                    row[3] = channelBytes[i++];
                } else if (code < 0xa1) {
                    /* istanbul ignore next */
                    throw('Unrecognised code: ' + code);
                } else if (code < 0xe1) {
                    skip = code - 0xa1;
                } else if (code == 0xff) {
                    /* end marker */
                    break;
                } else {
                    /* istanbul ignore next */
                    throw('Unrecognised code: ' + code);
                }
                if (putNote) {
                    channelData.push(row);
                    for (let j = 0; j < skip; j++) {
                        channelData.push(['---', 0, 0, 0]);
                    }
                    row = ['---', 0, 0, 0];
                }
            }
            channels[channelIndex] = channelData;
            patternLength = Math.max(patternLength, channelData.length);
        });

        patterns[patternNumber] = {
            'length': patternLength,
            'channels': channels,
        };
    }

    return {
        'tempo': tempo,
        'length': songLength,
        'samples': samples,
        'positions': positions,
        'ornaments': ornaments,
        'patterns': patterns,
    };
}

module.exports = { readSTC };
