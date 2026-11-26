import React, { useEffect, useRef } from "react";
import {
    Animated,
    Easing,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from "react-native";

const colors = {
    ink: "#17233B",
    muted: "#8994A7",
    purple: "#7257E8",
    mint: "#31B997",
    border: "#EDF0F5",
};

function LockIcon() {
    return (
        <View style={styles.lockIcon}>
            <View style={styles.shackle} />
            <View style={styles.lockBody}>
                <View style={styles.keyhole} />
                <View style={styles.keyholeStem} />
            </View>
        </View>
    );
}

function PinDots({ filled }: { filled: number }) {
    return (
        <View style={styles.pinDots}>
            {[0, 1, 2, 3].map((index) => (
                <View key={index} style={[styles.pinDot, index < filled && styles.pinDotFilled]} />
            ))}
        </View>
    );
}

function Keypad() {
    return (
        <View style={styles.keypad}>
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                <View key={digit} style={styles.key}>
                    <Text style={styles.keyText}>{digit}</Text>
                </View>
            ))}
            <View style={[styles.key, styles.keyEmpty]} />
            <View style={styles.key}>
                <Text style={styles.keyText}>0</Text>
            </View>
            <View style={[styles.key, styles.keyEmpty]} />
        </View>
    );
}

export default function Secure() {
    const { width } = useWindowDimensions();
    const compact = width < 440;
    const floatValue = useRef(new Animated.Value(0)).current;
    const pulseValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const floatAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(floatValue, {
                    toValue: 1,
                    duration: 2600,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(floatValue, {
                    toValue: 0,
                    duration: 2600,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ]),
        );
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseValue, {
                    toValue: 1,
                    duration: 1400,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseValue, {
                    toValue: 0,
                    duration: 1400,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        );

        floatAnimation.start();
        pulseAnimation.start();
        return () => {
            floatAnimation.stop();
            pulseAnimation.stop();
        };
    }, [floatValue, pulseValue]);

    const floatY = floatValue.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
    const haloScale = pulseValue.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.12] });
    const haloOpacity = pulseValue.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.3] });

    return (
        <View
            accessible
            accessibilityLabel="Protégez Taskora avec un verrouillage local par code ou biométrie."
            style={[styles.stage, compact && styles.stageCompact]}
        >
            <View pointerEvents="none" style={styles.glowPurple} />
            <View pointerEvents="none" style={styles.glowMint} />

            <Animated.View style={[styles.phone, compact && styles.phoneCompact, { transform: [{ translateY: floatY }] }]}>
                <View style={styles.phoneNotch} />
                <View style={styles.screen}>
                    <View style={styles.brand}>
                        <View style={styles.brandMark}><Text style={styles.brandCheck}>✓</Text></View>
                        <Text style={styles.brandName}>taskora</Text>
                    </View>

                    <Animated.View style={[styles.lockHalo, { transform: [{ scale: haloScale }], opacity: haloOpacity }]} />
                    <View style={styles.lockCircle}><LockIcon /></View>

                    <Text style={styles.title}>Votre espace est protégé</Text>
                    <Text style={styles.subtitle}>Saisissez votre code pour continuer</Text>
                    <PinDots filled={3} />
                    <Keypad />

                    <View style={styles.biometricButton}>
                        <View style={styles.fingerprint}><View style={styles.fingerprintInner} /></View>
                        <Text style={styles.biometricText}>Déverrouiller avec Face ID</Text>
                    </View>
                </View>
            </Animated.View>

            <View style={[styles.localBadge, compact && styles.localBadgeCompact]}>
                <View style={styles.localIcon}><Text style={styles.localCheck}>✓</Text></View>
                <View>
                    <Text style={styles.localTitle}>Sécurité locale</Text>
                    <Text style={styles.localDetail}>Vos données restent sur l’appareil</Text>
                </View>
            </View>

            <View style={[styles.secureBadge, compact && styles.secureBadgeCompact]}>
                <Text style={styles.secureEmoji}>🔒</Text>
                <Text style={styles.secureText}>Verrouillée</Text>
            </View>

            <Text style={styles.caption}>
                <Text style={styles.captionStrong}>Votre espace, à vous seul.</Text> Activez le verrouillage quand vous le souhaitez.
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
    stageCompact: { minHeight: 455, paddingHorizontal: 12, paddingTop: 35, paddingBottom: 58, borderRadius: 22 },
    glowPurple: { position: "absolute", width: 230, height: 230, top: -105, right: -30, borderRadius: 120, backgroundColor: "#E7E1FF" },
    glowMint: { position: "absolute", width: 190, height: 190, bottom: -100, left: -30, borderRadius: 100, backgroundColor: "#DDF8F1" },
    phone: {
        width: 244,
        height: 375,
        padding: 7,
        borderWidth: 1,
        borderColor: "#D9DCE7",
        borderRadius: 34,
        backgroundColor: "#22263A",
        shadowColor: "#28264B",
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 8,
    },
    phoneCompact: { width: 224, height: 358 },
    phoneNotch: { position: "absolute", zIndex: 2, top: 11, alignSelf: "center", width: 66, height: 15, borderRadius: 10, backgroundColor: "#22263A" },
    screen: { flex: 1, alignItems: "center", paddingHorizontal: 17, paddingTop: 24, borderRadius: 27, backgroundColor: "#FFFFFF" },
    brand: { width: "100%", flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 13 },
    brandMark: { width: 21, height: 21, alignItems: "center", justifyContent: "center", borderRadius: 7, backgroundColor: colors.purple },
    brandCheck: { color: "#FFFFFF", fontSize: 14, fontWeight: "800", marginTop: -2 },
    brandName: { color: colors.ink, fontSize: 12, fontWeight: "800", letterSpacing: -0.3 },
    lockHalo: { position: "absolute", top: 54, width: 82, height: 82, borderRadius: 41, backgroundColor: colors.purple },
    lockCircle: { width: 62, height: 62, alignItems: "center", justifyContent: "center", marginTop: 3, marginBottom: 10, borderRadius: 31, backgroundColor: "#F1EDFF" },
    lockIcon: { width: 24, height: 29, alignItems: "center" },
    shackle: { width: 15, height: 14, marginBottom: -4, borderWidth: 3, borderBottomWidth: 0, borderColor: colors.purple, borderTopLeftRadius: 9, borderTopRightRadius: 9 },
    lockBody: { width: 23, height: 18, alignItems: "center", borderRadius: 5, backgroundColor: colors.purple },
    keyhole: { width: 5, height: 5, marginTop: 4, borderRadius: 3, backgroundColor: "#FFFFFF" },
    keyholeStem: { width: 2, height: 4, backgroundColor: "#FFFFFF" },
    title: { color: colors.ink, fontSize: 12, fontWeight: "800", letterSpacing: -0.2 },
    subtitle: { marginTop: 4, color: colors.muted, fontSize: 8 },
    pinDots: { flexDirection: "row", gap: 12, marginTop: 12, marginBottom: 12 },
    pinDot: { width: 8, height: 8, borderWidth: 1.5, borderColor: "#D6D9E4", borderRadius: 4 },
    pinDotFilled: { borderColor: colors.purple, backgroundColor: colors.purple },
    keypad: { width: 138, flexDirection: "row", flexWrap: "wrap", justifyContent: "center", columnGap: 13, rowGap: 3 },
    key: { width: 35, height: 30, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "#F7F7FA" },
    keyText: { color: "#30394E", fontSize: 12, fontWeight: "600" },
    keyEmpty: { backgroundColor: "transparent" },
    biometricButton: { width: "100%", height: 33, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 9, borderWidth: 1, borderColor: "#E8E5F8", borderRadius: 10, backgroundColor: "#FBFAFF" },
    fingerprint: { width: 13, height: 15, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: colors.purple, borderRadius: 8 },
    fingerprintInner: { width: 5, height: 8, borderWidth: 1, borderBottomWidth: 0, borderColor: colors.purple, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
    biometricText: { color: colors.purple, fontSize: 8, fontWeight: "700" },
    localBadge: { position: "absolute", left: 4, top: 129, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 10, paddingVertical: 9, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: "#FFFFFF", shadowColor: "#28264B", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
    localBadgeCompact: { left: -1, top: 113, paddingHorizontal: 8, paddingVertical: 8 },
    localIcon: { width: 25, height: 25, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#E7F8F3" },
    localCheck: { color: "#159A79", fontSize: 15, fontWeight: "800" },
    localTitle: { color: colors.ink, fontSize: 8, fontWeight: "800" },
    localDetail: { marginTop: 3, color: colors.muted, fontSize: 6 },
    secureBadge: { position: "absolute", top: 177, right: 4, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 7, borderWidth: 1, borderColor: "#E9E5F8", borderRadius: 9, backgroundColor: "#FFFFFF", shadowColor: "#28264B", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
    secureBadgeCompact: { top: 166, right: -1, paddingHorizontal: 7 },
    secureEmoji: { fontSize: 11 },
    secureText: { color: colors.purple, fontSize: 7, fontWeight: "800" },
    caption: { position: "absolute", right: 8, bottom: 13, left: 8, color: "#7F8AA0", textAlign: "center", fontSize: 9 },
    captionStrong: { color: "#535F77", fontWeight: "800" },
});
