const NotesService = {
    getNotes(knex, character) {
        return knex
            .select('*')
            .from('notes')
            .where('character', character)
            .andWhere('active', 1);
    },

    insertNote(knex, newNote) {
        return knex
            .insert(newNote)
            .into('notes')
            .returning('*')
            .then(rows => {
                return rows[0];
            });
    },

    getById(knex, note_id) {
        return knex
            .from('notes')
            .select('*')
            .where('note_id', note_id)
            .first();
    },

    deleteNote(knex, note_id) {
        return knex('notes')
            .where({ note_id })
            .update({ active: 0 });
    },

    updateNote(knex, note_id, newNoteFields) {
        return knex('notes')
            .where({ note_id })
            .update(newNoteFields);
    }
};

module.exports = NotesService;