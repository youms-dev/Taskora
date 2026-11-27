import { FolderType } from "@/types/database/folder";
import { TaskType } from "@/types/database/task";
import { UserType } from "@/types/database/user";
import { cancelScheduledNotificationAsync, dismissNotificationAsync } from "expo-notifications";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSharedValue } from "react-native-reanimated";
import { useFolders } from "../database/use-folders";
import { useTasks } from "../database/use-tasks";
import { useToast } from "../use-toast";
import { SettingType } from "@/types/database/setting";

export const LIMIT = 10;

export const useTasksData = (user: UserType | null, setting: Required<SettingType> | null) => {
    const [tasks, setTasks] = useState<TaskType[]>([]);
    const [folders, setFolders] = useState<FolderType[]>([]);
    const scrollY = useSharedValue<number>(0);
    const [currentFilter, setCurrentFilter] = useState<1 | 2 | 3>(1);
    const [currentFolder, setCurrentFolder] = useState<string | null>(null);
    const { getTasks, getTasksCount, toggleArchiveTasks, deleteTasks, moveTasks, togglePinTask, markTasksDone } = useTasks();
    const loadingRef = useRef<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const { setToast, setDismiss } = useToast();
    const { getFolders, getFoldersCount, deleteFolder } = useFolders();
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
    const [folderSelected, setFolderSelected] = useState<FolderType | null>(null);
    const foldersTmp = useRef<FolderType[]>([]);
    const deleting = useRef<boolean>(false);
    const tasksRef = useRef<TaskType[]>([]);

    const displayedTasks = useMemo(() => {
        if (currentFilter === 2) return tasks.filter(t => t.done);
        if (currentFilter === 3) return tasks.filter(t => !t.done);

        return [
            ...tasks.filter(t => t.pinned),
            ...tasks.filter(t => !t.pinned),
        ];
    }, [tasks, currentFilter]);

    const handleGetTasks = useCallback(async (refresh: boolean = false) => {
        if (loadingRef.current || !user) return;

        setTasksSelected([]);
        tasksCountTmp.current = 0;
        tasksTmp.current = [];

        setLoading(true);
        loadingRef.current = true;

        try {
            const data = await getTasks(
                user.idUser,
                (refresh ?
                    (tasksRef.current.length >= LIMIT ?
                        tasksRef.current.length
                        :
                        LIMIT)
                    :
                    LIMIT
                ),
                (refresh ?
                    0
                    :
                    tasksRef.current.length
                ),
                false,
            ) as TaskType[];

            if (refresh) setTasks(data);
            else setTasks(prev => [...prev, ...data.filter(item => !prev.find(t => t.idTask == item.idTask))]);
        }

        catch (e) {
            setToast(t("sqlite_error"), "error");
        }
        finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [i18n.language, setToast, user]);

    const handleGetTasksCount = useCallback(async () => {
        if (!user) return;

        try {
            const count = await getTasksCount(user.idUser, false) as number;

            setTasksCount(count);
        }
        catch (e) {
            setToast(t("sqlite_error"), "error");
        }
    }, [i18n.language, setToast, user]);

    const handleGetFolders = useCallback(async () => {
        if (!user) return;

        try {
            const data = await getFolders(user.idUser) as FolderType[];

            setFolders(data);
        }
        catch { }
    }, [user]);

    const handleGetFoldersCount = useCallback(async () => {
        if (!user) return;

        try {
            const count = await getFoldersCount(user.idUser) as number;

            setFoldersCount(count);
        }
        catch { }
    }, [user]);

    const handleCurrentFilter = useCallback((value: 1 | 2 | 3) => {
        if (loadingRef.current) return;
        setCurrentFilter(value);
    }, []);

    const handleArchiveTasks = useCallback(async () => {
        if (!selectMap.current || selectMap.current.size == 0 || loadingRef.current || !user) return;

        setLoading(true);
        loadingRef.current = true;

        const selected = [...tasksSelected];

        tasksTmp.current = [...tasksRef.current];
        setTasks(prev => [...prev.filter(t => !selectMap.current?.has(t.idTask))]);
        setTasksCount(prev => prev - selected.length);
        setTasksSelected([]);

        try {
            await toggleArchiveTasks([...selected.map(t => t.idTask)], true);

            await Promise.all(selected.map(async (task) => {
                await cancelScheduledNotificationAsync(task.notificationId);
                await dismissNotificationAsync(task.notificationId);
            }));

            setToast(t("tasks_archived", { many: selected.length > 1 ? "s" : "" }));

            tasksTmp.current = [];
            if (tasksRef.current.length <= tasksCount) {
                setLoading(false);
                loadingRef.current = false;
                await handleGetTasks(true);
            }
        }
        catch (e) {
            setTasksCount(prev => prev + selected.length);
            tasksTmp.current.length > 0 && setTasks([...tasksTmp.current]);
            setToast(t("sqlite_error"), "error");
        }
        finally {
            setLoading(false);
            loadingRef.current = false;
            tasksTmp.current = [];
        }
    }, [tasksSelected, tasksCount, i18n.language, setToast, handleGetTasks, user]);

    const handleArchiveTask = useCallback(async (task: TaskType) => {
        if (loadingRef.current) return;

        setLoading(true);
        loadingRef.current = true;

        tasksTmp.current = [...tasksRef.current];
        setTasks(prev => [...prev.filter(t => t.idTask != task.idTask)]);
        setTasksCount(prev => prev - 1);

        try {
            await toggleArchiveTasks([task.idTask], true);
            await cancelScheduledNotificationAsync(task.notificationId);
            await dismissNotificationAsync(task.notificationId);

            setToast(t("tasks_archived"));
            tasksTmp.current = [];

            if (tasksRef.current.length <= tasksCount) {
                setLoading(false);
                loadingRef.current = false;
                await handleGetTasks(true);
            }
        }
        catch (e) {
            console.log(e);
            tasksTmp.current.length > 0 && setTasks([...tasksTmp.current]);
            setTasksCount(prev => prev + 1);
            setToast(t("sqlite_error"), "error");
        }
        finally {
            setLoading(false);
            loadingRef.current = false;
            tasksTmp.current = [];
        }
    }, [tasksCount, i18n.language, setToast, handleGetTasks]);

    const handleDeleteTasks = useCallback(async (init: boolean = true, data: TaskType[] | null = null) => {
        if (loadingRef.current && !data) return;

        if (init) {
            const select = [...tasksSelected];

            deleting.current = true;
            setLoading(true);
            loadingRef.current = true;

            tasksTmp.current = [...tasksRef.current];
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
                    deleting.current = false;
                    loadingRef.current = false;
                });
            return;
        }

        if (!data) {
            tasksTmp.current = [];
            handleGetTasksCount();
            loadingRef.current = false;
            handleGetTasks(true);

            return;
        }

        try {
            await deleteTasks([...data.map(t => t.idTask)]);
            await Promise.all(data.map(async (task) => {
                await cancelScheduledNotificationAsync(task.notificationId);
                await dismissNotificationAsync(task.notificationId);
            }));

            if (tasksRef.current.length <= tasksCount) {
                setLoading(false);
                loadingRef.current = false;
                handleGetTasks(true);
            }
        }
        catch (e) {
            setTasksCount(prev => prev + data.length);
            tasksTmp.current.length > 0 && setTasks(tasksTmp.current);
            setToast(t("sqlite_error"), "error");
        }
        finally {
            deleting.current = false;
            setLoading(false);
            loadingRef.current = false;
            tasksTmp.current = [];
        }
    }, [tasksSelected, tasksCount, i18n.language, setDismiss, setToast, handleGetTasks]);

    const handleDeleteTasksUnsafe = useCallback(async (task: TaskType | null = null) => {
        if (loadingRef.current) return;

        const selected = task ? [task] : [...tasksSelected];

        deleting.current = true;
        setLoading(true);
        loadingRef.current = true;

        tasksTmp.current = [...tasksRef.current];
        setTasks(prev => [...prev.filter(t => {
            if (task) {
                return t.idTask != task.idTask;
            }
            return !selectMap.current?.has(t.idTask);
        })]);
        setTasksSelected([]);
        setTasksCount(prev => prev - selected.length);

        try {
            await deleteTasks([...selected.map(t => t.idTask)]);
            await Promise.all(selected.map(async (task) => {
                await cancelScheduledNotificationAsync(task.notificationId);
                await dismissNotificationAsync(task.notificationId);
            }));

            if (tasksRef.current.length <= tasksCount) {
                setLoading(false);
                loadingRef.current = false;
                handleGetTasks(true);
            }
        }
        catch (e) {
            setTasksCount(prev => prev + selected.length);
            tasksTmp.current.length > 0 && setTasks([...tasksTmp.current]);
            setToast(t("sqlite_error"), "error");
        }
        finally {
            deleting.current = false;
            setLoading(false);
            loadingRef.current = false;
            tasksTmp.current = [];
        }
    }, [tasksSelected, tasksCount, i18n.language, setToast, handleGetTasks]);

    const handleDeleteTask = useCallback(async (task: TaskType, init: boolean = true, data: TaskType | null = null) => {
        if (loadingRef.current && !data) return;

        tasksTmp.current = [...tasksRef.current];

        if (init) {
            deleting.current = true;
            setLoading(true);
            loadingRef.current = true;

            setTasks(prev => [...prev.filter(t => t.idTask != task.idTask)]);
            setTasksCount(prev => prev - 1);

            setDismiss(
                () => handleDeleteTask(task, false, task),
                () => {
                    setTasksCount(prev => prev + 1);
                    tasksTmp.current.length > 0 && setTasks(tasksTmp.current);
                    tasksTmp.current = [];
                    setLoading(false);
                    loadingRef.current = false;
                    deleting.current = false;
                });
            return;
        }

        if (!data) {
            handleGetTasksCount();
            loadingRef.current = false;
            handleGetTasks(true);
            return;
        }

        try {
            await deleteTasks([data.idTask]);
            await cancelScheduledNotificationAsync(data.notificationId);
            await dismissNotificationAsync(data.notificationId);

            if (tasksRef.current.length <= tasksCount) {
                setLoading(false);
                loadingRef.current = false;
                handleGetTasks(true);
            }
        }
        catch (e) {
            tasksTmp.current.length > 0 && setTasks([...tasksTmp.current]);
            setTasksCount(prev => prev + 1);
            setToast(t("sqlite_error"), "error");
        }
        finally {
            setLoading(false);
            tasksTmp.current = [];
            deleting.current = false;
        }
    }, [tasksCount, i18n.language, setDismiss, setToast, handleGetTasks]);

    const handleMoveTasks = useCallback(async (folder: FolderType["idFolder"] | null) => {
        if (loadingRef.current || !selectMap.current || selectMap.current.size == 0) return;

        setLoading(true);
        loadingRef.current = true;

        const selected = [...tasksSelected];

        setTasksSelected([]);

        try {
            await moveTasks(selected.map(t => t.idTask), folder);
            loadingRef.current = false;
            handleGetTasks(true);
        }
        catch (e) {
            setToast(t("sqlite_error"), "error");
        }
        finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [tasksSelected, i18n.language, setToast, handleGetTasks]);

    const handleTogglePinTasks = useCallback(async (pin: boolean) => {
        if (loadingRef.current || !selectMap.current || selectMap.current.size == 0) return;

        setLoading(true);
        loadingRef.current = true;

        const selected = [...tasksSelected];

        setTasksSelected([]);

        try {
            await togglePinTask(selected.map(t => t.idTask), pin);

            if (pin) {
                setTasks(prev => [
                    ...selected.map(t => ({
                        ...t,
                        pinned: true,
                    })),
                    ...prev.filter(t => !selected.some(task => task.idTask == t.idTask)),
                ]);
            }
            else {
                const tasksFormatted = [...selected.map(t => ({
                    ...t,
                    pinned: false,
                }))];

                setTasks(prev => [
                    ...prev.filter(t => !tasksFormatted.some(task => task.idTask == t.idTask) && t.pinned),
                    ...tasksFormatted,
                    ...prev.filter(t => !tasksFormatted.some(task => task.idTask == t.idTask) && !t.pinned),
                ]);
            }
        }
        catch (e) {
            setToast(t("sqlite_error"), "error");
        }
        finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [tasksSelected, i18n.language, setToast]);

    const handleMarkDone = useCallback(async () => {
        if (loadingRef.current || !selectMap.current || selectMap.current.size == 0) return;
        const selected = [...tasksSelected];
        const notDoneTask = selected.some(t => !t.done);

        if (!notDoneTask) return;

        setLoading(true);
        loadingRef.current = true;

        setTasksSelected([]);

        try {
            await markTasksDone(selected.map(t => t.idTask));
            await Promise.all(selected.map(async (task) => {
                await cancelScheduledNotificationAsync(task.notificationId);
                await dismissNotificationAsync(task.notificationId);
            }));

            loadingRef.current = false;
            handleGetTasks(true);
        }
        catch (e) {
            setToast(t("sqlite_error"), "error");
        }
        finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [tasksSelected, i18n.language, setToast, handleGetTasks]);

    const handleDeleteFolder = useCallback(async (init: boolean = true, entry: FolderType) => {
        if (loadingRef.current && init) return;

        if (init) {
            setLoading(true);
            loadingRef.current = true;

            foldersTmp.current = [...folders];
            setFolders(prev => [...prev.filter(f => f.idFolder != entry.idFolder)]);
            setFoldersCount(prev => prev - 1);

            setTasks(prev => [
                ...prev.map(t => {
                    let data = t;

                    if (t.idFolder && t.idFolder == entry.idFolder) {
                        data = {
                            ...t,
                            idFolder: null,
                        }
                    }

                    return data;
                }),
            ]);

            setDismiss(
                () => {
                    handleDeleteFolder(false, entry);
                },
                () => {
                    loadingRef.current = false;
                    handleGetTasks(true);
                    foldersTmp.current.length > 0 && setFolders([...foldersTmp.current]);
                    setFoldersCount(prev => prev + 1);
                    foldersTmp.current = [];
                },
            );

            return;
        }

        try {
            await deleteFolder(entry.idFolder);
        }
        catch (e) {
            loadingRef.current = false;
            handleGetTasks(true);
            setFoldersCount(prev => prev + 1);
            setToast(t("sqlite_error"), "error");
        }
        finally {
            setLoading(false);
            loadingRef.current = false;
            foldersTmp.current = [];
        }
    }, [folders, i18n.language, setDismiss, setToast, selectMap]);

    useEffect(() => {
        tasksRef.current = [...tasks];
    }, [tasks]);

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

    return ({
        tasks: displayedTasks,
        folders,
        currentFolder,
        currentFilter,
        scrollY: scroll,
        loading,
        handleGetTasks,
        handleGetFolders,
        handleGetTasksCount,
        handleGetFoldersCount,
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
        handleMoveTasks,
        handleTogglePinTasks,
        handleMarkDone,
        folderSelected,
        setFolderSelected,
        handleDeleteFolder,
        deleting,
        loadingRef,
        tasksRef,
        handleDeleteTasksUnsafe,
    });
};

export type TasksDataContext = ReturnType<typeof useTasksData>;