import { Redirect } from "expo-router";
import { useAuth } from "@/lib/auth";

// App launch: signed-in users go straight to training, everyone else to Welcome.
export default function Index() {
  const { session } = useAuth();
  return <Redirect href={session ? "/train" : "/welcome"} />;
}
