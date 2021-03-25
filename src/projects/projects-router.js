const path = require('path');
const express = require('express');
const logger = require('../logger');
const ProjectsService = require('./projects-service');
const xss = require('xss');

const projectsRouter = express.Router();
const jsonParser = express.json();

// serializes project information to protect from xss attacks
const serializeProject = project => ({
    project_id: project.project_id,
    project_name: xss(project.project_name),
    project_type: xss(project.project_type),
    project_summary: xss(project.project_summary),
    user_id: project.user_id
});

projectsRouter
    .route('/')
    .get((req, res, next) => {
        // get user id from the query
        const { userId } = req.query;

        // return an error if the userId isn't supplied
        if(!userId) {
            logger.error(`userId query is required`);
            return res.status(400).json({
                error: {
                    message: `Query must contain 'userId'`
                }
            });
        }

        // return the projects based on the user id
        ProjectsService.getProjects(
            req.app.get('db'),
            userId
        )
            .then(projects => {
                res.json(projects.map(serializeProject));
            })
            .catch(next);
    })
    .post(jsonParser, (req, res, next) => {
        const { project_name, project_type, project_summary, user_id } = req.body;
        const newProject = { project_name, project_type, project_summary, user_id };

        // return an error if the required fields aren't in the request body
        for (const [key, value] of Object.entries(newProject)) {
            if (value == null) {
                logger.error(`'${key}' is required`);
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body` }
                });
            }
        }

        ProjectsService.insertProject(
            req.app.get('db'),
            newProject
        )
            .then(project => {
                logger.info(`Project with id ${project.project_id} created.`);
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${project.project_id}`))
                    .json(serializeProject(project));
            })
            .catch(next);
    });

projectsRouter
    .route('/:project_id')
    .all((req, res, next) => {
        const { project_id } = req.params;

        ProjectsService.getById(
            req.app.get('db'),
            project_id
        )
            .then(project => {
                // return a 404 error if the project doesn't exist
                if (!project) {
                    logger.error(`Project with id ${project_id} not found.`);
                    return res.status(404).json({
                        error: { message: `Project doesn't exist` }
                    });
                }
                res.project = project;
                next();
            })
            .catch(next);
    })
    .get((req, res, next) => {
        res.json(serializeProject(res.project));
    })
    .delete((req, res, next) => {
        const { project_id } = req.params;
        
        ProjectsService.deleteProject(
            req.app.get('db'),
            project_id
        )
            .then(() => {
                logger.info(`Project with id ${project_id} deleted.`);
                res.status(204).end();
            })
            .catch(next);
    })
    .patch(jsonParser, (req, res, next) => {
        const { project_name, project_type, project_summary } = req.body;
        const projectToUpdate = { project_name, project_type, project_summary };
        const { project_id } = req.params;

        // return an error if the body doesn't contain any required fields
        const numberOfValues = Object.values(projectToUpdate).filter(Boolean).length;
        if (numberOfValues === 0) {
            logger.error(`Invalid update without required fields`);
            return res.status(400).json({
                error: { message: `Request body must contain at least one of 'project_name', or 'project_type', 'project_summary'`}
            });
        }

        ProjectsService.updateProject(
            req.app.get('db'),
            project_id,
            projectToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end();
            })
            .catch(next);
    })

module.exports = projectsRouter;