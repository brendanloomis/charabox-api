const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const app = require('../src/app');
const { makeUsersArray } = require('./users.fixtures');
const { makeProjectsArray } = require('./projects.fixtures');
const { makeCharactersArray } = require('./characters.fixtures');
const { makeNotesArray, makeMaliciousNote } = require('./notes.fixtures');

describe(`Notes Endpoints`, () => {
    let db;

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL
        });
        app.set('db', db);
    });

    after(`disconnect from db`, () => db.destroy());

    before(`clean the table`, () => db.raw('TRUNCATE users, projects, characters, notes'));

    afterEach(`cleanup`, () => db.raw('TRUNCATE users, projects, characters, notes'));

    describe(`Unauthorized requests`, () => {
        const testUsers = makeUsersArray();
        const testProjects = makeProjectsArray();
        const testCharacters = makeCharactersArray();
        const testNotes = makeNotesArray();

        beforeEach('insert notes', () => {
            return db
                .into('users')
                .insert(testUsers)
                .then(() => {
                    return db
                        .into('projects')
                        .insert(testProjects)
                        .then(() => {
                            return db
                                .into('characters')
                                .insert(testCharacters)
                                .then(() => {
                                    return db
                                        .into('notes')
                                        .insert(testNotes);
                                });
                        });
                });
        });

        it(`responds with 401 Unauthorized for GET /api/notes`, () => {
            return supertest(app)
                .get('/api/notes')
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for POST /api/notes`, () => {
            return supertest(app)
                .post('/api/notes')
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for GET /api/notes/:note_id`, () => {
            const note = testNotes[1];
            return supertest(app)
                .get(`/api/notes/${note.note_id}`)
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for DELETE /api/notes/:note_id`, () => {
            const note = testNotes[1];
            return supertest(app)
                .delete(`/api/notes/${note.note_id}`)
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for PATCH /api/notes/:note_id`, () => {
            const note = testNotes[1];
            return supertest(app)
                .patch(`/api/notes/${note.note_id}`)
                .expect(401, { error: 'Unauthorized request' });
        });
    });

    describe(`GET /api/notes`, () => {
        context(`Given no notes`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/notes?characterId=1')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, []);
            });
        });

        context(`Given there are notes in the database`, () => {
            const testUsers = makeUsersArray();
            const testProjects = makeProjectsArray();
            const testCharacters = makeCharactersArray();
            const testNotes = makeNotesArray();

            beforeEach('insert notes', () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('projects')
                            .insert(testProjects)
                            .then(() => {
                                return db
                                    .into('characters')
                                    .insert(testCharacters)
                                    .then(() => {
                                        return db
                                            .into('notes')
                                            .insert(testNotes);
                                    });
                            });
                    });
            });

            it(`responds with 200 and all of the notes`, () => {
                const character = testCharacters[0];
                const expectedNotes = testNotes.filter(note => note.character === character.character_id)
                return supertest(app)
                    .get(`/api/notes?characterId=${character.character_id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedNotes);
            });
        });

        context(`Given an XSS attack note`, () => {
            const { maliciousNote, expectedNote } = makeMaliciousNote();
            const testUsers = makeUsersArray();
            const testProjects = makeProjectsArray();
            const testCharacters = makeCharactersArray();

            beforeEach('insert malicious note', () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('projects')
                            .insert(testProjects)
                            .then(() => {
                                return db
                                    .into('characters')
                                    .insert(testCharacters)
                                    .then(() => {
                                        return db
                                            .into('notes')
                                            .insert(maliciousNote);
                                    });
                            });
                    });
            });

            it(`removes XSS attack content`, () => {
                return supertest(app)
                    .get(`/api/notes?characterId=${maliciousNote.character}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].note).to.eql(expectedNote.note);
                    });
            });
        });
    });

    describe(`GET /api/notes/:note_id`, () => {
        context(`Given no notes`, () => {
            it(`responds with 404 when note doesn't exist`, () => {
                const noteId = 123456;
                return supertest(app)
                    .get(`/api/notes/${noteId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: { message: `Note doesn't exist` }
                    });
            });
        });

        context(`Given there are notes in the database`, () => {
            const testUsers = makeUsersArray();
            const testProjects = makeProjectsArray();
            const testCharacters = makeCharactersArray();
            const testNotes = makeNotesArray();

            beforeEach('insert notes', () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('projects')
                            .insert(testProjects)
                            .then(() => {
                                return db
                                    .into('characters')
                                    .insert(testCharacters)
                                    .then(() => {
                                        return db
                                            .into('notes')
                                            .insert(testNotes);
                                    });
                            });
                    });
            });

            it(`responds with 200 and the specified note`, () => {
                const noteId = 1;
                const expectedNote = testNotes[noteId - 1];

                return supertest(app)
                    .get(`/api/notes/${noteId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedNote);
            });
        });

        context(`Given an XSS attack note`, () => {
            const { maliciousNote, expectedNote } = makeMaliciousNote();
            const testUsers = makeUsersArray();
            const testProjects = makeProjectsArray();
            const testCharacters = makeCharactersArray();

            beforeEach('insert malicious note', () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('projects')
                            .insert(testProjects)
                            .then(() => {
                                return db
                                    .into('characters')
                                    .insert(testCharacters)
                                    .then(() => {
                                        return db
                                            .into('notes')
                                            .insert(maliciousNote);
                                    });
                            });
                    });
            });

            it(`removes XSS attack content`, () => {
                return supertest(app)
                    .get(`/api/notes/${maliciousNote.note_id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.note).to.eql(expectedNote.note);
                    });
            });
        });
    });

    describe(`DELETE /api/notes/:note_id`, () => {
        context(`Given no notes`, () => {
            it(`responds with 404 when note doesn't exist`, () => {
                return supertest(app)
                    .delete(`/api/notes/123456`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: { message: `Note doesn't exist` }
                    });
            });
        });

        context(`Given there are notes in the database`, () => {
            const testUsers = makeUsersArray();
            const testProjects = makeProjectsArray();
            const testCharacters = makeCharactersArray();
            const testNotes = makeNotesArray();

            beforeEach('insert notes', () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('projects')
                            .insert(testProjects)
                            .then(() => {
                                return db
                                    .into('characters')
                                    .insert(testCharacters)
                                    .then(() => {
                                        return db
                                            .into('notes')
                                            .insert(testNotes);
                                    });
                            });
                    });
            });

            it(`responds with 204 and removes the note`, () => {
                const idToRemove = 1;
                const noteToRemove = testNotes[idToRemove];
                const charactersNotes = testNotes.filter(n => n.character === noteToRemove.character);
                const expectedNotes = charactersNotes.filter(n => n.note_id !== idToRemove);

                return supertest(app)
                    .delete(`/api/notes/${idToRemove}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(() => {
                        supertest(app)
                            .get(`/api/notes?characterId=${noteToRemove.character}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedNotes);
                    });
            });
        });
    });

    describe(`POST /api/notes`, () => {
        const testUsers = makeUsersArray();
        const testProjects = makeProjectsArray();
        const testCharacters = makeCharactersArray();

        beforeEach('insert users, projects, and characters', () => {
            return db
                .into('users')
                .insert(testUsers)
                .then(() => {
                    return db
                        .into('projects')
                        .insert(testProjects)
                        .then(() => {
                            return db
                                .into('characters')
                                .insert(testCharacters);
                        });
                });
        });

        const requiredFields = ['note', 'character'];

        requiredFields.forEach(field => {
            const newNote = {
                note: 'new note',
                character: 1
            };

            it(`responds with 400 and an error message when the ${field} is missing`, () => {
                delete newNote[field];
                return supertest(app)
                    .post('/api/notes')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(newNote)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body` }
                    });
            });
        });

        it(`creates a note, responding with 201 and the new note`, () => {
            const newNote = {
                note: 'new note',
                character: 1
            };

            return supertest(app)
                .post('/api/notes')
                .send(newNote)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(201)
                .expect(res => {
                    expect(res.body.note).to.eql(newNote.note);
                    expect(res.body.character).to.eql(newNote.character);
                    expect(res.body).to.have.property('note_id');
                    expect(res.headers.location).to.eql(`/api/notes/${res.body.note_id}`);
                })
                .then(postRes => {
                    supertest(app)
                        .get(`/api/notes/${postRes.body.note_id}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(postRes.body);
                });
        });

        it(`removes XSS attack content from response`, () => {
            const { maliciousNote, expectedNote } = makeMaliciousNote();

            return supertest(app)
                .post('/api/notes')
                .send(maliciousNote)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(201)
                .expect(res => {
                    expect(res.body.note).to.eql(expectedNote.note);
                });
        });
    });

    describe(`PATCH /api/notes/:note_id`, () => {
        context(`Given no notes`, () => {
            it(`responds with 404 when note doesn't exist`, () => {
                return supertest(app)
                    .patch(`/api/notes/123456`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: { message: `Note doesn't exist` }
                    });
            });
        });

        context(`Given there are notes`, () => {
            const testUsers = makeUsersArray();
            const testProjects = makeProjectsArray();
            const testCharacters = makeCharactersArray();
            const testNotes = makeNotesArray();

            beforeEach('insert notes', () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('projects')
                            .insert(testProjects)
                            .then(() => {
                                return db
                                    .into('characters')
                                    .insert(testCharacters)
                                    .then(() => {
                                        return db
                                            .into('notes')
                                            .insert(testNotes);
                                    });
                            });
                    });
            });

            it(`responds with 204 and updates the note`, () => {
                const idToUpdate = 1;
                const updateNote = {
                    note: 'updated note',
                    character: 3
                };
                const expectedNote = {
                    ...testNotes[idToUpdate - 1],
                    ...updateNote
                };

                return supertest(app)
                    .patch(`/api/notes/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(updateNote)
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/notes/${idToUpdate}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedNote)
                    );
            });

            it(`responds with 204 when updating only a subset of fields`, () => {
                const idToUpdate = 1;
                const updateNote = {
                    note: 'updated note'
                };
                const expectedNote = {
                    ...testNotes[idToUpdate - 1],
                    ...updateNote
                };

                return supertest(app)
                    .patch(`/api/notes/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send({
                        ...updateNote,
                        fieldToIgnore: 'should not be in GET response'
                    })
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/notes/${idToUpdate}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedNote)
                    );
            });
        });
    });
});