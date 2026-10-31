import { Faker } from "@faker-js/faker";
import { setSeederFactory } from "typeorm-extension";
import { Folder } from "../entities/folder.entity";

export const FolderFactory = setSeederFactory(Folder, (faker: Faker) => {
    const folder = new Folder();

    folder.title = faker.lorem.words({ min: 1, max: 3 });

    return folder;
});