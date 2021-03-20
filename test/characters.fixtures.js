function makeCharactersArray() {
    return [
        {
            character_id: 1,
            name: 'Julie',
            age: '20',
            occupation: 'Waitress',
            role: 'Protagonist',
            interests: 'Writing, reading',
            personality: 'Jokester',
            project: 1
        }, 
        {
            character_id: 2,
            name: 'Brian',
            age: '25',
            occupation: 'Lawyer',
            role: 'Antagonist',
            interests: 'Music',
            personality: 'Rude',
            project: 1
        },
        {
            character_id: 3,
            name: 'Trisha',
            age: '30',
            occupation: 'Writer',
            role: 'Protagonist',
            interests: 'Food',
            personality: 'Creative',
            project: 2
        },
        {
            character_id: 4,
            name: 'Tanya',
            age: '40',
            occupation: 'Mother',
            role: 'Protagonist',
            interests: 'Knitting',
            personality: 'Funny',
            project: 3
        }
    ];
}

function makeMaliciousCharacter() {
    const maliciousCharacter = {
        character_id: 911,
        name: 'Naughty naughty very naughty <script>alert("xss");</script>',
        age: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        occupation: 'Naughty naughty very naughty <script>alert("xss");</script>',
        role: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        interests: 'Naughty naughty very naughty <script>alert("xss");</script>',
        personality: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        project: 1
    };

    const expectedCharacter = {
        ...maliciousCharacter,
        name: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        age: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
        occupation: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        role: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
        interests: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        personality: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
    };

    return {
        maliciousCharacter,
        expectedCharacter
    }
};

module.exports = {
    makeCharactersArray,
    makeMaliciousCharacter
};