import React from "react";
import { Routes, Route } from "react-router-dom";
import PublicRoutes from "./PublicRoutes";
import AddUserProfilePage from "../components/layout/AddUserProfilePage ";
import HomePage from "../features/home/pages/HomePage";
import UserProfilePage from "../components/layout/UserProfilePage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";
import OtpVerificationPage from "../features/auth/pages/OtpVerificationPage";
import CreateProfilePage from "../features/auth/pages/CreateProfilePage ";
import AddGroupModal from "../components/layout/AddGroupModal";
import IncomingCallModal from "../components/layout/IncomingCallModal";
import OutgoingCallModal from "../components/layout/OutgoingCallModal";
{
  /*import PrivateRoutes from "./PrivateRoutes";*/
}

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/*" element={<PublicRoutes />} />
      {/* <Route path="/dashboard/*" element={<PrivateRoutes />} /> */}
      <Route path="/RegisterPage" element={<RegisterPage />} />
      <Route path="/OtpVerificationPage" element={<OtpVerificationPage />} />
      <Route path="/AddUserProfilePage" element={<AddUserProfilePage />} />
      <Route path="/HomePage" element={<HomePage />} />
      <Route path="/ForgotPasswordPage" element={<ForgotPasswordPage />} />
      <Route path="/UserProfilePage" element={<UserProfilePage />} />
      <Route path="/createProfile" element={<CreateProfilePage />} />
      <Route path="/AddGroupModal" element={<AddGroupModal />} />
      <Route path="/IncomingCallModal" element={<IncomingCallModal />} />
      <Route path="/OutgoingCallModal" element={<OutgoingCallModal />} />
    </Routes>
  );
};

export default AppRouter;
