import { Container } from "@/components/container";
import { TasksFooter } from "@/components/tasks/footer";
import { TasksHeader } from "@/components/tasks/header";
import { TasksPager } from "@/components/tasks/pager";
import { TasksSearch } from "@/components/tasks/search";
import { TasksDataProvider } from "@/hooks/tasks/use-tasks-data";

export default function Tasks() {
    return (
        <Container centerX>
            <TasksDataProvider>
                <TasksHeader />

                <TasksPager />

                <TasksSearch />

                <TasksFooter />
            </TasksDataProvider>
        </Container>
    );
}