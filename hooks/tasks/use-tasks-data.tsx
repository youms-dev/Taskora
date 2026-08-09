import { event, TASKS_UNARCHIVED } from "@/lib/event-emitter";
import { FolderType } from "@/types/folder";
import { TaskType } from "@/types/task";
import { createContext, memo, ReactNode, RefObject, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";
import { SharedValue, useSharedValue } from "react-native-reanimated";
import { useFolders } from "../database/use-folders";
import { useTasks } from "../database/use-tasks";
import { useToast } from "../use-toast";

const Context = createContext<{
    tasks: TaskType[];
    folders: FolderType[];
    currentFolder: string | null;
    currentFilter: 1 | 2 | 3;
    scrollY: SharedValue<number>;
    loading: boolean;
    handleGetTasks: (refresh: boolean) => Promise<void>;
    handleGetFolders: (refresh: boolean) => Promise<void>;
    tasksCount: number;
    foldersCount: number;
    refreshTranslateY: SharedValue<number>;
    scrolling: SharedValue<boolean>;
    setCurrentFolder: ((value: string | null) => void);
    pager: RefObject<FlatList | null>;
    searchSectionActive: boolean;
    setSearchSectionActive: ((value: boolean) => void);
    tasksSelected: TaskType[];
    setTasksSelected: ((value: (TaskType[] | ((prev: TaskType[]) => TaskType[]))) => void);
    setCurrentFilter: (value: 1 | 2 | 3) => void;
    handleArchiveTasks: () => void;
    handleDeleteTasks: () => void;
    handleArchiveTask: (task: TaskType) => void;
    handleDeleteTask: (task: TaskType) => void;
} | null>(null);

interface Props {
    children: ReactNode;
}

export const LIMIT = 10;

export const TasksDataProvider = memo(({ children }: Props) => {
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
    const pager = useRef<FlatList>(null);
    const [searchSectionActive, setSearchSectionActive] = useState<boolean>(false);
    const scroll = useMemo(() => scrollY, []);
    const refreshTranslate = useMemo(() => refreshTranslateY, [refreshTranslateY]);
    const isScrolling = useMemo(() => scrolling, []);
    const [tasksSelected, setTasksSelected] = useState<TaskType[]>([]);
    const tasksTmp = useRef<TaskType[]>([]);
    const tasksCountTmp = useRef<number>(0);
    const selectMap = useRef<Map<string, TaskType>>(null);
    const { t, i18n } = useTranslation();

    const syncData = async (position: number = 0) => {
        if (syncLoading.current || synced.current) return;
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
        const entry = tasksTmp.current.length > 0 ? tasksTmp.current : tasks;

        if (value == 1) {
            if (tasksTmp.current.length > 0) {
                setTasks([...tasksTmp.current]);
                tasksTmp.current = [];
                setCurrentFilter(value);
            }
        }
        else if (value == 2) {
            if (tasksTmp.current.length == 0) {
                tasksTmp.current = [...tasks];
            }
            const result = entry.filter(t => t.done);

            setTasks(result);
            setCurrentFilter(value);
        }
        else if (value == 3) {
            if (tasksTmp.current.length == 0) {
                tasksTmp.current = [...tasks];
            }
            const result = entry.filter(t => !t.done);

            setTasks(result);
            setCurrentFilter(value);
        }
    }, [tasks]);

    const handleArchiveTasks = useCallback(async () => {
        if (!selectMap.current || selectMap.current.size == 0 || loadingRef.current) return;
        setLoading(true);
        const selected = [...tasksSelected];

        tasksTmp.current = tasks;
        setTasks(prev => [...prev.filter(t => !selectMap.current?.has(t.idTask))]);
        setTasksSelected([]);
        setTasksCount(prev => prev - selected.length);

        try {
            await toggleArchiveTasks([...selected.map(t => t.idTask)], true);
            setToast(t("archives_unarchive_tasks", { many: selected.length > 1 ? "s" : "" }));
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
        setTasks(prev => [...prev.filter(t => t.idTask != task.idTask)]);
        setTasksCount(prev => prev - 1);

        try {
            await toggleArchiveTasks([task.idTask], true);
            setToast(t("tasks_archived"));
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
            setTasksCount(prev => prev + 1);
            handleGetTasks(true);
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
                    tasksTmp.current.length > 0 && setTasks(tasksTmp.current);
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
            setTasksCount(prev => prev + 1);
            tasksTmp.current = [];
            setLoading(false);
            setToast("Une erreur s'est produite", "error");
        }
    }, [tasks, tasksCount]);

    return (
        <Context.Provider value={{
            tasks,
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
            pager,
            searchSectionActive,
            setSearchSectionActive,
            tasksSelected,
            setTasksSelected,
            setCurrentFilter: handleCurrentFilter,
            handleArchiveTasks,
            handleDeleteTasks,
            handleArchiveTask,
            handleDeleteTask,
        }}>
            {children}
        </Context.Provider>
    );
});

export const useTasksData = () => {
    const ctx = useContext(Context);

    if (!ctx) throw new Error("No TasksDataProvider found");

    return ctx;
};