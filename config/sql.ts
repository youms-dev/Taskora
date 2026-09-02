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
    let pinnedCount: number = 0;

    for (let i = 0; i < foldersCount; i++) {
        folders.push({
            id_folder: createId(),
            title: faker.lorem.word(),
        });
    }

    for (let i = 0; i < tasksCount; i++) {
        const nb = Math.random();
        let entry: Omit<SQLiteTaskType, "archived" | "created_at" | "updated_at">;
        const date = new Date();

        if (nb > .75) {
            const onb = Math.random();

            entry = {
                id_task: createId(),
                title: faker.lorem.sentence({ min: 5, max: 20 }),
                content: onb > .5 ? faker.lorem.text() : undefined,
                icon: onb > .2 ? JSON.stringify({
                    name: "activity",
                    packageName: "Feather",
                }) : undefined,
                done: undefined,
                start_at: new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours() + 1, date.getMinutes(), date.getSeconds()).getTime(),
                end_at: new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours() + 5, date.getMinutes(), date.getSeconds()),
                remind_before: 30,
                type: "event",
            }
        }
        else {
            const onb = Math.random();

            entry = {
                id_task: createId(),
                title: onb > 0.6 ? faker.lorem.sentence({ min: 5, max: 20 }) : undefined,
                content: faker.lorem.text(),
                icon: onb > .6 ? JSON.stringify({
                    name: "briefcase",
                    packageName: "Entypo",
                }) : undefined,
                done: Number(onb > 0.7),
                start_at: new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours() + 1, date.getMinutes(), date.getSeconds()).getTime(),
                type: "task",
                pinned: pinnedCount < 3 ? 1 : 0,
            }

            if (pinnedCount < 3) {
                pinnedCount++;
            }
        }

        tasks.push(entry);
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

    INSERT INTO task(id_task, id_folder, title, content, icon, done, start_at, end_at, type, remind_before, pinned) VALUES
    ${tasks.map((task, i) =>
    `(
        "${task.id_task}", 
        ${task.id_folder ? `"${task.id_folder}"` : null},
        ${task.title ? `"${escapeSql(task.title)}"` : null}, 
        ${task.content ? `"${escapeSql(task.content)}"` : null}, 
        ${task.icon ? `"${escapeSql(task.icon)}"` : null}, 
        ${task.done ? 1 : 0},
        "${task.start_at}",
        ${task.end_at ? `"${task.end_at}"` : null},
        "${task.type}",
        ${task.remind_before ?? "NULL"},
        ${task.pinned ? 1 : 0}
    )${i < tasks.length - 1 ? "," : ""}`
).join("")}
    ON CONFLICT (id_task)
    DO NOTHING;
`;

export const INIT_DATABASE = `
    DROP TABLE IF EXISTS task;
    DROP TABLE IF EXISTS folder;

    CREATE TABLE if NOT EXISTS folder (
        id_folder TEXT PRIMARY KEY NOT NULL,
        title TEXT,
        created_at TIMESTAMP DEFAULT (datetime('now', 'localtime')),
        updated_at TIMESTAMP DEFAULT (datetime('now', 'localtime'))
    ); 
    
    CREATE TABLE if NOT EXISTS task (
        id_task TEXT PRIMARY KEY NOT NULL,
        id_folder TEXT DEFAULT NULL,
        title TEXT DEFAULT NULL,
        content TEXT DEFAULT NULL,
        icon TEXT NULL,
        done BOOLEAN DEFAULT NULL,
        archived BOOLEAN DEFAULT 0,
        start_at INTEGER NOT NULL,
        end_at TIMESTAMP DEFAULT NULL,
        type TEXT NOT NULL CHECK (type IN ('event', 'task')),
        remind_before INTEGER DEFAULT NULL,
        pinned BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT (datetime('now', 'localtime')),
        updated_at TIMESTAMP DEFAULT (datetime('now', 'localtime')),

        FOREIGN KEY (id_folder) REFERENCES folder(id_folder) ON DELETE SET NULL
    );
    
    CREATE INDEX IF NOT EXISTS task_id_folder_id_index ON task(id_task, id_folder);
    CREATE INDEX IF NOT EXISTS task_title_index ON task(title);
    CREATE INDEX IF NOT EXISTS task_start_at_index ON task(start_at);
    
    CREATE INDEX IF NOT EXISTS folder_title_index ON folder(title);

    ${init} 
    `;