import { faker } from "@faker-js/faker";

export const DATABASE_NAME = "taskora.db";

function genData(max: number = 100) {
    let tab: string[] = [];

    for (let i = 0; i < max; i++) {
        const nb = Math.random();
        const val = `('${i + 1}', '${faker.lorem.sentence({ min: 5, max: 20 })}', '${faker.lorem.text()}', ${nb > .8 ? 1 : 0})${i < max - 1 ? ',' : ''}`;

        tab = [...tab, val];
    }

    return tab;
}

const init = `
    INSERT INTO task(id_task, title, content, done) VALUES
    ${genData(50).join("")}
    ON CONFLICT (id_task)
    DO NOTHING;
`;

export const INIT_DATABASE = `
    DROP TABLE IF EXISTS Task;
    CREATE TABLE if NOT EXISTS task (
        id_task TEXT PRIMARY KEY,
        title TEXT,
        content TEXT NOT NULL,
        done BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT (datetime('now', 'localtime')),
        updated_at TIMESTAMP DEFAULT (datetime('now', 'localtime'))
    ); 

    ${init} 
    `;