import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, IconBadge, Ionicons, Muted, Txt } from "@/components/ui";
import { supabase } from "@/integrations/supabase/client";
import { colors, fonts, radius } from "@/theme";

type Mode = "signin" | "signup" | "code" | "verify" | "confirm-email";

export default function AuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<Mode>(params.mode === "signup" ? "signup" : "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function run(fn: () => Promise<void>) {
    setLoading(true);
    try {
      await fn();
    } catch (err) {
      Alert.alert("Couldn't continue", err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Signing in flips the auth state; the root navigator then moves to the app.
  const submit = () =>
    run(async () => {
      const cleanEmail = email.trim();
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { data: { name: name.trim() || cleanEmail.split("@")[0] } },
        });
        if (error) throw error;
        if (!data.session) setMode("confirm-email");
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;
      } else if (mode === "code") {
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: { shouldCreateUser: false },
        });
        if (error) throw error;
        setMode("verify");
      } else if (mode === "verify") {
        const { error } = await supabase.auth.verifyOtp({ email: cleanEmail, token: code.trim(), type: "email" });
        if (error) throw error;
      } else {
        setMode("signin");
      }
    });

  const copy: Record<Mode, [string, string, string]> = {
    signin: ["Welcome back", "Sign in to continue your streak.", "Sign in"],
    signup: ["Create your account", "Free, and it saves your streak and progress.", "Create account"],
    code: ["Sign in with a code", "We'll email you a 6-digit code. No password needed.", "Email me a code"],
    verify: ["Enter your code", `Sent to ${email.trim()}.`, "Sign in"],
    "confirm-email": [
      "Check your email",
      `We sent a confirmation link to ${email.trim()}. Open it, then sign in here.`,
      "Back to sign in",
    ],
  };
  const [title, subtitle, cta] = copy[mode];

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.top}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/welcome"))}
            hitSlop={12}
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={28} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {mode === "confirm-email" && (
            <View style={{ marginBottom: 20 }}>
              <IconBadge name="mail-open-outline" />
            </View>
          )}
          <Txt variant="title">{title}</Txt>
          <Muted style={{ marginTop: 8 }}>{subtitle}</Muted>

          <View style={{ marginTop: 28, gap: 16 }}>
            {mode === "signup" && (
              <Field label="Name" value={name} onChangeText={setName} placeholder="Your name" autoComplete="name" textContentType="name" />
            )}
            {(mode === "signin" || mode === "signup" || mode === "code") && (
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@work.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
              />
            )}
            {(mode === "signin" || mode === "signup") && (
              <Field
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                secureTextEntry
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                textContentType={mode === "signup" ? "newPassword" : "password"}
              />
            )}
            {mode === "verify" && (
              <Field
                label="6-digit code"
                value={code}
                onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                style={{ textAlign: "center", fontFamily: fonts.displayBold, fontSize: 26, letterSpacing: 8 }}
              />
            )}
          </View>

          <Button title={cta} onPress={submit} loading={loading} style={{ marginTop: 24 }} />

          <View style={{ marginTop: 20, alignItems: "center", gap: 14 }}>
            {mode === "signin" && (
              <TextLink label="Forgot password? Sign in with an email code" onPress={() => setMode("code")} />
            )}
            {(mode === "code" || mode === "verify") && (
              <TextLink label="Use my password instead" onPress={() => setMode("signin")} />
            )}
            {(mode === "signin" || mode === "signup") && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center" }}>
                <Muted>{mode === "signup" ? "Already have an account? " : "New to Rapid Math? "}</Muted>
                <TextLink
                  label={mode === "signup" ? "Sign in" : "Create one"}
                  onPress={() => setMode(mode === "signup" ? "signin" : "signup")}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, style, ...props }: TextInputProps & { label: string }) {
  return (
    <View>
      <Txt variant="label" style={{ marginBottom: 6 }}>
        {label}
      </Txt>
      <TextInput placeholderTextColor="#9aa5b1" style={[styles.input, style]} {...props} />
    </View>
  );
}

function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Txt variant="label" color={colors.primary}>
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  top: { height: 52, justifyContent: "center", paddingHorizontal: 16 },
  content: { paddingHorizontal: 24, paddingBottom: 32 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    fontFamily: fonts.regular,
    color: colors.foreground,
  },
});
