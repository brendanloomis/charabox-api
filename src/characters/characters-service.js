const CharactersService = {
    getCharacters(knex, project) {
        return knex
            .select('*')
            .from('characters')
            .where('project', project)
            .andWhere('active', 1);
    },

    insertCharacter(knex, newCharacter) {
        return knex
            .insert(newCharacter)
            .into('characters')
            .returning('*')
            .then(rows => {
                return rows[0];
            });
    },

    getById(knex, character_id) {
        return knex
            .from('characters')
            .select('*')
            .where('character_id', character_id)
            .first();
    },

    // delete by changing active to 0, don't actually fully delete
    deleteCharacter(knex, character_id) {
        return knex('characters')
            .where({ character_id })
            .update({ active: 0 });
    },

    updateCharacter(knex, character_id, newCharacterFields) {
        return knex('characters')
            .where({ character_id })
            .update(newCharacterFields);
    }
};

module.exports = CharactersService;