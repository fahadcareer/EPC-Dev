import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../features/auth/login';
import AdminDashboard from '../features/admin/index';
import ProcessExplorer from '../features/process_explorer/index';
import EPCBuilder from '../features/editor/epc_builder';
import RolesManagement from '../features/admin/Roles';
import DictionaryManagement from '../features/dictionary/index';
import FeatureGuardRoute from '../components/FeatureGuardRoute';

import ProfilePage from '../features/profile/index';
import HelpCenter from '../features/help_center/index';

import ForgotEmail from '../features/auth/ForgotEmail';
import OtpVerification from '../features/auth/OtpVerification';
import ResetPassword from '../features/auth/ResetPassword';

import MiningCanvas from '../features/process_mining/MiningCanvas';
import ConformanceDashboard from '../features/process_mining/ConformanceDashboard';

const ProtectedRoute = ({ children }) => {
    return localStorage.getItem("token") ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
    return localStorage.getItem("token") ? <Navigate to="/workspace" /> : children;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/forgot-password-email" element={<PublicRoute><ForgotEmail /></PublicRoute>} />
            <Route path="/forgot-password-otp" element={<PublicRoute><OtpVerification /></PublicRoute>} />
            <Route path="/forgot-password-reset" element={<PublicRoute><ResetPassword /></PublicRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/:orgId" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/roles" element={<ProtectedRoute><RolesManagement /></ProtectedRoute>} />
            <Route path="/workspace" element={<ProtectedRoute><ProcessExplorer /></ProtectedRoute>} />

            {/* Feature-gated routes — redirect to /workspace if feature is disabled for the org */}
            <Route
                path="/dictionary"
                element={
                    <ProtectedRoute>
                        <FeatureGuardRoute featureKey="dictionary">
                            <DictionaryManagement />
                        </FeatureGuardRoute>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/editor/:id"
                element={
                    <ProtectedRoute>
                        <FeatureGuardRoute featureKey="process">
                            <EPCBuilder />
                        </FeatureGuardRoute>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/mining-canvas/:id"
                element={
                    <ProtectedRoute>
                        <FeatureGuardRoute featureKey="process_mining">
                            <MiningCanvas />
                        </FeatureGuardRoute>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/mining/conformance/:id/:approvedId"
                element={
                    <ProtectedRoute>
                        <FeatureGuardRoute featureKey="process_mining">
                            <ConformanceDashboard />
                        </FeatureGuardRoute>
                    </ProtectedRoute>
                }
            />

            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="*" element={<Navigate to="/workspace" />} />
        </Routes>
    );
};

export default AppRoutes;
