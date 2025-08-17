import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User } from "@/types";
import {
  getUserFromStorage,
  setUserInStorage,
  getUsers,
  saveUsers,
} from "@/lib/mock-data";
import { generateId } from "@/lib/utils";
import {
  signUpUser,
  signInUser,
  requestPasswordReset,
  updatePassword,
  resendforgototp,
  sendForgot,
} from "@/services/userServices";
import { useAuthHeader } from "@/hooks/useAuthHeader";

interface AuthContextType {
  accessToken: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    firstname: string,
    lastname: string,
    username: string,
    email: string,
    password: string
  ) => Promise<boolean>;
  updateProfile: (updates: Partial<User>) => void;
  forgotpassword: (email: string, otp: string) => Promise<boolean>;
  resendOtp: (email: string) => Promise<boolean>;
  sendOtp: (email: string) => Promise<boolean>;
  resetpassword: (
    email: string,
    otp: string,
    newPassword: string
  ) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const saved = localStorage.getItem("accessToken");
    const UserData = localStorage.getItem("UserData");
    if (saved) setAccessToken(saved);
    const storedUser = getUserFromStorage();
    if (UserData) {
      setUser(JSON.parse(UserData));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    let formData = { email: email, password: password };
    // Simulate API call delay
    let headers = useAuthHeader(accessToken);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const { token, user } = await signInUser(formData, headers);
    if (token && user) {
      let userdata = {
        id: user.user_id,
        firstname: user.user_firstname,
        lastname: user.user_firstname,
        username: user.user_name,
        email: user.user_email,
        profileImage: user.user_profileImage
          ? user.user_profileImage
          : "/uploads/profile/defaultavatar.png",
        coverImage: user.user_coverImage,
        password: "",
        bio: "",
        createdAt: "",
        friends: [],
        walletBalance: user.user_wallet_balance,
        roles: user.role,
      };
      console.log(user, "useruseruser");
      setUser(userdata);
      setAccessToken(token);
      localStorage.setItem("accessToken", token);
      localStorage.setItem("UserData", JSON.stringify(userdata));
      return true;
    }
    // const users = getUsers();
    // const foundUser = users.find(u => u.email === email && u.password === password);

    // if (foundUser) {
    //   setUser(foundUser);
    //   setUserInStorage(foundUser);
    //   return true;
    // }
    return false;
  };

  const forgotpassword = async (email: string, otp: string) => {
    console.log("flsnfjnsdijofn");
    let formData = { email, otp };

    await new Promise((resolve) => setTimeout(resolve, 500)); // optional delay

    const res = await requestPasswordReset(formData);

    if (res?.status) {
      // You can show a success toast here
      console.log("Password reset instructions sent to email.");
      return true;
    }
    return false;
  };

  const resendOtp = async (email: string) => {
    let formData = { email };

    await new Promise((resolve) => setTimeout(resolve, 500)); // optional delay

    const res = await resendforgototp(formData);

    if (res?.status) {
      // You can show a success toast here
      console.log("OTP resend to email");
      return true;
    }
    return false;
  };

  const sendOtp = async (email: string) => {
    let formData = { email };

    await new Promise((resolve) => setTimeout(resolve, 500)); // optional delay

    const res = await sendForgot(formData);

    if (res?.status) {
      // You can show a success toast here
      console.log("OTP send to email");
      return true;
    }
    return false;
  };

  const resetpassword = async (
    email: string,
    otp: string,
    newPassword: string
  ) => {
    let formData = { email, otp, password: newPassword };

    await new Promise((resolve) => setTimeout(resolve, 500));

    const res = await updatePassword(formData);

    if (res?.status) {
      console.log("Password updated successfully.");
      return true;
    }
    return false;
  };

  const register = async (
    firstname: string,
    lastname: string,
    username: string,
    email: string,
    password: string
  ) => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const users = getUsers();

    // Check if email already exists
    if (users.some((u) => u.email === email)) {
      return false;
    }

    // Create new user
    const newUser: User = {
      id: generateId(),
      firstname,
      lastname,
      username,
      email,
      password,
      profileImage: `https://i.pravatar.cc/150?u=${email}`,
      coverImage:
        "https://images.unsplash.com/photo-1477346611705-65d1883cee1e",
      bio: "",
      friends: [],
      createdAt: new Date().toISOString(),
    };
    let headers = { "Content-Type": "application/json" };
    console.log(newUser, "newUsernewUsernewUser");
    const { token, user } = await signUpUser(newUser, headers);
    // Add to users array
    const updatedUsers = [...users, newUser];
    saveUsers(updatedUsers);

    // Log in the new user
    setUser(newUser);
    setUserInStorage(newUser);
    return true;
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!user) return;

    // Update current user state
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);

    // Update in localStorage
    setUserInStorage(updatedUser);

    // Update in users array
    const users = getUsers();
    const updatedUsers = users.map((u) =>
      u.id === user.id ? { ...u, ...updates } : u
    );
    saveUsers(updatedUsers);
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.clear();
  };

  const value = {
    user,
    login,
    register,
    forgotpassword,
    resetpassword,
    resendOtp,
    sendOtp,
    updateProfile,
    logout,
    isLoading,
    accessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
