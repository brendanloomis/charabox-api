const path = require('path');
const express = require('express');
const logger = require('../logger');
const xss = require('xss');
const NotesService = require('./notes-service');

const notesRouter = express.Router();
const jsonParser = express.json();

// serializes note information to protect from xss attacks
const serializeNote = note => ({
    note_id: note.note_id,
    note: xss(note.note),
    character: note.character
});

notesRouter
    .route('/')
    .get((req, res, next) => {
        // get character id from query
        const { characterId } = req.query;

        // return an error if the characterId isn't supplied
        if (!characterId) {
            logger.error(`characterId query is required`);
            return res.status(400).json({
                error: {
                    message: `Query must contain characterId`
                }
            });
        }

        // return the notes based on the character id
        NotesService.getNotes(
            req.app.get('db'),
            characterId
        )
            .then(notes => {
                res.json(notes.map(serializeNote))
            })
            .catch(next);
    })
    .post(jsonParser, (req, res, next) => {
        const { note, character } = req.body;
        const newNote = { note, character };

        // return an error if the required fields aren't in the request body
        for (const [key, value] of Object.entries(newNote)) {
            if (value == null) {
                logger.error(`'${key}' is required`);
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body` }
                });
            }
        }

        NotesService.insertNote(
            req.app.get('db'),
            newNote
        )
            .then(note => {
                logger.info(`Note with id ${note.note_id} created.`);
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${note.note_id}`))
                    .json(serializeNote(note));
            })
            .catch(next);
    });

notesRouter
    .route('/:note_id')
    .all((req, res, next) => {
        const { note_id } = req.params;

        NotesService.getById(
            req.app.get('db'),
            note_id
        )
            .then(note => {
                // return a 404 error if the note doesn't exist
                if (!note) {
                    logger.error(`Note with id ${note_id} not found.`);
                    return res.status(404)
                        .json({
                            error: { message: `Note doesn't exist` }
                        });
                }
                res.note = note;
                next();
            })
            .catch(next);
    })
    .get((req, res) => {
        res.json(serializeNote(res.note));
    })
    .delete((req, res, next) => {
        const { note_id } = req.params;

        NotesService.deleteNote(
            req.app.get('db'),
            note_id
        )
            .then(() => {
                logger.info(`Note with id ${note_id} deleted.`);
                res.status(204).end();
            })
            .catch(next);
    })
    .patch(jsonParser, (req, res, next) => {
        const { note, character } = req.body;
        const noteToUpdate = { note, character };
        const { note_id } = req.params;

        // return an error if body doesn't contain any required fields
        const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length;
        if (numberOfValues === 0) {
            logger.error(`Invalid update without required fields`);
            return res.status(400).json({
                error: { message: `Request body must contain either 'note' or 'character'`}
            });
        }

        NotesService.updateNote(
            req.app.get('db'),
            note_id,
            noteToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end();
            })
            .catch(next);
    });

module.exports = notesRouter;