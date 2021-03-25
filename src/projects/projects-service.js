const ProjectsService = {
    getProjects(knex, user_id) {
        return knex
            .select('*')
            .from('projects')
            .where('user_id', user_id)
            .andWhere('active', 1);
    },

    insertProject(knex, newProject) {
        return knex
            .insert(newProject)
            .into('projects')
            .returning('*')
            .then(rows => {
                return rows[0];
            });
    },

    getById(knex, project_id) {
        return knex
            .from('projects')
            .select('*')
            .where('project_id', project_id)
            .first();
    },

    // delete by changing active to 0, don't actually fully delete
    deleteProject(knex, project_id) {
        return knex('projects')
            .where({ project_id })
            .update({ active: 0 });
    },

    updateProject(knex, project_id, newProjectFields) {
        return knex('projects')
            .where({ project_id })
            .update(newProjectFields);
    }
};

module.exports = ProjectsService;