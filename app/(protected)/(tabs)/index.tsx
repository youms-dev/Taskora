import { Container } from "@/components/container";
import { TasksFooter } from "@/components/tasks/footer";
import { PositionType, TasksHeader } from "@/components/tasks/header";
import { TasksPager } from "@/components/tasks/pager";
import { TasksSearch } from "@/components/tasks/search";
import { useTasksData } from "@/hooks/tasks/use-tasks-data";
import { event, FOLDERS_CHANGED, TASKS_CHANGED } from "@/lib/event-emitter";
import { useEffect } from "react";
import { useSharedValue } from "react-native-reanimated";

export default function Tasks() {
    const context = useTasksData();
    const foldersModalActive = useSharedValue<boolean>(false);
    const position = useSharedValue<PositionType>(null);

    useEffect(() => {
        const onTasksEdited = () => {
            context.handleGetTasks(true);
            context.handleGetTasksCount();
        }
        const onFolderCreated = () => {
            context.handleGetTasks(true);
            context.handleGetFolders();
            context.handleGetTasksCount();
            context.handleGetFoldersCount();
        }

        event.addListener(TASKS_CHANGED, onTasksEdited);
        event.addListener(FOLDERS_CHANGED, onFolderCreated);

        return () => {
            event.removeListener(TASKS_CHANGED);
            event.removeListener(FOLDERS_CHANGED);
        }
    }, []);

    return (
        <Container centerX>
            <TasksHeader
                context={context}
                foldersModalActive={foldersModalActive}
                position={position}
            />

            <TasksPager
                context={context}
                foldersModalActive={foldersModalActive}
                position={position}
            />

            <TasksSearch context={context} />

            <TasksFooter context={context} />
        </Container>
    );
}