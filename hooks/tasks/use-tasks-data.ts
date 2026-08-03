import { TaskType } from "@/types/task";
import { useEffect, useRef, useState } from "react";
import { useTasks } from "../database/use-tasks";
import { useToast } from "../use-toast";

export const LIMIT = 10;

export const useTasksData = () => {
    const [tasks, setTasks] = useState<TaskType[]>([]);
    const loadingRef = useRef<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const syncLoading = useRef<boolean>(false);
    const { syncTasks, getTasks, getTasksCount } = useTasks();
    const synced = useRef<boolean>(false);
    const timeout = useRef<ReturnType<typeof setTimeout>>(null);
    const [processing, setProcessing] = useState<boolean>(false);
    const processingRef = useRef<boolean>(false);
    const { setToast } = useToast();
    const [count, setCount] = useState<number>(0);

    const syncData = async (position: number = 0) => {
        if (syncLoading.current) return;
        try {
            syncLoading.current = true;
            await syncTasks(position);
            synced.current = true;
            syncLoading.current = false;

            console.log("synced");
        }
        catch (e) {
            syncLoading.current = false;
            synced.current = false;
            console.log(e);
        }
    }

    const handleGetTasks = (refresh: boolean = false) => {
        timeout.current && clearTimeout(timeout.current);
        if (loadingRef.current || processingRef.current) {
            return;
        }

        timeout.current = setTimeout(async () => {
            // setTasksSelected([]);
            // setCountTmp(0);
            // tasksTmp.current = [];
            // setValue("");

            try {
                if (refresh) {
                    setProcessing(true);
                }
                else {
                    loadingRef.current = true;
                    setLoading(true);
                }
                const data = await getTasks(LIMIT, refresh ? 0 : tasks.length) as TaskType[];

                if (refresh) setTasks(data);
                else setTasks(prev => [...prev, ...data.filter(item => !prev.find(t => t.idTask == item.idTask))]);

                if (!synced.current) syncData(data.length);
                loadingRef.current = false;
                setLoading(false);
                setProcessing(false);
            }
            catch (e) {
                setLoading(false);
                setProcessing(false);
                setToast("Aucune connexion internet", "error");
                console.log(e);
            }
        }, 0);
    };

    const handleGetCount = async () => {
        try {
            const data = await getTasksCount() as number;

            setCount(data);
        }
        catch (e) {
            setToast("Aucune connexion internet", "error");
            console.log(e);
        }
    };

    useEffect(() => {
        loadingRef.current = loading;
        processingRef.current = processing;
    }, [loading, processing]);

    const handleRefresh = useCallback((e: boolean = false) => {
        if (e) {
            setCount(prev => prev + 1);
            tasksTmp.current.length > 0 && setTasks([...tasksTmp.current]);
        }
        tasksTmp.current = [];
        setProcessing(false);
    }, []);

    const handleArchiveTask = useCallback((task: TaskType) => {
        if (processing || tasksTmp.current.length > 0) return;
        setProcessing(true);
        tasksTmp.current = [...tasks];
        setCount(prev => prev - 1);
        if ((tasks.length * 100) <= (height + 100) && tasks.length < count) handleGetTasks();
        setTasks(prev => [...prev.filter(t => t.idTask !== task.idTask)]);
    }, [processing, tasks, height, count]);

    const handleDeleteTask = useCallback((task: TaskType) => {
        if (processing || tasksTmp.current.length > 0) return;
        setProcessing(true);
        tasksTmp.current = [...tasks];
        setCount(prev => prev - 1);
        if ((tasks.length * 100) <= (height + 100) && tasks.length < count) handleGetTasks();
        setTasks(prev => [...prev.filter(t => t.idTask !== task.idTask)]);
    }, [processing, tasks, height, count]);

    const handleLongPress = useCallback((task: TaskType) => {
        setTasksSelected(prev => {
            const pos = prev.findIndex(t => t.idTask == task.idTask);

            if (pos == -1) return [...prev, task];
            else return prev.filter(t => t.idTask != task.idTask);
        });
    }, []);

    const handleTaskPress = useCallback((id: TaskType["idTask"]) => {
        if (processing || selectMap.size > 0) return;
        console.log("Pressed", id);
    }, [selectMap, processing]);

    const isBlocked = useMemo(() => {
        return (loading || processing || searchSectionActive);
    }, [processing, searchSectionActive]);

    const handleArchive = async () => {
        if (tasksSelected.length == 0 || processing || loading) return;
        setProcessing(true);
        const tab = [...tasksSelected];

        tasksTmp.current = tasks;
        setTasks(prev => [...prev.filter(t => !tab.find(e => e.idTask == t.idTask))]);
        setTasksSelected([]);
        setCount(prev => prev - tab.length);

        try {
            await toggleArchiveTasks([...tab.map(t => t.idTask)], true);
            setProcessing(false);
            handleGetTasks(true);
        }
        catch (e) {
            console.log(e);
            setProcessing(false);
            setCount(prev => prev + tab.length);
            tasksTmp.current.length > 0 && setTasks(tasksTmp.current);
            tasksTmp.current = [];
            setToast("Une erreur s'est produite", "error");
        }
    }

    const handleDelete = async (init: boolean = true) => {
        if (tasksSelected.length == 0 || processing || loading) return;
        setProcessing(true);
        const tab = [...tasksSelected];

        if (init) {
            tasksTmp.current = tasks;
            setTasks(prev => [...prev.filter(t => !tab.find(e => e.idTask == t.idTask))]);
            setTasksSelected([]);
            setCount(prev => prev - tab.length);
            setDismiss(
                () => handleDelete(false),
                () => {
                    setCount(prev => prev + tab.length);
                    tasksTmp.current.length > 0 && setTasks(tasksTmp.current);
                    tasksTmp.current = [];
                    setProcessing(false);
                });
            return;
        }
        try {
            await deleteTasks([...tab.map(t => t.idTask)]);
            setProcessing(false);
            handleGetTasks(true);
        }
        catch (e) {
            console.log(e);
            setProcessing(false);
            setCount(prev => prev + tab.length);
            tasksTmp.current.length > 0 && setTasks(tasksTmp.current);
            tasksTmp.current = [];
            setToast("Une erreur s'est produite", "error");
        }
    }

    return ({
        loading,
        tasks,
    });
}