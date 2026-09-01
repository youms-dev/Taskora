import { Container } from "@/components/container";
import { TasksFooter } from "@/components/tasks/footer";
import { TasksHeader } from "@/components/tasks/header";
import { TasksPager } from "@/components/tasks/pager";
import { TasksSearch } from "@/components/tasks/search";
import { useTasksData } from "@/hooks/tasks/use-tasks-data";

export default function Tasks() {
    const context = useTasksData();

    console.log("\n")
    console.log("\n");
    // console.log("index data :", context.tasks);

    return (
        <Container centerX>
            <TasksHeader context={context} />

            <TasksPager context={context} />

            <TasksSearch context={context} />

            <TasksFooter context={context} />
        </Container>
    );
}