import { Faker } from "@faker-js/faker";
import { setSeederFactory } from "typeorm-extension";
import { Task, TaskType } from "../entities/task.entity";

export const TaskFactory = setSeederFactory(Task, (faker: Faker) => {
    const task = new Task();
    const nb = Math.random();
    let pinned = 0;

    if (nb > .6) {
        const n = Math.random();

        task.title = n > .2 ? faker.lorem.sentence({ min: 2, max: 10 }) : undefined;
        task.content = faker.lorem.sentences();
        task.pinned = pinned < 3 ? true : undefined;
        task.startAt = (new Date).getTime() + (60_000 * 60 * 2);
        task.type = TaskType.TASK;

        pinned < 3 && pinned++;
    }
    else {
        const n = Math.random();

        task.title = faker.lorem.sentence({ min: 2, max: 10 });
        task.content = n > .2 ? faker.lorem.sentences() : undefined;
        task.startAt = (new Date).getTime() + (60_000 * 60 * 2);
        task.endAt = new Date(task.startAt + (60_000 * 60 * 1));
        task.remindBefore = 30;
        task.type = TaskType.EVENT;
    }

    return task;
})