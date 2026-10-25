import { DataSource, DataSourceOptions } from "typeorm";
import { runSeeders, SeederOptions } from "typeorm-extension";
import { TaskFactory } from "./task.factory";
import { MainSeeder } from "./main.seeder";
import { dataSource } from "../datasource";

const options: DataSourceOptions & SeederOptions = {
    ...dataSource.options,
    factories: [TaskFactory],
    seeds: [MainSeeder]
};

const datasource = new DataSource(options);

datasource.initialize().then(async () => {
    await datasource.synchronize(true);
    await runSeeders(datasource);
    process.exit();
});