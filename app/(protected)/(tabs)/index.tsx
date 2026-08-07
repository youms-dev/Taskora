import { Container } from "@/components/container";
import { TasksFooter } from "@/components/tasks/footer";
import { TasksHeader } from "@/components/tasks/header";
import { TasksPager } from "@/components/tasks/pager";
import { TasksSearch } from "@/components/tasks/search";
import { TasksDataProvider } from "@/hooks/tasks/use-tasks-data";

export default function Tasks() {
    // const { width, height } = useWindowDimensions();
    // const { setToast, setDismiss } = useToast();
    // const [value, setValue] = useState<string>("");
    // const router = useRouter();
    // const { theme } = useTheme();
    // const [tasks, setTasks] = useState<TaskType[]>([]);
    // const tasksTmp = useRef<TaskType[]>([]);
    // const limit = 10;
    // const [count, setCount] = useState<number>(0);
    // const [countTmp, setCountTmp] = useState<number>(0);
    // const [tasksSelected, setTasksSelected] = useState<TaskType[]>([]);
    // const pathname = usePathname();
    // const otherElement = Gesture.Native();
    // const scrollYShared = useSharedValue<number>(0);
    // const [left, setLeft] = useState<number>(0);
    // const syncLoading = useRef<boolean>(false);
    // const synced = useRef<boolean>(false);
    // const { t } = useTranslation();
    // const showButtonTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    // const tasksSelectedShared = useSharedValue<boolean>(false);
    // const scrollCheckPoint = 100;
    // const themeShared = useSharedValue<typeof theme>(theme);
    // const showAddTaskButton = useSharedValue<boolean>(true);
    // const [folders, setFolders] = useState<FolderType[]>([]);
    // const selectLimit = 50;
    // const tasksFlatListRef = useRef<FlatList>(null);
    // const taskHeight = 100;
    // const tasksGap = 20;
    // const getTaskTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    // const scrollTimeout = useRef<ReturnType<typeof setTimeout>>(null);
    // const quietProcessing = useSharedValue<boolean>(false);
    // const [processing, setProcessing] = useState<boolean>(false);
    // const showFilter = useSharedValue<boolean>(true);
    // const { syncTasks, getTasks, searchTasks, deleteTasks, toggleArchiveTasks, getTasksCount } = useTasks();
    // const [tasksSearch, setTasksSearch] = useState<TaskType[]>([]);
    // const [searchSectionActive, setSearchSectionActive] = useState<boolean>(false);
    // const [countSearch, setCountSearch] = useState<number>(0);
    // const [searchLoading, setSearchLoading] = useState<boolean>(false);
    // const [currentFilter, setCurrentFilter] = useState<number>(1);
    // const [currentFolder, setCurrentFolder] = useState<FolderType["idFolder"] | null>(null);
    // const foldersFlatListRef = useRef<FlatList>(null);
    // const filterScrollViewRef = useRef<ScrollView>(null);
    // const { getFolders } = useFolders();
    // const flatListsRef = useRef<{
    //     id: string;
    //     value: FlatList;
    // }[]>([]);
    // const [filterLoading, setFilterLoading] = useState<boolean>(false);
    // const loadingRef = useRef<boolean>(false);
    // const [loading, setLoading] = useState<boolean>(false);
    // const contentsSize = useRef<number[]>([]);
    // const [scrollY, setScrollY] = useState<number>(0);
    // const refreshTranslateY = useSharedValue<number>(0);
    // const timeout = useSharedValue<ReturnType<typeof setTimeout>>(0);

    // const showScrollButton = useSharedValue<boolean>(false);

    // const syncData = useCallback(async (position: number = 0) => {
    //     if (pathname != "/" || syncLoading.current) return;
    //     try {
    //         syncLoading.current = true;
    //         await syncTasks(position);
    //         synced.current = true;
    //         syncLoading.current = false;
    //         console.log("synced");
    //     }
    //     catch (e) {
    //         syncLoading.current = false;
    //         synced.current = false;
    //         console.log(e);
    //     }
    // }, [pathname]);

    // const handleGetTasks = useCallback(async (refresh: boolean = false) => {
    //     getTaskTimeout.current && clearTimeout(getTaskTimeout.current);
    //     if (pathname != "/" || loadingRef.current || processing) {
    //         return;
    //     }

    //     getTaskTimeout.current = setTimeout(async () => {
    //         setTasksSelected([]);
    //         setCountTmp(0);
    //         tasksTmp.current = [];
    //         setValue("");

    //         try {
    //             if (refresh) {
    //                 quietProcessing.value = true;
    //                 setProcessing(true);
    //             }
    //             else {
    //                 loadingRef.current = true;
    //                 setLoading(true);
    //             }
    //             const data = await getTasks(limit, refresh ? 0 : tasks.length) as TaskType[];

    //             if (refresh) setTasks(data);
    //             else setTasks(prev => [...prev, ...data.filter(item => !prev.find(t => t.idTask == item.idTask))]);

    //             if (!synced.current) syncData(data.length);
    //             refreshTranslateY.value = withTiming(0, {
    //                 duration: 200,
    //                 easing: Easing.inOut(Easing.quad),
    //             });
    //             quietProcessing.value = false;
    //             loadingRef.current = false;
    //             setLoading(false);
    //             setProcessing(false);
    //         }
    //         catch (e) {
    //             refreshTranslateY.value = withTiming(0, {
    //                 duration: 200,
    //                 easing: Easing.inOut(Easing.quad),
    //             });
    //             setLoading(false);
    //             setProcessing(false);
    //             setToast("Aucune connexion internet", "error");
    //             console.log(e);
    //         }
    //     }, 0);
    // }, [pathname, tasks, loading, processing]);

    // const handleGetCount = useCallback(async () => {
    //     if (pathname != "/") return;
    //     try {
    //         const data = await getTasksCount() as number;

    //         setCount(data);
    //     }
    //     catch (e) {
    //         setToast("Aucune connexion internet", "error");
    //         console.log(e);
    //     }
    // }, [pathname]);

    // const handleFilter = useCallback((entry: null | boolean) => {
    //     if (filterLoading) return;
    //     setFilterLoading(true);
    //     if (tasksTmp.current.length == 0) tasksTmp.current = tasks;
    //     countTmp == 0 && setCountTmp(count);
    //     if (entry == null) {
    //         tasksTmp.current.length > 0 && setTasks(tasksTmp.current);
    //         countTmp > 0 && setCount(countTmp);
    //         tasksTmp.current = [];
    //         setCountTmp(0);
    //         setFilterLoading(false);
    //         return;
    //     }
    //     const result = (tasksTmp.current.length == 0 ? tasks : tasksTmp.current).filter((task) => task.done == entry);

    //     setTasks(result);
    //     setCount(result.length);
    //     setFilterLoading(false);
    // }, [countTmp, tasks]);

    // const toggleShowScrollButton = () => {
    //     showButtonTimeout.current && clearTimeout(showButtonTimeout.current);
    //     showScrollButton.value = true;
    //     showButtonTimeout.current = setTimeout(() => {
    //         showScrollButton.value = false;
    //     }, 1000);
    // }

    // useAnimatedReaction(
    //     () => scrollYShared.value,
    //     (current) => {
    //         if (current > 0) {
    //             !showScrollButton.value && runOnJS(toggleShowScrollButton)();
    //         }
    //         else {
    //             showScrollButton.value = false;
    //         }
    //     }
    // );

    // // const handleScroll = useAnimatedScrollHandler({
    // //     onScroll: (e) => {
    // //         const y = e.contentOffset.y;

    // //         if (y >= 0 && y <= scrollYShared.value) {
    // //             showAddTaskButton.value = true;
    // //         }
    // //         else {
    // //             showAddTaskButton.value = false;
    // //         }

    // //         if (y > 0 && y < scrollYShared.value) {
    // //             runOnJS(toggleShowScrollButton)();
    // //         }
    // //         else {
    // //             showScrollButton.value = false;
    // //         }
    // //         scrollYShared.value = y;
    // //         runOnJS(setScrollYValue)(y);
    // //     }
    // // });

    // useEffect(() => {
    //     themeShared.value = theme;
    // }, [theme]);

    // const selectMap = useMemo(() => new Map(
    //     tasksSelected.map((t, i) => [t.idTask, i + 1]),
    // ), [tasksSelected]);

    // const handleRefresh = useCallback((e: boolean = false) => {
    //     if (e) {
    //         setCount(prev => prev + 1);
    //         tasksTmp.current.length > 0 && setTasks([...tasksTmp.current]);
    //     }
    //     tasksTmp.current = [];
    //     setProcessing(false);
    // }, []);

    // const handleArchiveTask = useCallback((task: TaskType) => {
    //     if (processing || tasksTmp.current.length > 0) return;
    //     setProcessing(true);
    //     tasksTmp.current = [...tasks];
    //     setCount(prev => prev - 1);
    //     if ((tasks.length * 100) <= (height + 100) && tasks.length < count) handleGetTasks();
    //     setTasks(prev => [...prev.filter(t => t.idTask !== task.idTask)]);
    // }, [processing, tasks, height, count]);

    // const handleDeleteTask = useCallback((task: TaskType) => {
    //     if (processing || tasksTmp.current.length > 0) return;
    //     setProcessing(true);
    //     tasksTmp.current = [...tasks];
    //     setCount(prev => prev - 1);
    //     if ((tasks.length * 100) <= (height + 100) && tasks.length < count) handleGetTasks();
    //     setTasks(prev => [...prev.filter(t => t.idTask !== task.idTask)]);
    // }, [processing, tasks, height, count]);

    // const handleLongPress = useCallback((task: TaskType) => {
    //     setTasksSelected(prev => {
    //         const pos = prev.findIndex(t => t.idTask == task.idTask);

    //         if (pos == -1) return [...prev, task];
    //         else return prev.filter(t => t.idTask != task.idTask);
    //     });
    // }, []);

    // const handleTaskPress = useCallback((id: TaskType["idTask"]) => {
    //     if (processing || selectMap.size > 0) return;
    //     console.log("Pressed", id);
    // }, [selectMap, processing]);

    // const isBlocked = useMemo(() => {
    //     return (loading || processing || searchSectionActive);
    // }, [processing, searchSectionActive]);

    // const handleArchive = async () => {
    //     if (tasksSelected.length == 0 || processing || loading) return;
    //     setProcessing(true);
    //     const tab = [...tasksSelected];

    //     tasksTmp.current = tasks;
    //     setTasks(prev => [...prev.filter(t => !tab.find(e => e.idTask == t.idTask))]);
    //     setTasksSelected([]);
    //     setCount(prev => prev - tab.length);

    //     try {
    //         await toggleArchiveTasks([...tab.map(t => t.idTask)], true);
    //         setProcessing(false);
    //         handleGetTasks(true);
    //     }
    //     catch (e) {
    //         console.log(e);
    //         setProcessing(false);
    //         setCount(prev => prev + tab.length);
    //         tasksTmp.current.length > 0 && setTasks(tasksTmp.current);
    //         tasksTmp.current = [];
    //         setToast("Une erreur s'est produite", "error");
    //     }
    // }

    // useEffect(() => {
    //     const { remove } = BackHandler.addEventListener("hardwareBackPress", () => {
    //         if ((tasksTmp.current.length > 0 && countTmp > 0) || selectMap.size > 0) {
    //             tasksTmp.current.length > 0 && setTasks(tasksTmp.current);
    //             countTmp > 0 && setCount(countTmp);
    //             setTasksSelected([]);
    //             tasksTmp.current = [];
    //             setCountTmp(0);
    //             selectMap.clear();

    //             return true;
    //         }

    //         return false;
    //     });

    //     return () => remove();
    // }, [tasksSelected, countTmp, selectMap]);

    // const handleGetFolders = useCallback(async () => {
    //     if (pathname != "/") return;
    //     try {
    //         const data = await getFolders() as FolderType[];

    //         setFolders(data);
    //     }
    //     catch (e) {
    //         console.log(e);
    //     }
    // }, [pathname]);

    // useEffect(() => {
    //     loadingRef.current = loading;
    //     quietProcessing.value = processing;
    // }, [loading, processing]);

    // const handleEndReached = useCallback(() => {
    //     if (loading || currentFolder || tasks.length >= count || processing) return;
    //     handleGetTasks();
    // }, [loading, tasks, count]);

    // const currentIndex = useMemo(() => {
    //     if (!currentFolder) return 0;
    //     const i = flatListsRef.current.findIndex(f => f.id == currentFolder);

    //     return i <= 0 ? 0 : i;
    // }, [folders, currentFolder]);

    // const folderDataMap = useMemo(() => {
    //     const map = new Map(
    //         folders.map(folder => [folder.idFolder, tasks.filter(t => t.idFolder == folder.idFolder)]),
    //     );

    //     return map;
    // }, [tasks, folders]);

    // const onFolderPress = useCallback((folder: FolderType, index: number) => {
    //     if ((!currentFolder && index == 0) || (currentFolder && folder.idFolder == currentFolder)) return;
    //     setCurrentFolder(index == 0 ? null : folder.idFolder);
    //     setTasksSelected([]);
    //     flatListsRef.current && flatListsRef.current.forEach(item => {
    //         item.value.scrollToOffset({
    //             offset: 0,
    //             animated: false,
    //         });
    //     });
    //     tasksFlatListRef.current?.scrollToOffset({
    //         offset: index == 0 ? 0 : (index * width),
    //         animated: true,
    //     });
    //     foldersFlatListRef.current?.scrollToOffset({
    //         offset: index == 0 ? 0 : (index * 100),
    //         animated: true,
    //     });

    //     if (contentsSize.current[index] < height) {
    //         flatListsRef.current && flatListsRef.current[index]?.value.scrollToOffset({
    //             offset: 0,
    //             animated: true,
    //         });
    //     }
    //     else {
    //         flatListsRef.current && flatListsRef.current[index]?.value.scrollToOffset({
    //             offset: scrollCheckPoint,
    //             animated: true,
    //         });
    //     }
    // }, [folders, height, currentFolder]);

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