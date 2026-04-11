import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "leaflet/dist/leaflet.css";
import App from "./App.tsx";
import "./index.css";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const hasValidGoogleClientId =
	typeof googleClientId === "string" &&
	googleClientId.includes(".apps.googleusercontent.com") &&
	!googleClientId.startsWith("GOCSPX-");

createRoot(document.getElementById("root")!).render(
	hasValidGoogleClientId ? (
		<GoogleOAuthProvider clientId={googleClientId}>
			<App />
		</GoogleOAuthProvider>
	) : (
		<App />
	)
);
