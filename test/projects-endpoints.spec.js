const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const app = require('../src/app');
const { makeUsersArray } = require('./users.fixtures');
const { makeProjectsArray, makeMaliciousProject } = require('./projects.fixtures');

describe(`Projects Endpoints`, () => {
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

        beforeEach('insert projects', () => {
            return db
                .into('users')
                .insert(testUsers)
                .then(() => {
                    return db
                        .into('projects')
                        .insert(testProjects)
                });
        });

        it(`responds with 401 Unauthorized for GET /api/projects`, () => {
            return supertest(app)
                .get('/api/projects')
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for POST /api/projects`, () => {
            return supertest(app)
                .post('/api/projects')
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for GET /api/projects/:project_id`, () => {
            const project = testProjects[0];
            return supertest(app)
                .get(`/api/projects/${project.project_id}`)
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for DELETE /api/projects/:project_id`, () => {
            const project = testProjects[0];
            return supertest(app)
                .delete(`/api/projects/${project.project_id}`)
                .expect(401, { error: 'Unauthorized request' });
        });

        it(`responds with 401 Unauthorized for PATCH /api/projects/:project_id`, () => {
            const project = testProjects[0];
            return supertest(app)
                .patch(`/api/projects/${project.project_id}`)
                .expect(401, {error: 'Unauthorized request' });
        });
    });

    describe(`GET /api/projects`, () => {
        context(`Given no projects`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/projects?userId=1')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, []);
            });
        });

        context(`Given there are projects in the database`, () => {
            const testUsers = makeUsersArray();
            const testProjects = makeProjectsArray();

            beforeEach('insert projects', () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('projects')
                            .insert(testProjects);
                    });
            });

            it(`responds with 200 and all of the user's projects`, () => {
                const user = testUsers[0];
                const expectedProjects = testProjects.filter(project => project.user_id === user.user_id);
                return supertest(app)
                    .get(`/api/projects?userId=${user.user_id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedProjects);
            });
        });

        context(`Given an XSS attack project`, () => {
            const { maliciousProject, expectedProject } = makeMaliciousProject();
            const testUsers = makeUsersArray();

            beforeEach('insert malicious project', () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('projects')
                            .insert(maliciousProject);
                    });
            });

            it(`removes XSS attack content`, () => {
                return supertest(app)
                    .get(`/api/projects?userId=${maliciousProject.user_id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].project_name).to.eql(expectedProject.project_name);
                        expect(res.body[0].project_type).to.eql(expectedProject.project_type);
                        expect(res.body[0].project_summary).to.eql(expectedProject.project_summary);
                    });
            });
        });
    });

    describe('GET /api/projects/:project_id', () => {
        context(`Given no projects`, () => {
            it(`responds with 404 when project doesn't exist`, () => {
                const projectId = 123456;
                return supertest(app)
                    .get(`/api/projects/${projectId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: { message: `Project doesn't exist` }
                    });
            });
        });

        context(`Given there are projects in the database`, () => {
            const testUsers = makeUsersArray();
            const testProjects = makeProjectsArray();

            beforeEach('insert projects', () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('projects')
                            .insert(testProjects);
                    });
            });

            it(`responds with 200 and the specified project`, () => {
                const projectId = 1;
                const expectedProject = testProjects[projectId - 1];

                return supertest(app)
                    .get(`/api/projects/${projectId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedProject);
            });
        });

        context(`Given an XSS attack project`, () => {
            const testUsers = makeUsersArray();
            const { maliciousProject, expectedProject } = makeMaliciousProject();

            beforeEach('insert malicious project', () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('projects')
                            .insert(maliciousProject);
                    });
            });

            it(`removes XSS attack content`, () => {
                return supertest(app)
                    .get(`/api/projects/${maliciousProject.project_id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.project_name).to.eql(expectedProject.project_name);
                        expect(res.body.project_type).to.eql(expectedProject.project_type);
                        expect(res.body.project_summary).to.eql(expectedProject.project_summary);
                    });
            });
        });
    });

    describe(`DELETE /api/projects/:project_id`, () => {
        context(`Given no projects`, () => {
            it(`responds with 404 when project doesn't exist`, () => {
                return supertest(app)
                    .delete(`/api/projects/123456`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: { message: `Project doesn't exist` }
                    });
            });
        });

        context(`Given there are projects in the database`, () => {
            const testUsers = makeUsersArray();
            const testProjects = makeProjectsArray();

            beforeEach('insert projects', () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('projects')
                            .insert(testProjects);
                    });
            });

            it(`responds with 204 and changes the project to inactive`, () => {
                const idToRemove = 1;
                const projectToRemove = testProjects[idToRemove];
                const usersProjects = testProjects.filter(p => p.user_id === projectToRemove.user_id);
                const expectedProjects = usersProjects.filter(p => p.project_id !== idToRemove);

                return supertest(app)
                    .delete(`/api/projects/${idToRemove}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(() => {
                        supertest(app)
                            .get(`/api/projects?userId=${projectToRemove.user_id}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedProjects);
                    });
            });
        });
    });

    describe(`POST /api/projects`, () => {
        const testUsers = makeUsersArray();

        beforeEach('insert users', () => {
            return db
                .into('users')
                .insert(testUsers);
        });

        const requiredFields = ['project_name', 'project_type', 'project_summary', 'user_id'];

        requiredFields.forEach(field => {
            const newProject = {
                project_name: 'new project',
                project_type: 'Movie',
                project_summary: 'my new movie',
                user_id: 1
            };

            it(`responds with 400 and an error message when the ${field} is missing`, () => {
                delete newProject[field];

                return supertest(app)
                    .post('/api/projects')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(newProject)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body` }
                    });
            });
        });

        it(`creates a project, responding with 201 and the new project`, () => {
            const newProject = {
                project_name: 'new project',
                project_type: 'Movie',
                project_summary: 'my new movie',
                user_id: 1
            };

            return supertest(app)
                .post('/api/projects')
                .send(newProject)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(201)
                .expect(res => {
                    expect(res.body.project_name).to.eql(newProject.project_name);
                    expect(res.body.project_type).to.eql(newProject.project_type);
                    expect(res.body.project_summary).to.eql(newProject.project_summary);
                    expect(res.body).to.have.property('project_id');
                    expect(res.headers.location).to.eql(`/api/projects/${res.body.project_id}`);
                })
                .then(postRes => {
                    supertest(app)
                        .get(`/api/projects/${postRes.body.project_id}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(postRes.body);
                });
        });

        it(`removes XSS attack content from response`, () => {
            const { maliciousProject, expectedProject } = makeMaliciousProject();

            return supertest(app)
                .post('/api/projects')
                .send(maliciousProject)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(201)
                .expect(res => {
                    expect(res.body.project_name).to.eql(expectedProject.project_name);
                    expect(res.body.project_type).to.eql(expectedProject.project_type);
                    expect(res.body.project_summary).to.eql(expectedProject.project_summary);
                });
        });
    });

    describe(`PATCH /api/projects/:project_id`, () => {
        context(`Given no projects`, () => {
            it(`responds with 404 when project doesn't exist`, () => {
                return supertest(app)
                    .patch(`/api/projects/123456`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: { message: `Project doesn't exist` }
                    });
            });
        });

        context(`Given there are projects`, () => {
            const testUsers = makeUsersArray();
            const testProjects = makeProjectsArray();

            beforeEach('insert projects', () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('projects')
                            .insert(testProjects);
                    });
            });

            it(`responds with 204 and updates the project`, () => {
                const idToUpdate = 1;
                const updateProject = {
                    project_name: 'update name',
                    project_type: 'update type',
                    project_summary: 'update summary'
                };
                const expectedProject = {
                    ...testProjects[idToUpdate - 1],
                    ...updateProject
                };

                return supertest(app)
                    .patch(`/api/projects/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(updateProject)
                    .expect(204)
                    .then(res => {
                        supertest(app)
                            .get(`/api/projects/${idToUpdate}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedProject);
                    });
            });

            it(`responds with 204 when updating only a subset of fields`, () => {
                const idToUpdate = 1;
                const updateProject = {
                    project_name: 'updated name'
                };
                const expectedProject = {
                    ...testProjects[idToUpdate - 1],
                    ...updateProject
                };

                return supertest(app)
                    .patch(`/api/projects/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send({
                        ...updateProject,
                        fieldToIgnore: 'should not be in GET response'
                    })
                    .expect(204)
                    .then(res => 
                        supertest(app)
                            .get(`/api/projects/${idToUpdate}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedProject)
                    );
            });
        });
    });
});