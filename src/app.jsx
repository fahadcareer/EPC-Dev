import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/route';
import { ReactFlowProvider } from 'reactflow';
import { ToastContainer } from 'react-toastify';
import { useServerStore } from './store/serverStore';
import ServerOffline from './components/shared/ServerOffline';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
    const { isServerDown, hasChecked, checkServerHealth } = useServerStore();
    const [showLoader, setShowLoader] = React.useState(false);

    React.useEffect(() => {
        const handleMouseMove = (e) => {
            const x = (e.clientX / window.innerWidth) * 100;
            const y = (e.clientY / window.innerHeight) * 100;
            document.documentElement.style.setProperty('--mouse-x', `${x}%`);
            document.documentElement.style.setProperty('--mouse-y', `${y}%`);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Proactively check connection status on mount
    React.useEffect(() => {
        checkServerHealth();
    }, [checkServerHealth]);

    // Delay showing the loader to prevent any flashes on fast connections
    React.useEffect(() => {
        if (!hasChecked) {
            const timer = setTimeout(() => {
                setShowLoader(true);
            }, 180);
            return () => clearTimeout(timer);
        } else {
            setShowLoader(false);
        }
    }, [hasChecked]);

    return (
        <BrowserRouter>
            <ReactFlowProvider>
                {!hasChecked ? (
                    showLoader ? (
                        <div className="fixed inset-0 flex flex-col items-center justify-center bg-transparent z-[9999] select-none animate-enter">
                            {/* Ambient glowing aura */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-indigo-600/10 blur-[80px] pointer-events-none animate-pulse"></div>
                            
                            <div className="relative flex flex-col items-center justify-center">
                                {/* Outer pulsing ring */}
                                <div className="absolute w-24 h-24 rounded-full border border-indigo-500/25 animate-ping"></div>
                                
                                {/* Rotating loader ring */}
                                <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-indigo-500 border-b-transparent border-l-transparent animate-spin"></div>
                                
                                {/* Pulsing state feedback */}
                                <div className="mt-8 text-xs font-semibold tracking-widest text-indigo-400 uppercase animate-pulse">
                                    Connecting to System Services...
                                </div>
                            </div>
                        </div>
                    ) : null
                ) : isServerDown ? (
                    <ServerOffline />
                ) : (
                    <AppRoutes />
                )}
            </ReactFlowProvider>
            <ToastContainer 
                position="top-right" 
                autoClose={4000}
                hideProgressBar={false}
                newestOnTop={true}
                closeOnClick
                pauseOnHover
                toastClassName="relative flex p-3 mb-4 min-h-16 rounded-xl overflow-hidden cursor-pointer bg-theme-surface border border-theme-border shadow-2xl text-theme-primary backdrop-blur-xl"
                bodyClassName="flex-1 text-sm font-medium pr-2"
                progressClassName="bg-indigo-500"
            />
        </BrowserRouter>
    );
};

export default App;


