import { Container } from "@/components/container";
import { TasksFooter } from "@/components/tasks/footer";
import { TasksHeader } from "@/components/tasks/header";
import { TasksPager } from "@/components/tasks/pager";
import { TasksSearch } from "@/components/tasks/search";
import { useTasksData } from "@/hooks/tasks/use-tasks-data";
import { useSharedValue } from "react-native-reanimated";

export default function Tasks() {
    const context = useTasksData();
    const foldersModalActive = useSharedValue<boolean>(false);

    return (
        <Container centerX>
            <TasksHeader
                context={context}
                foldersModalActive={foldersModalActive}
            />

            <TasksPager
                context={context}
                foldersModalActive={foldersModalActive}
            />

            <TasksSearch context={context} />

            <TasksFooter context={context} />
        </Container>
    );
}