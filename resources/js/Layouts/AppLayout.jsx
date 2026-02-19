/**
 * Layout principal de l'application - Inertia.js
 */
import WelcomeLoader from '../Components/WelcomeLoader'

export default function AppLayout({ children }) {
    const isJustLoggedIn = window.justLoggedIn === true

    if (isJustLoggedIn) {
        return (
            <WelcomeLoader
                userName={window.welcomeUserName}
                redirectUrl={window.welcomeRedirectUrl || '/dashboard'}
            />
        )
    }

    return (
        <>
            {/* Contenu principal */}
            <div>
                {children}
            </div>
        </>
    );
}
