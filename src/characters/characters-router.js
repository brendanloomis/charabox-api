const path = require('path');
const express = require('express');
const logger = require('../logger');
const xss = require('xss');
const CharactersService = require('./characters-service');

const charactersRouter = express.Router();
const jsonParser = express.json();

const serializeCharacter = character => ({
    character_id: character.character_id,
    name: xss(character.name),
    age: xss(character.age),
    occupation: xss(character.occupation),
    role: xss(character.role),
    interests: xss(character.interests),
    personality: xss(character.personality),
    project: character.project
});

charactersRouter
    .route('/')
    .get((req, res, next) => {
        const { projectId } = req.query;

        if(!projectId) {
            logger.error(`projectId query is required`);
            return res.status(400).json({
                error: {
                    message: `Query must contain projectId`
                }
            });
        }

        CharactersService.getCharacters(
            req.app.get('db'),
            projectId
        )
            .then(characters => {
                res.json(characters.map(serializeCharacter))
            })
            .catch(next);
    })
    .post(jsonParser, (req, res, next) => {
        const { name, age, occupation, role, interests, personality, project } = req.body;
        const newChar = { name, age, occupation, role, interests, personality, project };

        for (const [key, value] of Object.entries(newChar)) {
            if (value == null) {
                logger.error(`'${key}' is required`);
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body` }
                });
            }
        }

        CharactersService.insertCharacter(
            req.app.get('db'),
            newChar
        )
            .then(char => {
                logger.info(`Character with id ${char.character_id} created.`);
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${char.character_id}`))
                    .json(serializeCharacter(char));
            })
            .catch(next);
    });

charactersRouter
    .route('/:character_id')
    .all((req, res, next) => {
        const { character_id } = req.params;

        CharactersService.getById(
            req.app.get('db'),
            character_id
        )
            .then(char => {
                if (!char) {
                    logger.error(`Character with id ${character_id} not found.`);
                    return res.status(404)
                        .json({
                            error: { message: `Character doesn't exist` }
                        });
                }
                res.character = char;
                next();
            })
            .catch(next);
    })
    .get((req, res) => {
        res.json(serializeCharacter(res.character));
    })
    .delete((req, res, next) => {
        const { character_id } = req.params;

        CharactersService.deleteCharacter(
            req.app.get('db'),
            character_id
        )
            .then(() => {
                logger.info(`Character with id ${character_id} deleted.`);
                res.status(204).end();
            })
            .catch(next);
    })
    .patch(jsonParser, (req, res, next) => {
        const { name, age, occupation, role, interests, personality, project } = req.body;
        const characterToUpdate = { name, age, occupation, role, interests, personality, project };
        const { character_id } = req.params;

        const numberOfValues = Object.values(characterToUpdate).filter(Boolean).length;
        if (numberOfValues === 0) {
            logger.error(`Invalid update without required fields`);
            return res.status(400).json({
                error: { message: `Request body must contain 'name', 'age', 'occupation', 'role', 'interests', 'personality', or 'project'`}
            });
        }

        CharactersService.updateCharacter(
            req.app.get('db'),
            character_id,
            characterToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end();
            })
            .catch(next);
    });

module.exports = charactersRouter;