const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const app = require('../src/app');
const { makeUsersArray } = require('./users.fixtures');
const { makeProjectsArray } = require('./projects.fixtures');
const { makeCharactersArray, makeMaliciousCharacter } = require('./characters.fixtures');

describe(`Characters Endpoints`, () => {
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

        beforeEach('insert characters', () => {
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

        it(`responds with 401 Unauthorized for GET /api/characters`, () => {
            return supertest(app)
                .get('/api/characters')
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for POST /api/characters`, () => {
            return supertest(app)
                .post('/api/characters')
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for GET /api/characters/:character_id`, () => {
            const character = testCharacters[1];
            return supertest(app)
                .get(`/api/characters/${character.character_id}`)
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for DELETE /api/characters/:character_id`, () => {
            const character = testCharacters[1];
            return supertest(app)
                .delete(`/api/characters/${character.character_id}`)
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for PATCH /api/characters/:character_id`, () => {
            const character = testCharacters[1];
            return supertest(app)
                .patch(`/api/characters/${character.character_id}`)
                .expect(401, { error: 'Unauthorized request' });
        });
    });

    describe(`GET /api/characters`, () => {
        context(`Given no characters`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/characters?projectId=1')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, []);
            });
        });

        context(`Given there are characters in the database`, () => {
            const testUsers = makeUsersArray();
            const testProjects = makeProjectsArray();
            const testCharacters = makeCharactersArray();

            beforeEach('insert characters', () => {
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

            it(`responds with 200 and all of the characters`, () => {
                const project = testProjects[0];
                const expectedCharacters = testCharacters.filter(char => char.project === project.project_id);
                return supertest(app)
                    .get(`/api/characters?projectId=${project.project_id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedCharacters);
            });
        });

        context(`Given an XSS attack character`, () => {
            const { maliciousCharacter, expectedCharacter } = makeMaliciousCharacter();
            const testUsers = makeUsersArray();
            const testProjects = makeProjectsArray();

            beforeEach('insert malicious character', () => {
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
                                    .insert(maliciousCharacter);
                            });
                    });
            });

            it(`removes XSS attack content`, () => {
                return supertest(app)
                    .get(`/api/characters?projectId=${maliciousCharacter.project}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].name).to.eql(expectedCharacter.name);
                        expect(res.body[0].age).to.eql(expectedCharacter.age);
                        expect(res.body[0].occupation).to.eql(expectedCharacter.occupation);
                        expect(res.body[0].role).to.eql(expectedCharacter.role);
                        expect(res.body[0].interests).to.eql(expectedCharacter.interests);
                        expect(res.body[0].personality).to.eql(expectedCharacter.personality);
                    });
            });
        });
    });

    describe(`GET /api/characters/:character_id`, () => {
        context(`Given no characters`, () => {
            it(`responds 404 when character doesn't exist`, () => {
                const charId = 123456;
                return supertest(app)
                    .get(`/api/characters/${charId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: { message: `Character doesn't exist` }
                    });
            });
        });

        context(`Given there are characters in the database`, () => {
            const testUsers = makeUsersArray();
            const testProjects = makeProjectsArray();
            const testCharacters = makeCharactersArray();

            beforeEach('insert characters', () => {
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

            it(`responds with 200 and the specified character`, () => {
                const charId = 1;
                const expectedCharacter = testCharacters[charId - 1];

                return supertest(app)
                    .get(`/api/characters/${charId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedCharacter);
            });
        });

        context(`Given an XSS attack character`, () => {
            const { maliciousCharacter, expectedCharacter } = makeMaliciousCharacter();
            const testUsers = makeUsersArray();
            const testProjects = makeProjectsArray();

            beforeEach('insert malicious character', () => {
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
                                    .insert(maliciousCharacter);
                            });
                    });
            });

            it(`removes XSS attack content`, () => {
                return supertest(app)
                    .get(`/api/characters/${maliciousCharacter.character_id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.name).to.eql(expectedCharacter.name);
                        expect(res.body.age).to.eql(expectedCharacter.age);
                        expect(res.body.occupation).to.eql(expectedCharacter.occupation);
                        expect(res.body.role).to.eql(expectedCharacter.role);
                        expect(res.body.interests).to.eql(expectedCharacter.interests);
                        expect(res.body.personality).to.eql(expectedCharacter.personality);
                    });
            });
        });
    });

    describe(`DELETE /api/characters/:character_id`, () => {
        context(`Given no characters`, () => {
            it(`responds with 404 when the character doesn't exist`, () => {
                return supertest(app)
                    .delete(`/api/characters/123456`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: { message: `Character doesn't exist` }
                    });
            });
        });

        context(`Given there are characters in the database`, () => {
            const testUsers = makeUsersArray();
            const testProjects = makeProjectsArray();
            const testCharacters = makeCharactersArray();

            beforeEach('insert characters', () => {
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

            it(`responds with 204 and changes the character to inactive`, () => {
                const idToRemove = 1;
                const charToRemove = testCharacters[idToRemove];
                const projectsCharacters = testCharacters.filter(c => c.project === charToRemove.project)
                const expectedCharacters = projectsCharacters.filter(c => c.character_id !== idToRemove);

                return supertest(app)
                    .delete(`/api/characters/${idToRemove}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(() => {
                        supertest(app)
                            .get(`/api/characters?projectId=${charToRemove.project}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedCharacters);
                    });
            });
        });
    });

    describe(`POST /api/characters`, () => {
        const testUsers = makeUsersArray();
        const testProjects = makeProjectsArray();

        beforeEach('insert users and projects', () => {
            return db
                .into('users')
                .insert(testUsers)
                .then(() => {
                    return db
                        .into('projects')
                        .insert(testProjects);
                });
        });

        const requiredFields = ['name', 'age', 'occupation', 'role', 'interests', 'personality'];

        requiredFields.forEach(field => {
            const newChar = {
                name: 'New char',
                age: '20',
                occupation: 'job',
                role: 'Protagonist',
                interests: 'interests',
                personality: 'person'
            };

            it(`responds with 400 and an error message when the ${field} is missing`, () => {
                delete newChar[field];

                return supertest(app)
                    .post('/api/characters')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(newChar)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body` }
                    });
            });
        });

        it(`creates a character, responding with 201 and the new character`, () => {
            const newChar = {
                name: 'New char',
                age: '20',
                occupation: 'job',
                role: 'Protagonist',
                interests: 'interests',
                personality: 'person',
                project: 1
            };

            return supertest(app)
                .post(`/api/characters`)
                .send(newChar)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(201)
                .expect(res => {
                    expect(res.body.name).to.eql(newChar.name);
                    expect(res.body.age).to.eql(newChar.age);
                    expect(res.body.occupation).to.eql(newChar.occupation);
                    expect(res.body.role).to.eql(newChar.role);
                    expect(res.body.interests).to.eql(newChar.interests);
                    expect(res.body.personality).to.eql(newChar.personality);
                    expect(res.body.project).to.eql(newChar.project);
                    expect(res.body).to.have.property('character_id');
                    expect(res.header.location).to.eql(`/api/characters/${res.body.character_id}`);
                })
                .then(postRes => {
                    supertest(app)
                        .get(`/api/characters/${postRes.character_id}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(postRes.body);
                });
        });

        it(`removes XSS attack content from response`, () => {
            const { maliciousCharacter, expectedCharacter } = makeMaliciousCharacter();

            return supertest(app)
                .post('/api/characters')
                .send(maliciousCharacter)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(201)
                .expect(res => {
                    expect(res.body.name).to.eql(expectedCharacter.name);
                    expect(res.body.age).to.eql(expectedCharacter.age);
                    expect(res.body.occupation).to.eql(expectedCharacter.occupation);
                    expect(res.body.role).to.eql(expectedCharacter.role);
                    expect(res.body.interests).to.eql(expectedCharacter.interests);
                    expect(res.body.personality).to.eql(expectedCharacter.personality);
                });
        });
    });

    describe(`PATCH /api/characters/:character_id`, () => {
        context(`Given no characters`, () => {
            it(`responds with 404 when the character doesn't exist`, () => {
                return supertest(app)
                    .patch(`/api/characters/123456`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: { message: `Character doesn't exist` }
                    });
            });
        });

        context(`Given there are characters in the database`, () => {
            const testUsers = makeUsersArray();
            const testProjects = makeProjectsArray();
            const testCharacters = makeCharactersArray();

            beforeEach('insert characters', () => {
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

            it(`responds with 204 and updates the character`, () => {
                const idToUpdate = 1;
                const updateCharacter = {
                    name: 'updated name',
                    age: 'updated age',
                    occupation: 'update occupation',
                    role: 'updated role',
                    interests: 'updated interests',
                    personality: 'updated personality'
                };
                const expectedCharacter = {
                    ...testCharacters[idToUpdate - 1],
                    ...updateCharacter
                };

                return supertest(app)
                    .patch(`/api/characters/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(updateCharacter)
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/characters/${idToUpdate}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedCharacter)
                    );
            });

            it(`responds with 204 when updating only a subset of fields`, () => {
                const idToUpdate = 1;
                const updateCharacter = {
                    name: 'updated name'
                };
                const expectedCharacter = {
                    ...testCharacters[idToUpdate - 1],
                    ...updateCharacter
                };

                return supertest(app)
                    .patch(`/api/characters/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send({
                        ...updateCharacter,
                        fieldToIgnore: 'should not be in GET response'
                    })
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/characters/${idToUpdate}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedCharacter)
                    );
            });
        });
    });
});