import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, Mail, CheckCircle2 } from 'lucide-react';
import { loginSchema, LoginFormData } from '../schemas/loginSchema';
import { Button } from '@/components/ui/Button';

export const LoginForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [submittedData, setSubmittedData] = useState<LoginFormData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    // Demostración de arquitectura de formularios validada por Zod
    setSubmittedData(data);
  };

  return (
    <div className="w-full">
      {submittedData && (
        <div className="mb-6 p-4 rounded-xl bg-status-success-bg border border-status-success/30 text-status-success flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold">Validación de formulario exitosa</p>
            <p className="mt-0.5 text-charcoal-700">
              Datos validados con Zod: <span className="font-mono">{submittedData.email}</span>
            </p>
            <p className="mt-1 text-[11px] text-charcoal-400">
              (Integración con JWT backend planificada para Fase 6B)
            </p>
            <button
              type="button"
              onClick={() => {
                setSubmittedData(null);
                reset();
              }}
              className="mt-2 text-xs underline font-medium hover:text-charcoal-900"
            >
              Probar otro ingreso
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5" noValidate>
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1.5">
            Correo Electrónico
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="email"
              type="email"
              placeholder="ejemplo@hotelhunapu.com"
              {...register('email')}
              className={`w-full h-11 sm:h-12 pl-10 pr-4 rounded-lg border bg-white text-base sm:text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-bronze-500 focus:border-transparent transition-colors ${
                errors.email ? 'border-status-danger focus:ring-status-danger' : 'border-charcoal-200 hover:border-charcoal-400'
              }`}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-xs text-status-danger font-medium">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
            <label htmlFor="password" className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider">
              Contraseña
            </label>
            <span className="text-xs text-bronze-700 hover:underline cursor-pointer py-0.5">
              ¿Olvidó su contraseña?
            </span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password')}
              className={`w-full h-11 sm:h-12 pl-10 pr-11 rounded-lg border bg-white text-base sm:text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-bronze-500 focus:border-transparent transition-colors ${
                errors.password ? 'border-status-danger focus:ring-status-danger' : 'border-charcoal-200 hover:border-charcoal-400'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-charcoal-400 hover:text-charcoal-700 transition-colors focus:outline-none"
              tabIndex={-1}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-status-danger font-medium">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button type="submit" variant="primary" size="lg" className="w-full mt-2 h-11 sm:h-12 text-sm sm:text-base justify-center" isLoading={isSubmitting}>
          Iniciar Sesión
        </Button>
      </form>
    </div>
  );
};
