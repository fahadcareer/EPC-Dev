import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/logic/user';
import { Lock } from 'lucide-react';

/**
 * FeatureGuardRoute
 * -----------------
 * Wraps a route element and redirects to /workspace if the
 * required feature is not enabled for the user's organization.
 *
 * Usage (in route.jsx):
 *   <Route
 *     path="/dictionary"
 *     element={
 *       <ProtectedRoute>
 *         <FeatureGuardRoute featureKey="dictionary">
 *           <DictionaryManagement />
 *         </FeatureGuardRoute>
 *       </ProtectedRoute>
 *     }
 *   />
 *
 * @param {string}      featureKey  - The feature key to check (e.g. 'dictionary')
 * @param {ReactNode}   children    - The component to render if feature is enabled
 * @param {string}      redirectTo  - Optional custom redirect path (default: /workspace)
 * @param {boolean}     showBlock   - If true, renders a "Feature Disabled" splash instead of redirect
 */
export default function FeatureGuardRoute({ featureKey, children, redirectTo = '/workspace', showBlock = false }) {
    const isFeatureEnabled = useAuthStore((state) => state.isFeatureEnabled);

    if (!isFeatureEnabled(featureKey)) {
        if (showBlock) {
            return (
                <div className="flex h-full w-full items-center justify-center bg-transparent">
                    <div className="flex flex-col items-center gap-5 max-w-sm text-center p-8 bg-app-surface border border-theme-border rounded-2xl shadow-xl">
                        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                            <Lock className="w-8 h-8 text-rose-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-theme-primary mb-2">Feature Unavailable</h2>
                            <p className="text-sm text-theme-secondary leading-relaxed">
                                This module is not enabled for your organization.
                                Contact your administrator to request access.
                            </p>
                        </div>
                        <a
                            href="/workspace"
                            className="px-5 py-2.5 bg-theme-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                        >
                            Return to Workspace
                        </a>
                    </div>
                </div>
            );
        }
        return <Navigate to={redirectTo} replace />;
    }

    return children;
}
