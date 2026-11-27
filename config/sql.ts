import { SQLiteFolderType } from "@/types/database/folder";
import { SQLiteTaskType } from "@/types/database/task";
import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";

export const DATABASE_NAME = "taskora.db";

function escapeSql(value: string): string {
    return value.replace(/"/g, '""');
}

const idUser = createId();

function genData(): {
    folders: Pick<SQLiteFolderType, "id_folder" | "title" | "id_user">[],
    tasks: Omit<SQLiteTaskType, "archived" | "created_at" | "updated_at">[],
} {
    const folders: Pick<SQLiteFolderType, "id_folder" | "title" | "id_user">[] = [];
    let tasks: Omit<SQLiteTaskType, "archived" | "created_at" | "updated_at">[] = [];
    const tasksCount = 50;
    const foldersCount = 5;
    let pinnedCount: number = 0;

    for (let i = 0; i < foldersCount; i++) {
        folders.push({
            id_folder: createId(),
            id_user: idUser,
            title: faker.lorem.word(),
        });
    }

    for (let i = 0; i < tasksCount; i++) {
        const nb = Math.random();
        let entry: Omit<SQLiteTaskType, "archived" | "created_at" | "updated_at">;
        const date = new Date();

        if (nb > .6) {
            const onb = Math.random();

            entry = {
                id_task: createId(),
                id_user: idUser,
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
                notification_id: createId(),
                type: "event",
            }
        }
        else {
            const onb = Math.random();

            entry = {
                id_task: createId(),
                id_user: idUser,
                title: onb > 0.6 ? faker.lorem.sentence({ min: 5, max: 20 }) : undefined,
                content: faker.lorem.text(),
                icon: onb > .6 ? JSON.stringify({
                    name: "briefcase",
                    packageName: "Entypo",
                }) : undefined,
                done: Number(onb > 0.7),
                start_at: new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours() + 1, date.getMinutes(), date.getSeconds()).getTime(),
                pinned: pinnedCount < 3 ? 1 : 0,
                notification_id: createId(),
                type: "task",
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

const initFolders = `
    INSERT INTO folder(id_folder, id_user, title) VALUES
    ${folders.map((folder, i) =>
    `(
        "${folder.id_folder}", 
        "${folder.id_user}", 
        "${escapeSql(folder.title)}")
        ${i < folders.length - 1 ? "," : ""}
    `
).join("")}
    ;
`;

const initTasks = `
    INSERT INTO task(id_task, id_folder, id_user, title, content, icon, done, start_at, end_at, type, remind_before, pinned, notification_id) VALUES
    ${tasks.map((task, i) =>
    `(
        "${task.id_task}", 
        ${task.id_folder ? `"${task.id_folder}"` : null},
        "${task.id_user}", 
        ${task.title ? `"${escapeSql(task.title)}"` : null}, 
        ${task.content ? `"${escapeSql(task.content)}"` : null}, 
        ${task.icon ? `"${escapeSql(task.icon)}"` : null}, 
        ${task.done ? 1 : 0},
        "${task.start_at}",
        ${task.end_at ? `"${task.end_at}"` : null},
        "${task.type}",
        ${task.remind_before ?? "NULL"},
        ${task.pinned ? 1 : 0},
        "${task.notification_id}"
    )${i < tasks.length - 1 ? "," : ""}`
).join("")}
    ON CONFLICT (id_task)
    DO NOTHING;
`;

const initSettings = `
    INSERT INTO setting (id_setting) 
    VALUES (
        "${createId()}"
    );
`;

const drop = `
    DROP TABLE IF EXISTS session;
    DROP TABLE IF EXISTS task;
    DROP TABLE IF EXISTS folder;
    DROP TABLE IF EXISTS user;
    DROP TABLE IF EXISTS setting;
`;

export const SQL_HEADER = `
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
`;

// ${drop}
export const INIT_DATABASE = `
    
    ${SQL_HEADER}

    CREATE TABLE IF NOT EXISTS setting (
        id_setting TEXT PRIMARY KEY NOT NULL,
        language TEXT DEFAULT NULL CHECK (language IN ('fr', 'en')),
        confirm_before_delete BOOLEAN DEFAULT 1,
        notification_sound TEXT DEFAULT '{
            "name": "Sound 2",
            "fileName": "sound02.wav"
        }',
        _2FA BOOLEAN DEFAULT 1,
        auto_sync BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT (datetime('now', 'localtime')),
        updated_at TIMESTAMP DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS user (
        id_user TEXT NOT NULL PRIMARY KEY,
        id_setting TEXT NOT NULL,
        name TEXT DEFAULT NULL,
        email TEXT UNIQUE NOT NULL,
        photo TEXT DEFAULT NULL,
        provider TEXT DEFAULT NULL CHECK (provider IN ('GOOGLE')),
        created_at TIMESTAMP DEFAULT ((datetime('now', 'localtime'))),
        updated_at TIMESTAMP DEFAULT ((datetime('now', 'localtime'))),

        FOREIGN KEY (id_setting) REFERENCES setting(id_setting) ON DELETE CASCADE
    );
    
    CREATE TABLE if NOT EXISTS folder (
        id_folder TEXT PRIMARY KEY NOT NULL,
        id_user TEXT NOT NULL,
        title TEXT,
        created_at TIMESTAMP DEFAULT (datetime('now', 'localtime')),
        updated_at TIMESTAMP DEFAULT (datetime('now', 'localtime')),

        FOREIGN KEY (id_user) REFERENCES user(id_user) ON DELETE CASCADE
    ); 
    
    CREATE INDEX IF NOT EXISTS folder_title_index ON folder(title);
    
    CREATE TABLE if NOT EXISTS task (
        id_task TEXT PRIMARY KEY NOT NULL,
        id_folder TEXT DEFAULT NULL,
        id_user TEXT DEFAULT NULL,
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
        notification_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT (datetime('now', 'localtime')),
        updated_at TIMESTAMP DEFAULT (datetime('now', 'localtime')),
        
        FOREIGN KEY (id_folder) REFERENCES folder(id_folder) ON DELETE SET NULL,
        FOREIGN KEY (id_user) REFERENCES user(id_user) ON DELETE CASCADE
    );
        
    CREATE INDEX IF NOT EXISTS task_id_folder_id_index ON task(id_task, id_folder);
    CREATE INDEX IF NOT EXISTS task_title_index ON task(title);
    CREATE INDEX IF NOT EXISTS task_start_at_index ON task(start_at);
    
    CREATE TABLE IF NOT EXISTS session (
        id_session TEXT NOT NULL PRIMARY KEY,
        id_user TEXT NOT NULL,
        id_device TEXT NOT NULL,
        device_name TEXT NOT NULL,
        device_type TEXT NOT NULL CHECK (device_type IN ('ANDROID', 'IOS')),
        device_brand TEXT NOT NULL,
        device_model TEXT NOT NULL,
        sync_cursor INTEGER NOT NULL DEFAULT 0,
        last_connection TIMESTAMP DEFAULT ((datetime('now', 'localtime'))),
        created_at TIMESTAMP DEFAULT ((datetime('now', 'localtime'))),

        FOREIGN KEY (id_user) REFERENCES user(id_user) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT NOT NULL PRIMARY KEY,
        id_entity TEXT NOT NULL,
        entity_table TEXT NOT NULL CHECK (entity_table IN ('FOLDER', 'TASK')),
        action TEXT NOT NULL CHECK (action IN ('INSERT', 'DELETE')),
        created_at TIMESTAMP DEFAULT ((datetime('now', 'localtime')))
    );

    `;
// ${initSettings}