import { useState } from 'react';
import { ChefHat, Mail, Lock, Eye, EyeOff, User, Phone, AlertCircle } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { useAuthModalStore } from '../../store/authModalStore';
import { useFormValidation, validationRules } from '../../hooks/useFormValidation';
import { ButtonLoader } from '../common/LoadingSpinner';
import toastHelper, { authToasts, errorMessages } from '../../utils/toastConfig.jsx';
import Modal from './Modal';

export default function AuthModal() {
  const { isOpen, message, close, complete } = useAuthModalStore();
  const [mode, setMode] = useState('login');
  const [showPwd, setShowPwd] = useState(false);

  const handleClose = () => {
    if (!loginValidation.isSubmitting && !registerValidation.isSubmitting) {
      close();
    }
  };

  // Login form validation
  const loginValidationSchema = (values) => {
    const errors = {};
    
    const emailError = validationRules.email(values.email);
    if (emailError) errors.email = emailError;
    
    const passwordError = validationRules.password(values.password);
    if (passwordError) errors.password = passwordError;
    
    return errors;
  };

  const loginValidation = useFormValidation(
    { email: '', password: '' },
    loginValidationSchema
  );

  // Register form validation
  const registerValidationSchema = (values) => {
    const errors = {};
    
    const firstNameError = validationRules.required(values.firstName, 'First name');
    if (firstNameError) errors.firstName = firstNameError;
    
    const lastNameError = validationRules.required(values.lastName, 'Last name');
    if (lastNameError) errors.lastName = lastNameError;
    
    const emailError = validationRules.email(values.email);
    if (emailError) errors.email = emailError;
    
    const phoneError = values.phone ? validationRules.phone(values.phone) : null;
    if (phoneError) errors.phone = phoneError;
    
    const passwordError = validationRules.password(values.password);
    if (passwordError) errors.password = passwordError;
    
    return errors;
  };

  const registerValidation = useFormValidation(
    { firstName: '', lastName: '', email: '', password: '', phone: '' },
    registerValidationSchema
  );

  const handleLogin = loginValidation.handleSubmit(async (values) => {
    try {
      const { data } = await authService.login(values);
      const { user, accessToken, refreshToken } = data.data;
      useAuthStore.getState().setAuth(user, accessToken, refreshToken);
      toastHelper.success(`Welcome back, ${user.firstName}! 👋`);
      complete(user);
    } catch (err) {
      if (err.userMessage) {
        toastHelper.error(err.userMessage);
      } else {
        authToasts.loginFailed();
      }
    }
  });

  const handleRegister = registerValidation.handleSubmit(async (values) => {
    try {
      const { data } = await authService.register({ ...values, role: 'customer' });
      const { user, accessToken, refreshToken } = data.data;
      useAuthStore.getState().setAuth(user, accessToken, refreshToken);
      authToasts.signupSuccess();
      complete(user);
    } catch (err) {
      if (err.userMessage) {
        toastHelper.error(err.userMessage);
      } else {
        authToasts.signupFailed();
      }
    }
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      showClose={!loginValidation.isSubmitting && !registerValidation.isSubmitting}
      title={mode === 'login' ? 'Welcome back' : 'Create account'}
      description={message || 'Sign in to continue shopping'}
    >
      <div className="flex items-center justify-center -mt-2 mb-5">
        <div className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center shadow-soft">
          <ChefHat size={20} className="text-white" />
        </div>
      </div>

      <div className="flex gap-1 bg-brand-bg rounded-2xl p-1 mb-5">
        {[['login', 'Sign In'], ['register', 'Sign Up']].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            disabled={loginValidation.isSubmitting || registerValidation.isSubmitting}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
              mode === key ? 'bg-white text-primary shadow-card' : 'text-brand-muted hover:text-brand-dark'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'login' ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="form-label">Email</label>
            <div className="relative">
              <Mail size={15} className="input-icon" />
              <input
                type="email"
                name="email"
                value={loginValidation.values.email}
                onChange={loginValidation.handleChange}
                onBlur={loginValidation.handleBlur}
                placeholder="you@email.com"
                autoComplete="email"
                className={`input-field pl-10 text-sm ${
                  loginValidation.getFieldError('email') ? 'border-red-400 ring-2 ring-red-100' : ''
                }`}
              />
            </div>
            {loginValidation.getFieldError('email') && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={11} /> {loginValidation.getFieldError('email')}
              </p>
            )}
          </div>
          <div>
            <label className="form-label">Password</label>
            <div className="relative">
              <Lock size={15} className="input-icon" />
              <input
                type={showPwd ? 'text' : 'password'}
                name="password"
                value={loginValidation.values.password}
                onChange={loginValidation.handleChange}
                onBlur={loginValidation.handleBlur}
                placeholder="Your password"
                autoComplete="current-password"
                className={`input-field pl-10 pr-10 text-sm ${
                  loginValidation.getFieldError('password') ? 'border-red-400 ring-2 ring-red-100' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-primary p-1"
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {loginValidation.getFieldError('password') && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={11} /> {loginValidation.getFieldError('password')}
              </p>
            )}
          </div>
          <button 
            type="submit" 
            disabled={loginValidation.isSubmitting} 
            className="btn-primary w-full py-3 text-sm disabled:opacity-70"
          >
            {loginValidation.isSubmitting ? <ButtonLoader /> : 'Sign In'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">First name *</label>
              <input
                type="text"
                name="firstName"
                value={registerValidation.values.firstName}
                onChange={registerValidation.handleChange}
                onBlur={registerValidation.handleBlur}
                placeholder="Jane"
                className={`input-field text-sm ${
                  registerValidation.getFieldError('firstName') ? 'border-red-400 ring-2 ring-red-100' : ''
                }`}
              />
              {registerValidation.getFieldError('firstName') && (
                <p className="text-xs text-red-500 mt-1">
                  {registerValidation.getFieldError('firstName')}
                </p>
              )}
            </div>
            <div>
              <label className="form-label">Last name *</label>
              <input
                type="text"
                name="lastName"
                value={registerValidation.values.lastName}
                onChange={registerValidation.handleChange}
                onBlur={registerValidation.handleBlur}
                placeholder="Doe"
                className={`input-field text-sm ${
                  registerValidation.getFieldError('lastName') ? 'border-red-400 ring-2 ring-red-100' : ''
                }`}
              />
              {registerValidation.getFieldError('lastName') && (
                <p className="text-xs text-red-500 mt-1">
                  {registerValidation.getFieldError('lastName')}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="form-label">Email *</label>
            <div className="relative">
              <Mail size={14} className="input-icon" />
              <input
                type="email"
                name="email"
                value={registerValidation.values.email}
                onChange={registerValidation.handleChange}
                onBlur={registerValidation.handleBlur}
                placeholder="you@email.com"
                className={`input-field pl-9 text-sm ${
                  registerValidation.getFieldError('email') ? 'border-red-400 ring-2 ring-red-100' : ''
                }`}
              />
            </div>
            {registerValidation.getFieldError('email') && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={11} /> {registerValidation.getFieldError('email')}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Phone</label>
              <div className="relative">
                <Phone size={14} className="input-icon" />
                <input
                  type="tel"
                  name="phone"
                  value={registerValidation.values.phone}
                  onChange={registerValidation.handleChange}
                  onBlur={registerValidation.handleBlur}
                  placeholder="+234 …"
                  className={`input-field pl-9 text-sm ${
                    registerValidation.getFieldError('phone') ? 'border-red-400 ring-2 ring-red-100' : ''
                  }`}
                />
              </div>
              {registerValidation.getFieldError('phone') && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> {registerValidation.getFieldError('phone')}
                </p>
              )}
            </div>
            <div>
              <label className="form-label">Password *</label>
              <div className="relative">
                <Lock size={14} className="input-icon" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  name="password"
                  value={registerValidation.values.password}
                  onChange={registerValidation.handleChange}
                  onBlur={registerValidation.handleBlur}
                  placeholder="Min. 6 chars"
                  className={`input-field pl-9 pr-9 text-sm ${
                    registerValidation.getFieldError('password') ? 'border-red-400 ring-2 ring-red-100' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-primary p-1"
                >
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {registerValidation.getFieldError('password') && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> {registerValidation.getFieldError('password')}
                </p>
              )}
            </div>
          </div>
          <button 
            type="submit" 
            disabled={registerValidation.isSubmitting} 
            className="btn-primary w-full py-3 text-sm mt-1 disabled:opacity-70"
          >
            {registerValidation.isSubmitting ? <ButtonLoader /> : 'Create Account'}
          </button>
        </form>
      )}

      <p className="text-center text-xs text-brand-muted mt-4 leading-relaxed">
        Your cart and preferences are saved when you sign in.
      </p>
    </Modal>
  );
}
