import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View, useWindowDimensions } from "react-native";

const colors = {
    ink: "#17233B",
    muted: "#8994A7",
    purple: "#7257E8",
    mint: "#31B997",
    border: "#EDF0F5",
};

function CalendarIcon() {
    return (
        <View style={styles.calendarIcon}>
            <View style={styles.calendarTop}>
                <View style={styles.calendarRing} />
                <View style={styles.calendarRing} />
            </View>
            <View style={styles.calendarLine} />
            <View style={styles.calendarDots}>
                <View style={styles.calendarDot} />
                <View style={styles.calendarDot} />
                <View style={styles.calendarDot} />
            </View>
        </View>
    );
}

function CheckMark({ checked = false }: { checked?: boolean }) {
    return (
        <View style={[styles.checkBox, checked && styles.checkBoxDone]}>
            {checked ? <Text style={styles.checkMark}>✓</Text> : null}
        </View>
    );
}

function EventRow({ title, time, mint = false }: {
    title: string;
    time: string;
    mint?: boolean;
}) {
    return (
        <View style={styles.eventRow}>
            <View style={[styles.eventIcon, mint && styles.eventIconMint]}>
                {mint ? <Text style={styles.heartIcon}>♡</Text> : <CalendarIcon />}
            </View>
            <View style={styles.eventCopy}>
                <Text numberOfLines={1} style={styles.eventName}>{title}</Text>
                <Text style={styles.eventTime}>{time}</Text>
            </View>
            <View style={styles.statusDot} />
        </View>
    );
}

function TaskRow({
    title,
    detail,
    checked = false,
    urgent = false,
}: {
    title: string;
    detail: string;
    checked?: boolean;
    urgent?: boolean;
}) {
    return (
        <View style={styles.taskRow}>
            <CheckMark checked={checked} />
            <View style={styles.taskCopy}>
                <Text style={[styles.taskName, checked && styles.completedTask]} numberOfLines={1}>
                    {title}
                </Text>
                <Text style={styles.taskDetail}>{detail}</Text>
            </View>
            {urgent ? <Text style={styles.urgentBadge}>Urgent</Text> : null}
        </View>
    );
}

export default function Management() {
    const { width } = useWindowDimensions();
    const compact = width < 440;
    const floatValue = useRef(new Animated.Value(0)).current;
    const noticeValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const floatAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(floatValue, {
                    toValue: 1,
                    duration: 3000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(floatValue, {
                    toValue: 0,
                    duration: 3000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ]),
        );
        const noticeAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(noticeValue, {
                    toValue: 1,
                    duration: 2300,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(noticeValue, {
                    toValue: 0,
                    duration: 2300,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ]),
        );

        floatAnimation.start();
        noticeAnimation.start();
        return () => {
            floatAnimation.stop();
            noticeAnimation.stop();
        };
    }, [floatValue, noticeValue]);

    const floatY = floatValue.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
    const noticeY = noticeValue.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

    return (
        <View
            accessible
            accessibilityLabel="Taskora organise vos événements et tâches et vous envoie un rappel avant chaque rendez-vous."
            style={[styles.stage, compact && styles.stageCompact]}
        >
            <View pointerEvents="none" style={styles.glowPurple} />
            <View pointerEvents="none" style={styles.glowMint} />

            <Animated.View style={[styles.board, compact && styles.boardCompact, { transform: [{ translateY: floatY }] }]}>
                <View style={styles.topBar}>
                    <View style={styles.brand}>
                        <View style={styles.brandMark}><Text style={styles.brandCheck}>✓</Text></View>
                        <Text style={styles.brandName}>taskora</Text>
                    </View>
                    <View style={styles.profile}>
                        <Text style={styles.profileLabel}>Mon espace</Text>
                        <View style={styles.avatar}><Text style={styles.avatarLetter}>S</Text></View>
                    </View>
                </View>

                <Text style={styles.greeting}>Bonjour Sarah <Text>☀️</Text></Text>
                <Text style={styles.date}>Votre journée du mardi 24 juin</Text>

                <View style={styles.tabs}>
                    <View style={styles.activeTab}>
                        <Text style={styles.activeTabText}>Aujourd’hui <Text style={styles.tabCount}>4</Text></Text>
                    </View>
                    <Text style={styles.tabText}>Calendrier</Text>
                    <Text style={styles.tabText}>Mes tâches <Text style={styles.tabCount}>3</Text></Text>
                </View>

                <View style={[styles.columns, compact && styles.columnsCompact]}>
                    <View style={styles.column}>
                        <View style={styles.columnHeading}>
                            <Text style={styles.columnTitle}>À venir</Text>
                            <Text style={styles.linkText}>Tout voir</Text>
                        </View>
                        <EventRow title="Point d’équipe" time="09:30 · Salle créative" />
                        <EventRow title="Appel avec Léa" time="14:00 · En ligne" mint />
                    </View>

                    <View style={styles.column}>
                        <View style={styles.columnHeading}>
                            <Text style={styles.columnTitle}>Mes tâches</Text>
                            <Text style={styles.linkText}>2 sur 3</Text>
                        </View>
                        <TaskRow title="Préparer le brief" detail="Terminé · 08:45" checked />
                        <TaskRow title="Envoyer le devis" detail="Aujourd’hui · 16:00" urgent />
                        <TaskRow title="Réserver la salle" detail="Demain · 10:00" />
                    </View>
                </View>

                <View style={[styles.deletedToast, compact && styles.deletedToastCompact]}>
                    <Text style={styles.deletedIcon}>⌫</Text>
                    <Text style={styles.deletedText}>Événement supprimé</Text>
                </View>
                <View style={[styles.createdToast, compact && styles.createdToastCompact]}>
                    <View style={styles.createdIcon}><Text style={styles.createdPlus}>+</Text></View>
                    <View>
                        <Text style={styles.createdTitle}>Événement créé</Text>
                        <Text style={styles.createdDetail}>Ajouté à votre calendrier</Text>
                    </View>
                </View>
            </Animated.View>

            <Animated.View style={[styles.reminder, compact && styles.reminderCompact, { transform: [{ translateY: noticeY }] }]}>
                <View style={styles.bellCircle}><Text style={styles.bell}>🔔</Text></View>
                <View style={styles.reminderCopy}>
                    <Text style={styles.reminderTitle}>Un rappel pour vous 🔔</Text>
                    <Text style={styles.reminderBody}>Point d’équipe dans 15 minutes.{"\n"}Vous avez le temps de vous préparer.</Text>
                </View>
                <Text style={styles.reminderTime}>09:15</Text>
            </Animated.View>

            <Text style={styles.caption}>
                <Text style={styles.captionStrong}>Tout au même endroit.</Text> Votre journée, plus sereine.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    stage: {
        width: "100%",
        minHeight: 490,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingTop: 38,
        paddingBottom: 48,
        borderRadius: 30,
        backgroundColor: "#F6F5FF",
        overflow: "hidden",
    },
    stageCompact: { minHeight: 455, paddingHorizontal: 12, paddingTop: 38, paddingBottom: 58, borderRadius: 22 },
    glowPurple: { position: "absolute", width: 230, height: 230, top: -105, right: -30, borderRadius: 120, backgroundColor: "#E7E1FF" },
    glowMint: { position: "absolute", width: 190, height: 190, bottom: -100, left: -30, borderRadius: 100, backgroundColor: "#DDF8F1" },
    board: {
        position: "relative",
        width: "100%",
        maxWidth: 590,
        minHeight: 355,
        paddingHorizontal: 25,
        paddingTop: 22,
        paddingBottom: 20,
        borderWidth: 1,
        borderColor: "#E9EBF3",
        borderRadius: 22,
        backgroundColor: "#FFFFFF",
        shadowColor: "#2D2A58",
        shadowOffset: { width: 0, height: 17 },
        shadowOpacity: 0.1,
        shadowRadius: 28,
        elevation: 7,
    },
    boardCompact: { minHeight: 350, paddingHorizontal: 14, paddingTop: 18, paddingBottom: 18 },
    topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
    brand: { flexDirection: "row", alignItems: "center", gap: 9 },
    brandMark: { width: 29, height: 29, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: colors.purple },
    brandCheck: { color: "#FFFFFF", fontSize: 19, fontWeight: "800", marginTop: -2 },
    brandName: { color: colors.ink, fontSize: 15, fontWeight: "800", letterSpacing: -0.4 },
    profile: { flexDirection: "row", alignItems: "center", gap: 8 },
    profileLabel: { color: "#667187", fontSize: 10, fontWeight: "600" },
    avatar: { width: 27, height: 27, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#FFDFC8" },
    avatarLetter: { color: "#A45D3F", fontSize: 10, fontWeight: "800" },
    greeting: { color: colors.ink, fontSize: 19, fontWeight: "800", letterSpacing: -0.6 },
    date: { marginTop: 4, marginBottom: 16, color: colors.muted, fontSize: 10 },
    tabs: { flexDirection: "row", alignItems: "center", gap: 17, height: 30, marginBottom: 13, borderBottomWidth: 1, borderBottomColor: colors.border },
    activeTab: { height: 30, justifyContent: "center", borderBottomWidth: 2, borderBottomColor: colors.purple },
    activeTabText: { color: colors.purple, fontSize: 9, fontWeight: "700" },
    tabText: { color: "#8993A5", fontSize: 9, fontWeight: "600" },
    tabCount: { color: "#A6AFBD", fontSize: 8, fontWeight: "500" },
    columns: { flexDirection: "row", gap: 13 },
    columnsCompact: { gap: 8 },
    column: { flex: 1, minWidth: 0 },
    columnHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
    columnTitle: { color: colors.ink, fontSize: 9, fontWeight: "800" },
    linkText: { color: colors.purple, fontSize: 8, fontWeight: "700" },
    eventRow: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 7, paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderColor: "#F0F1F5", borderRadius: 10 },
    eventIcon: { width: 29, height: 29, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#F1EDFF" },
    eventIconMint: { backgroundColor: "#E7F8F3" },
    heartIcon: { color: "#159A79", fontSize: 21, lineHeight: 23, fontWeight: "600" },
    eventCopy: { flex: 1, minWidth: 0 },
    eventName: { color: "#27334A", fontSize: 8, fontWeight: "700" },
    eventTime: { marginTop: 3, color: "#96A0B0", fontSize: 7 },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#47C7A5" },
    calendarIcon: { width: 15, height: 15, overflow: "hidden", borderWidth: 1.4, borderColor: colors.purple, borderRadius: 3 },
    calendarTop: { height: 4, flexDirection: "row", justifyContent: "space-around", borderBottomWidth: 1, borderBottomColor: colors.purple },
    calendarRing: { width: 2, height: 3, marginTop: -2, borderRadius: 1, backgroundColor: colors.purple },
    calendarLine: { height: 1, marginTop: 3, backgroundColor: "#C9C0FA" },
    calendarDots: { flexDirection: "row", justifyContent: "space-around", marginTop: 2 },
    calendarDot: { width: 2, height: 2, borderRadius: 1, backgroundColor: colors.purple },
    taskRow: { minHeight: 46, flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 6, paddingHorizontal: 7, paddingVertical: 8, borderWidth: 1, borderColor: "#F0F1F5", borderRadius: 9 },
    checkBox: { width: 14, height: 14, alignItems: "center", justifyContent: "center", marginTop: 1, borderWidth: 1.3, borderColor: "#D8DCE6", borderRadius: 5 },
    checkBoxDone: { borderColor: colors.mint, backgroundColor: colors.mint },
    checkMark: { color: "#FFFFFF", fontSize: 9, lineHeight: 11, fontWeight: "800" },
    taskCopy: { flex: 1, minWidth: 0 },
    taskName: { color: "#354158", fontSize: 8, fontWeight: "700" },
    completedTask: { color: "#A0A9B7", textDecorationLine: "line-through" },
    taskDetail: { marginTop: 3, color: "#A0A9B7", fontSize: 7 },
    urgentBadge: { overflow: "hidden", marginTop: 1, paddingHorizontal: 4, paddingVertical: 3, borderRadius: 4, backgroundColor: "#FFF2E5", color: "#D28B37", fontSize: 6, fontWeight: "800" },
    deletedToast: { position: "absolute", top: -13, right: 55, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderWidth: 1, borderColor: "#F2E8E8", borderRadius: 8, backgroundColor: "#FFFFFF", shadowColor: "#28264B", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
    deletedToastCompact: { right: 16 },
    deletedIcon: { color: "#D1838D", fontSize: 11, fontWeight: "700" },
    deletedText: { color: "#A16C72", fontSize: 7, fontWeight: "700" },
    createdToast: { position: "absolute", left: -32, top: 102, flexDirection: "row", alignItems: "center", gap: 8, padding: 9, borderWidth: 1, borderColor: colors.border, borderRadius: 11, backgroundColor: "#FFFFFF", shadowColor: "#28264B", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
    createdToastCompact: { left: -3, top: 65 },
    createdIcon: { width: 25, height: 25, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#EDFAF6" },
    createdPlus: { color: "#1CA583", fontSize: 19, lineHeight: 22, fontWeight: "400" },
    createdTitle: { color: colors.ink, fontSize: 7, fontWeight: "800" },
    createdDetail: { marginTop: 3, color: "#99A2B1", fontSize: 6 },
    reminder: { position: "absolute", right: 4, bottom: 38, width: 218, minHeight: 67, flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 11, borderWidth: 1, borderColor: colors.border, borderRadius: 13, backgroundColor: "#FFFFFF", shadowColor: "#28264B", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.11, shadowRadius: 18, elevation: 6 },
    reminderCompact: { right: 9, bottom: 22, width: 208 },
    bellCircle: { width: 29, height: 29, alignItems: "center", justifyContent: "center", borderRadius: 9, backgroundColor: "#FFF2E8" },
    bell: { fontSize: 14 },
    reminderCopy: { flex: 1 },
    reminderTitle: { marginTop: 1, marginBottom: 4, color: colors.ink, fontSize: 8, fontWeight: "800" },
    reminderBody: { color: "#818CA0", fontSize: 7, lineHeight: 11 },
    reminderTime: { color: "#ACB4C1", fontSize: 6 },
    caption: { position: "absolute", right: 8, bottom: 13, left: 8, color: "#7F8AA0", textAlign: "center", fontSize: 9 },
    captionStrong: { color: "#535F77", fontWeight: "800" },
});
