import { runSeeders } from "typeorm-extension";
import { dataSource } from "../../datasource";

async function main () {
    await dataSource.initialize();
    await runSeeders(dataSource);
}

main();