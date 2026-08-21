import { event, TASKS_UNARCHIVED } from "@/lib/event-emitter";
import { FolderType } from "@/types/folder";
import { TaskType } from "@/types/task";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSharedValue } from "react-native-reanimated";
import { useFolders } from "../database/use-folders";
import { useTasks } from "../database/use-tasks";
import { useToast } from "../use-toast";

export const LIMIT = 10;

export const useTasksData = () => {
    const [tasks, setTasks] = useState<TaskType[]>([]);
    const [folders, setFolders] = useState<FolderType[]>([]);
    const scrollY = useSharedValue<number>(0);
    const [currentFilter, setCurrentFilter] = useState<1 | 2 | 3>(1);
    const [currentFolder, setCurrentFolder] = useState<string | null>(null);
    const { getTasks, syncTasks, getTasksCount, toggleArchiveTasks, deleteTasks } = useTasks();
    const loadingRef = useRef<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const { setToast, setDismiss } = useToast();
    const synced = useRef<boolean>(false);
    const syncLoading = useRef<boolean>(false);
    const { getFolders, getFoldersCount } = useFolders();
    const [tasksCount, setTasksCount] = useState<number>(0);
    const [foldersCount, setFoldersCount] = useState<number>(0);
    const refreshTranslateY = useSharedValue<number>(0);
    const scrolling = useSharedValue<boolean>(false);
    const [searchSectionActive, setSearchSectionActive] = useState<boolean>(false);
    const scroll = useMemo(() => scrollY, []);
    const refreshTranslate = useMemo(() => refreshTranslateY, [refreshTranslateY]);
    const isScrolling = useMemo(() => scrolling, []);
    const [tasksSelected, setTasksSelected] = useState<TaskType[]>([]);
    const tasksTmp = useRef<TaskType[]>([]);
    const tasksCountTmp = useRef<number>(0);
    const selectMap = useRef<Map<string, TaskType>>(null);
    const { t, i18n } = useTranslation();

    const displayedTasks = useMemo(() => {
        if (currentFilter === 2) return tasks.filter(t => t.done);
        if (currentFilter === 3) return tasks.filter(t => !t.done);
        return tasks;
    }, [tasks, currentFilter]);

    const syncData = async (position: number = 0) => {
        if (syncLoading.current || synced.current) return;
        try {
            syncLoading.current = true;
            await syncTasks(position);
            synced.current = true;
            syncLoading.current = false;
        }
        catch (e) {
            syncLoading.current = false;
            synced.current = false;
            console.log(e);
        }
    };

    const handleGetTasks = useCallback(async (refresh: boolean = false) => {
        if (loadingRef.current) return;

        setTasksSelected([]);
        setCurrentFilter(1);
        tasksCountTmp.current = 0;
        tasksTmp.current = [];

        setLoading(true);
        try {
            const data = await getTasks(refresh ? (tasks.length >= LIMIT ? tasks.length : LIMIT) : LIMIT, refresh ? 0 : tasks.length) as TaskType[];

            if (refresh) setTasks(data);
            else setTasks(prev => [...prev, ...data.filter(item => !prev.find(t => t.idTask == item.idTask))]);

            if (!synced.current) syncData(data.length);
            setLoading(false);
        }
        catch (e) {
            setLoading(false);
            setToast("Aucune connexion internet", "error");
            console.log(e);
        }
    }, [tasks]);

    const handleGetTasksCount = useCallback(async () => {
        try {
            const count = await getTasksCount() as number;

            setTasksCount(count);
        }
        catch (e) {
            console.log(e);
            setLoading(false);
            setToast("Aucune connexion internet", "error");
        }
    }, []);

    useEffect(() => {
        loadingRef.current = loading;
    }, [loading]);

    const handleGetFolders = useCallback(async () => {
        try {
            const data = await getFolders() as FolderType[];

            setFolders(data);
        }
        catch (e) {
            console.log(e);
        }
    }, []);

    const handleGetFoldersCount = useCallback(async () => {
        try {
            const count = await getFoldersCount() as number;

            setFoldersCount(count);
        }
        catch (e) {
            console.log(e);
        }
    }, []);

    useEffect(() => {
        handleGetTasksCount();
        handleGetFoldersCount();
        handleGetTasks();
        handleGetFolders();
    }, []);

    const handleCurrentFilter = useCallback((value: 1 | 2 | 3) => {
        if (loadingRef.current) return;
        setCurrentFilter(value);
    }, []);

    const handleArchiveTasks = useCallback(async () => {
        if (!selectMap.current || selectMap.current.size == 0 || loadingRef.current) return;
        setLoading(true);
        const selected = [...tasksSelected];

        tasksTmp.current = tasks;
        setTasks(prev => [...prev.filter(t => !selectMap.current?.has(t.idTask))]);
        setTasksCount(prev => prev - selected.length);
        setTasksSelected([]);

        try {
            await toggleArchiveTasks([...selected.map(t => t.idTask)], true);
            setToast(t("archives_unarchive_tasks", { many: selected.length > 1 ? "s" : "" }));
            tasksTmp.current = [];
            if (tasks.length <= tasksCount) {
                setLoading(false);
                loadingRef.current = false;
                handleGetTasks(true);
            }
            else {
                setLoading(false);
            }
        }
        catch (e) {
            console.log(e);
            setLoading(false);
            setTasksCount(prev => prev + selected.length);
            tasksTmp.current.length > 0 && setTasks([...tasksTmp.current]);
            tasksTmp.current = [];
            setToast("Une erreur s'est produite", "error");
        }
    }, [tasksSelected, tasks, tasksCount, i18n.language]);

    const handleArchiveTask = useCallback(async (task: TaskType) => {
        if (loadingRef.current) return;
        setLoading(true);
        tasksTmp.current = [...tasks];
        setTasks(prev => [...prev.filter(t => t.idTask != task.idTask)]);
        setTasksCount(prev => prev - 1);

        try {
            await toggleArchiveTasks([task.idTask], true);
            setToast(t("tasks_archived"));
            tasksTmp.current = [];
            if (tasks.length <= tasksCount) {
                setLoading(false);
                loadingRef.current = false;
                handleGetTasks(true);
            }
            else {
                setLoading(false);
            }
        }
        catch (e) {
            console.log(e);
            tasksTmp.current.length > 0 && setTasks([...tasksTmp.current]);
            tasksTmp.current = [];
            setTasksCount(prev => prev + 1);
            setToast("Une erreur s'est produite", "error");
        }
    }, [tasks, tasksCount]);

    useEffect(() => {
        if (tasksSelected.length > 0) {
            selectMap.current = new Map(
                tasksSelected.map(t => [t.idTask, t])
            );
        }
        else {
            selectMap.current = null;
        }
    }, [tasksSelected]);

    useEffect(() => {
        const onTaskUnArchived = () => {
            handleGetTasksCount();
            handleGetTasks(true);
        }

        event.addListener(TASKS_UNARCHIVED, onTaskUnArchived);

        return () => {
            event.removeListener(TASKS_UNARCHIVED);
        }
    }, []);

    const handleDeleteTasks = useCallback(async (init: boolean = true, data: TaskType[] | null = null) => {
        if (loadingRef.current && !data) return;

        setLoading(true);

        if (init) {
            const select = [...tasksSelected];

            tasksTmp.current = [...tasks];
            setTasks(prev => [...prev.filter(t => !selectMap.current?.has(t.idTask))]);
            setTasksSelected([]);
            setTasksCount(prev => prev - select.length);
            setDismiss(
                () => handleDeleteTasks(false, select),
                () => {
                    setTasksCount(prev => prev + select.length);
                    tasksTmp.current.length > 0 && setTasks([...tasksTmp.current]);
                    tasksTmp.current = [];
                    setLoading(false);
                });
            return;
        }

        if (!data) {
            tasksTmp.current = [];
            handleGetTasksCount();
            handleGetTasks(true);

            return;
        }

        try {
            await deleteTasks([...data.map(t => t.idTask)]);
            tasksTmp.current = [];
            if (tasks.length <= tasksCount) {
                setLoading(false);
                loadingRef.current = false;
                handleGetTasks(true);
            }
            else {
                setLoading(false);
            }
        }
        catch (e) {
            console.log(e);
            setLoading(false);
            setTasksCount(prev => prev + data.length);
            tasksTmp.current.length > 0 && setTasks(tasksTmp.current);
            tasksTmp.current = [];
            setToast("Une erreur s'est produite", "error");
        }
    }, [tasksSelected, tasks, tasksCount]);

    const handleDeleteTask = useCallback(async (task: TaskType, init: boolean = true, data: TaskType | null = null) => {
        if (loadingRef.current && !data) return;

        setLoading(true);
        tasksTmp.current = [...tasks];

        if (init) {
            setTasks(prev => [...prev.filter(t => t.idTask != task.idTask)]);
            setTasksCount(prev => prev - 1);
            setDismiss(
                () => handleDeleteTask(task, false, task),
                () => {
                    setTasksCount(prev => prev + 1);
                    tasksTmp.current.length > 0 && setTasks(tasksTmp.current);
                    tasksTmp.current = [];
                    setLoading(false);
                });
            return;
        }

        if (!data) {
            handleGetTasksCount();
            handleGetTasks(true);

            return;
        }

        try {
            await deleteTasks([data.idTask]);
            tasksTmp.current = [];
            if (tasks.length <= tasksCount) {
                setLoading(false);
                loadingRef.current = false;
                handleGetTasks(true);
            }
            else {
                setLoading(false);
            }
        }
        catch (e) {
            console.log(e);
            tasksTmp.current.length > 0 && setTasks([...tasksTmp.current]);
            setTasksCount(prev => prev + 1);
            tasksTmp.current = [];
            setLoading(false);
            setToast("Une erreur s'est produite", "error");
        }
    }, [tasks, tasksCount]);

    return ({
        tasks: displayedTasks,
        folders,
        currentFolder,
        currentFilter,
        scrollY: scroll,
        loading,
        handleGetTasks,
        handleGetFolders,
        tasksCount,
        foldersCount,
        refreshTranslateY: refreshTranslate,
        scrolling: isScrolling,
        setCurrentFolder,
        searchSectionActive,
        setSearchSectionActive,
        tasksSelected,
        setTasksSelected,
        setCurrentFilter: handleCurrentFilter,
        handleArchiveTasks,
        handleDeleteTasks,
        handleArchiveTask,
        handleDeleteTask,
    });
};

export type TasksDataContext = ReturnType<typeof useTasksData>;