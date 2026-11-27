import { setSeederFactory } from "typeorm-extension";
import { SyncChanges } from "../entities/sync_changes.entity";

export const SyncChangesFactory = setSeederFactory(SyncChanges, () => {
    const changes = new SyncChanges();

    return changes;
});