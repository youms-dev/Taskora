import { Faker } from "@faker-js/faker";
import { Task } from "../entities/task.entity";
import { setSeederFactory } from "typeorm-extension";

export const TaskFactory = setSeederFactory(Task, (faker: Faker) => {
    const task = new Task();

    task.content = faker.lorem.sentence();
    task.done = faker.datatype.boolean();

    return task;
})