import { FolderType } from "@/types/folder";
import { TaskType } from "@/types/task";
import { usePathname } from "expo-router";
import { createContext, memo, ReactNode, RefObject, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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
    selectMap: Map<string, TaskType>;
    setCurrentFilter: (value: 1 | 2 | 3) => void;
} | null>(null);

interface Props {
    children: ReactNode;
}

export const TasksDataProvider = memo(({ children }: Props) => {
    const [tasks, setTasks] = useState<TaskType[]>([]);
    const [folders, setFolders] = useState<FolderType[]>([]);
    const scrollY = useSharedValue<number>(0);
    const [currentFilter, setCurrentFilter] = useState<1 | 2 | 3>(1);
    const [currentFolder, setCurrentFolder] = useState<string | null>(null);
    const { getTasks, syncTasks, getTasksCount } = useTasks();
    const loadingRef = useRef<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const { setToast } = useToast();
    const limit = 10;
    const synced = useRef<boolean>(false);
    const syncLoading = useRef<boolean>(false);
    const { getFolders, getFoldersCount } = useFolders();
    const pathname = usePathname();
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
    const selectMap = useMemo(() => {
        return new Map(
            tasksSelected.map((t, i) => [t.idTask, t])
        );
    }, [tasksSelected]);

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

    const handleGetTasks = async (refresh: boolean = false) => {
        if (loadingRef.current) return;

        // setTasksSelected([]);
        // setCountTmp(0);
        // tasksTmp.current = [];
        // setValue("");

        setLoading(true);
        try {
            const data = await getTasks(limit, refresh ? 0 : tasks.length) as TaskType[];

            if (refresh) setTasks(data);
            else setTasks(prev => [...prev, ...data.filter(item => !prev.find(t => t.idTask == item.idTask))]);

            if (!synced.current) syncData(data.length);
            // refreshTranslateY.value = withTiming(0, {
            //     duration: 200,
            //     easing: Easing.inOut(Easing.quad),
            // });
            // quietProcessing.value = false;
            setLoading(false);
        }
        catch (e) {
            // refreshTranslateY.value = withTiming(0, {
            //     duration: 200,
            //     easing: Easing.inOut(Easing.quad),
            // });
            setLoading(false);
            setToast("Aucune connexion internet", "error");
            console.log(e);
        }
    };

    useEffect(() => {
        loadingRef.current = loading;
    }, [loading]);

    const handleGetFolders = async () => {
        try {
            const data = await getFolders() as FolderType[];

            setFolders(data);
        }
        catch (e) {
            console.log(e);
        }
    };

    useEffect(() => {
        if (pathname == "/") {
            handleGetTasks();
            handleGetFolders();
        }
    }, [pathname]);

    const handleCurrentFilter = useCallback((value: 1 | 2 | 3) => {
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
            selectMap,
            setCurrentFilter: handleCurrentFilter,
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