function makeNotesArray() {
    return [
        {
            note_id: 1,
            note: 'this is a note',
            character: 1
        },
        {
            note_id: 2,
            note: 'another note',
            character: 1
        },
        {
            note_id: 3,
            note: 'woooowww',
            character: 2
        },
        {
            note_id: 4,
            note: 'hello',
            character: 3
        }
    ];
}

function makeMaliciousNote() {
    const maliciousNote = {
        note_id: 911,
        note: 'Naughty naughty very naughty <script>alert("xss");</script>',
        character: 1
    };

    const expectedNote = {
        ...maliciousNote,
        note: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;'
    };

    return {
        maliciousNote,
        expectedNote
    };
};

module.exports = {
    makeNotesArray,
    makeMaliciousNote
};