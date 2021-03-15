CREATE TABLE IF NOT EXISTS characters (
    character_id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    name TEXT NOT NULL,
    age TEXT NOT NULL,
    occupation TEXT NOT NULL,
    role TEXT NOT NULL,
    interests TEXT NOT NULL,
    personality TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    project INTEGER REFERENCES projects(project_id) ON DELETE CASCADE NOT NULL
);