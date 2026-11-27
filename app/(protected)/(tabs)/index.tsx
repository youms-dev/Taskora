import { Container } from "@/components/container";
import { TasksFooter } from "@/components/tasks/tasks-footer";
import { PositionType, TasksHeader } from "@/components/tasks/tasks-header";
import { TasksPager } from "@/components/tasks/tasks-pager";
import { TasksSearch } from "@/components/tasks/tasks-search";
import { FOLDERS_CHANGED, TASKS_CHANGED } from "@/constants/emitters";
import { useAuth } from "@/hooks/auth-provider";
import { useSettingsData } from "@/hooks/settings/use-settings-data";
import { useTasksData } from "@/hooks/tasks/use-tasks-data";
import { emitter } from "@/lib/event-emitter";
import { useEffect } from "react";
import { useSharedValue } from "react-native-reanimated";

export default function Tasks() {
    const { user } = useAuth();
    const { setting } = useSettingsData();
    const context = useTasksData(user, setting);
    const foldersModalActive = useSharedValue<boolean>(false);
    const position = useSharedValue<PositionType>(null);

    useEffect(() => {
        if (!user || context.tasksRef.current.length > 0) return;

        context.handleGetTasksCount();
        context.handleGetFoldersCount();
        context.handleGetTasks();
        context.handleGetFolders();
    }, [user]);

    useEffect(() => {
        if (!user) return;

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

        emitter.addListener(TASKS_CHANGED, onTasksEdited);
        emitter.addListener(FOLDERS_CHANGED, onFolderCreated);

        return () => {
            emitter.removeListener(TASKS_CHANGED, onTasksEdited);
            emitter.removeListener(FOLDERS_CHANGED, onFolderCreated);
        }
    }, [user, context.handleGetTasks, context.handleGetTasksCount, context.handleGetFolders, context.handleGetFoldersCount]);

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