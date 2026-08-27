import { SQLiteFolderType } from "@/types/folder";
import { SQLiteTaskType } from "@/types/task";
import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";

export const DATABASE_NAME = "taskora.db";

function escapeSql(value: string): string {
    return value.replace(/"/g, '""');
}

function genData(): {
    folders: Pick<SQLiteFolderType, "id_folder" | "title">[],
    tasks: Omit<SQLiteTaskType, "archived" | "created_at" | "updated_at">[],
} {
    const folders: Pick<SQLiteFolderType, "id_folder" | "title">[] = [];
    let tasks: Omit<SQLiteTaskType, "archived" | "created_at" | "updated_at">[] = [];
    const tasksCount = 50;
    const foldersCount = 5;

    for (let i = 0; i < foldersCount; i++) {
        folders.push({
            id_folder: createId(),
            title: faker.lorem.word(),
        });
    }

    for (let i = 0; i < tasksCount; i++) {
        const nb = Math.random();
        let entry = {};
        const date = new Date();

        if (nb > .75) {
            const onb = Math.random();

            entry = {
                id_task: createId(),
                title: faker.lorem.sentence({ min: 5, max: 20 }),
                content: onb > .5 ? faker.lorem.text() : null,
                icon: onb > .2 ? JSON.stringify({
                    name: "activity",
                    packageName: "Feather",
                }) : null,
                done: null,
                planned_date: Date.now(),
                start_at: date,
                end_at: date,
                remind_before: 30,
                type: "event",
            }
        }
        else {
            const onb = Math.random();

            entry = {
                id_task: createId(),
                title: onb > 0.8 ? faker.lorem.sentence({ min: 5, max: 20 }) : undefined,
                content: faker.lorem.text(),
                icon: onb > .6 ? JSON.stringify({
                    name: "briefcase",
                    packageName: "Entypo",
                }) : null,
                done: onb > 0.8,
                planned_date: Date.now(),
                start_at: date,
                type: "task",
            }
        }
        tasks.push(entry as Omit<SQLiteTaskType, "archived" | "created_at" | "updated_at">);
    }

    tasks = tasks.map((task) => {
        const nb = Number((Math.random() * 10).toString().charAt(0));
        const folderIndex = nb > 0 && nb <= foldersCount ? nb - 1 : null;

        return {
            ...task,
            id_folder: folderIndex !== null ? folders[folderIndex].id_folder : undefined,
        };
    });

    return { folders, tasks };
}

const { folders, tasks } = genData();

const init = `
    INSERT INTO folder(id_folder, title) VALUES
    ${folders.map((folder, i) =>
    `(
        "${folder.id_folder}", 
        "${escapeSql(folder.title)}")
        ${i < folders.length - 1 ? "," : ""}
    `
).join("")}
    ;

    INSERT INTO task(id_task, id_folder, title, content, icon, done, planned_date, start_at, end_at, type, remind_before) VALUES
    ${tasks.map((task, i) =>
    `(
        "${task.id_task}", 
        ${task.id_folder ? `"${task.id_folder}"` : null},
        ${task.title ? `"${escapeSql(task.title)}"` : null}, 
        ${task.content ? `"${escapeSql(task.content)}"` : null}, 
        ${task.icon ? `"${escapeSql(task.icon)}"` : null}, 
        ${task.done ? 1 : 0}, 
        ${task.planned_date},
        "${task.start_at}",
        ${task.end_at ? `"${task.end_at}"` : null},
        "${task.type}",
        ${task.remind_before ?? "NULL"}
    )${i < tasks.length - 1 ? "," : ""}`
).join("")}
    ON CONFLICT (id_task)
    DO NOTHING;
`;

export const INIT_DATABASE = `
    DROP TABLE IF EXISTS task;
    DROP TABLE IF EXISTS folder;

    CREATE TABLE if NOT EXISTS folder (
        id_folder TEXT PRIMARY KEY,
        title TEXT,
        created_at TIMESTAMP DEFAULT (datetime('now', 'localtime')),
        updated_at TIMESTAMP DEFAULT (datetime('now', 'localtime'))
    ); 
    
    CREATE TABLE if NOT EXISTS task (
        id_task TEXT PRIMARY KEY,
        id_folder TEXT DEFAULT NULL,
        title TEXT DEFAULT NULL,
        content TEXT DEFAULT NULL,
        icon TEXT NULL,
        done BOOLEAN DEFAULT NULL,
        archived BOOLEAN DEFAULT 0,
        planned_date INTEGER NOT NULL,
        start_at TIMESTAMP NOT NULL,
        end_at TIMESTAMP DEFAULT NULL,
        type TEXT NOT NULL CHECK (type IN ('event', 'task')),
        remind_before INTEGER DEFAULT NULL,
        created_at TIMESTAMP DEFAULT (datetime('now', 'localtime')),
        updated_at TIMESTAMP DEFAULT (datetime('now', 'localtime')),

        FOREIGN KEY (id_folder) REFERENCES folder(id_folder) ON DELETE SET NULL
    );
    
    CREATE INDEX IF NOT EXISTS task_id_folder_id_index ON task(id_task, id_folder);
    CREATE INDEX IF NOT EXISTS task_title_index ON task(title);
    CREATE INDEX IF NOT EXISTS task_planned_date_index ON task(planned_date);
    
    CREATE INDEX IF NOT EXISTS folder_title_index ON folder(title);

    ${init} 
    `;