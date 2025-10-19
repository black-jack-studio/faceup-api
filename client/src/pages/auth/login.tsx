import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useUserStore } from "@/store/user-store";
import { useLocation, Link } from "wouter";
import { LogIn, User, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { apiFetch } from "@/lib/api";


// Import 3D assets to match app style
import heartIcon from "@assets/heart_suit_3d_1757353734994.png";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Reset password modal states
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetUsername, setResetUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [resetEmailError, setResetEmailError] = useState("");
  const [resetUsernameError, setResetUsernameError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const login = useUserStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await login(username, password);
      navigate("/");
    } catch (error: any) {
      // Clear previous errors
      setUsernameError("");
      setPasswordError("");
      
      // Check error type to show appropriate field error
      if (error.errorType === "user_not_found") {
        setUsernameError("Username or password is incorrect");
      } else if (error.errorType === "wrong_password") {
        setPasswordError("Password incorrect");
      } else {
        // Default: show username error for unknown errors
        setUsernameError("Username or password is incorrect");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail.trim() || !resetUsername.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      setNewPasswordError("Password is too short");
      return;
    }

    if (newPassword !== confirmPassword) {
      setNewPasswordError("Passwords do not match");
      return;
    }

    setIsResetLoading(true);

    // Clear previous errors
    setResetEmailError("");
    setResetUsernameError("");
    setNewPasswordError("");

    try {
      const response = await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email: resetEmail,
          username: resetUsername,
          newPassword: newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific error cases
        if (errorData.message.includes("No account found with this email") || 
            errorData.message.includes("No account found with this username") ||
            errorData.message.includes("Email and username do not match")) {
          setResetEmailError("Email and/or username are incorrect");
          setResetUsernameError("Email and/or username are incorrect");
        } else {
          throw new Error(errorData.message || "Failed to reset password");
        }
        return;
      }

      toast({
        title: "Password Reset Successful",
        description: "Your password has been successfully reset. You can now log in with your new password.",
      });
      
      // Reset form and close modal
      setResetEmail("");
      setResetUsername("");
      setNewPassword("");
      setConfirmPassword("");
      setIsResetModalOpen(false);
      
    } catch (error: any) {
      toast({
        title: "Reset Failed", 
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{ backgroundColor: '#000000' }}>
      {/* Gradient background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-96 h-96 bg-accent-green/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl" />
      </div>


      <div className="flex items-center justify-center min-h-screen p-6 relative z-10">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div 
            className="bg-black rounded-3xl p-8 relative overflow-hidden"
          >
            {/* Black overlay */}
            <div className="absolute inset-0 bg-black rounded-3xl" />
            
            {/* 3D Icon */}
            <motion.div 
              className="w-24 h-24 mx-auto mb-8 relative flex items-center justify-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 1, delay: 0.2, type: "spring", bounce: 0.6 }}
            >
              <img 
                src={heartIcon} 
                alt="Login" 
                className="w-16 h-16 object-contain drop-shadow-2xl"
              />
            </motion.div>
          
            {/* Header */}
            <motion.div 
              className="text-center mb-10 relative z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h1 className="text-4xl font-black text-white mb-4 tracking-tight bg-gradient-to-r from-white to-white/80 bg-clip-text">
                Welcome Back
              </h1>
              <p className="text-white/70 text-lg font-medium">
                Sign in to continue your blackjack mastery
              </p>
            </motion.div>

            {/* Form */}
            <motion.form 
              onSubmit={handleSubmit} 
              className="space-y-6 relative z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div>
                <label className="flex items-center gap-3 text-white font-bold text-lg mb-3">
                  <User className="w-5 h-5 text-white" />
                  Username
                </label>
                <Input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    // Clear username error when user types
                    if (usernameError) {
                      setUsernameError("");
                    }
                  }}
                  className={`w-full bg-white/5 rounded-2xl px-5 py-4 !text-white placeholder:text-white/60 text-lg focus:bg-white/10 focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-300 backdrop-blur-sm ${
                    usernameError 
                      ? "border-red-500 focus:border-red-400" 
                      : "border-white/20 focus:border-white"
                  }`}
                  data-testid="input-username"
                />
                {usernameError && (
                  <motion.p 
                    className="text-red-400 text-sm mt-2 font-medium"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    data-testid="username-error"
                  >
                    {usernameError}
                  </motion.p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-3 text-white font-bold text-lg mb-3">
                  <Lock className="w-5 h-5 text-white" />
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      // Clear password error when user types
                      if (passwordError) {
                        setPasswordError("");
                      }
                    }}
                    className={`w-full bg-white/5 rounded-2xl px-5 py-4 pr-12 !text-white placeholder:text-white/60 text-lg focus:bg-white/10 focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-300 backdrop-blur-sm ${
                      passwordError 
                        ? "border-red-500 focus:border-red-400" 
                        : "border-white/20 focus:border-white"
                    }`}
                    data-testid="input-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/70 rounded-xl p-2"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {passwordError && (
                  <motion.p 
                    className="text-red-400 text-sm mt-2 font-medium"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    data-testid="password-error"
                  >
                    {passwordError}
                  </motion.p>
                )}
              </div>

              <div
                className="pt-2"
              >
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-white to-gray-200 text-black font-black text-lg py-5 rounded-2xl shadow-2xl border border-white/20 relative overflow-hidden group"
                  disabled={isLoading}
                  data-testid="button-login"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0" />
                  <div className="relative z-10 flex items-center justify-center space-x-3">
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-ink/30 border-t-ink rounded-full animate-spin"></div>
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                      </>
                    )}
                  </div>
                </Button>
              </div>
            </motion.form>

            {/* Footer */}
            <motion.div 
              className="mt-8 text-center relative z-10 space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-white/70 text-lg">
                  Don't have an account?{" "}
                  <Link 
                    href="/register" 
                    className="text-white font-bold"
                  >
                    Create Account
                  </Link>
                </p>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-white/70 text-lg">
                  Forgot your password?{" "}
                  <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
                    <DialogTrigger asChild>
                      <button 
                        className="text-white font-bold"
                        data-testid="button-forgot-password"
                      >
                        Reset Password
                      </button>
                    </DialogTrigger>
                    <DialogContent className="bg-white/10 backdrop-blur-xl border-white/20 text-white max-w-md rounded-xl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center text-white">
                          Reset Password
                        </DialogTitle>
                      </DialogHeader>
                      
                      <form onSubmit={handleResetPassword} className="space-y-4 mt-6">
                        {/* Email field */}
                        <div>
                          <label className="flex items-center gap-2 text-white font-bold text-sm mb-2">
                            <Mail className="w-4 h-4 text-white" />
                            Email
                          </label>
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            value={resetEmail}
                            onChange={(e) => {
                              setResetEmail(e.target.value);
                              // Clear error when user types
                              if (resetEmailError) {
                                setResetEmailError("");
                              }
                            }}
                            className={`w-full bg-white/5 rounded-xl px-4 py-3 !text-white placeholder:text-white/60 focus:bg-white/10 transition-all duration-300 ${
                              resetEmailError 
                                ? "border-red-500 focus:border-red-400" 
                                : "border-white/20 focus:border-white"
                            }`}
                            data-testid="input-reset-email"
                            required
                          />
                          {resetEmailError && (
                            <p className="text-red-400 text-sm mt-2 font-medium" data-testid="reset-email-error">
                              {resetEmailError}
                            </p>
                          )}
                        </div>

                        {/* Username field */}
                        <div>
                          <label className="flex items-center gap-2 text-white font-bold text-sm mb-2">
                            <User className="w-4 h-4 text-white" />
                            Username
                          </label>
                          <Input
                            type="text"
                            placeholder="Enter your username"
                            value={resetUsername}
                            onChange={(e) => {
                              setResetUsername(e.target.value);
                              // Clear error when user types
                              if (resetUsernameError) {
                                setResetUsernameError("");
                              }
                            }}
                            className={`w-full bg-white/5 rounded-xl px-4 py-3 !text-white placeholder:text-white/60 focus:bg-white/10 transition-all duration-300 ${
                              resetUsernameError 
                                ? "border-red-500 focus:border-red-400" 
                                : "border-white/20 focus:border-white"
                            }`}
                            data-testid="input-reset-username"
                            required
                          />
                          {resetUsernameError && (
                            <p className="text-red-400 text-sm mt-2 font-medium" data-testid="reset-username-error">
                              {resetUsernameError}
                            </p>
                          )}
                        </div>

                        {/* New password field */}
                        <div>
                          <label className="flex items-center gap-2 text-white font-bold text-sm mb-2">
                            <Lock className="w-4 h-4 text-white" />
                            New Password
                          </label>
                          <div className="relative">
                            <Input
                              type={showNewPassword ? "text" : "password"}
                              placeholder="Enter new password"
                              value={newPassword}
                              onChange={(e) => {
                                const value = e.target.value;
                                setNewPassword(value);
                                
                                // Real-time validation
                                if (value.length > 0 && value.length < 6) {
                                  setNewPasswordError("Password is too short");
                                } else {
                                  setNewPasswordError("");
                                }
                              }}
                              className={`w-full bg-white/5 rounded-xl px-4 py-3 pr-12 !text-white placeholder:text-white/60 focus:bg-white/10 transition-all duration-300 ${
                                newPasswordError 
                                  ? "border-red-500 focus:border-red-400" 
                                  : "border-white/20 focus:border-white"
                              }`}
                              data-testid="input-new-password"
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/70 rounded-xl p-2"
                              data-testid="button-toggle-new-password"
                            >
                              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                          {newPasswordError && (
                            <p className="text-red-400 text-sm mt-2 font-medium" data-testid="new-password-error">
                              {newPasswordError}
                            </p>
                          )}
                        </div>

                        {/* Confirm password field */}
                        <div>
                          <label className="flex items-center gap-2 text-white font-bold text-sm mb-2">
                            <Lock className="w-4 h-4 text-white" />
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <Input
                              type={showConfirmNewPassword ? "text" : "password"}
                              placeholder="Confirm new password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full bg-white/5 border-white/20 rounded-xl px-4 py-3 pr-12 !text-white placeholder:text-white/60 focus:border-white focus:bg-white/10"
                              data-testid="input-confirm-password"
                              required
                              minLength={6}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/70 rounded-xl p-2"
                              data-testid="button-toggle-confirm-new-password"
                            >
                              {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>

                        {/* Submit button */}
                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-white to-gray-200 text-black font-bold py-3 rounded-xl mt-6"
                          disabled={isResetLoading}
                          data-testid="button-reset-submit"
                        >
                          {isResetLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                              Resetting...
                            </>
                          ) : (
                            "Reset Password"
                          )}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Floating decorative elements */}
          <motion.div
            className="absolute -top-10 -left-10 w-4 h-4 bg-accent-gold/40 rounded-full blur-sm"
            animate={{ 
              y: [0, -20, 0],
              x: [0, 10, 0],
              opacity: [0.4, 0.8, 0.4]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute -bottom-10 -right-10 w-3 h-3 bg-accent-purple/50 rounded-full blur-sm"
            animate={{ 
              y: [0, -15, 0],
              x: [0, -8, 0],
              opacity: [0.5, 0.9, 0.5]
            }}
            transition={{ 
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}