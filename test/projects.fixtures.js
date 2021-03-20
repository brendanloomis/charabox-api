function makeProjectsArray() {
    return [
        {
            project_id: 1,
            project_name: 'First Project',
            project_type: 'Movie',
            project_summary: 'My awesome movie',
            user_id: 1
        },
        {
            project_id: 2,
            project_name: 'Second Project',
            project_type: 'Book',
            project_summary: 'My awesome book',
            user_id: 1
        }, {
            project_id: 3,
            project_name: 'Wow',
            project_type: 'Movie',
            project_summary: 'Best movie ever',
            user_id: 2
        }
    ];
}

function makeMaliciousProject() {
    const maliciousProject = {
        project_id: 911,
        project_name: 'Naughty naughty very naughty <script>alert("xss");</script>',
        project_type: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        project_summary: 'Naughty naughty very naughty <script>alert("xss");</script>',
        user_id: 1
    };

    const expectedProject = {
        ...maliciousProject,
        project_name: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        project_type: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
        project_summary: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;'
    };

    return {
        maliciousProject,
        expectedProject
    };
};

module.exports = {
    makeProjectsArray,
    makeMaliciousProject
}