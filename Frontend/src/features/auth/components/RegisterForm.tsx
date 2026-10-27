import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input, PasswordInput } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Feedback';
import { ApiError } from '@/api/client/http';
import { getApiErrorMessage, getFieldErrors } from '@/api/errors';
import { es } from '@/i18n/es';
import { authApi } from '../api/authApi';
import { useAuth } from '../AuthContext';
import { registerSchema, RegisterFormData } from '../schemas/registerSchema';

/** La cuenta se creó, pero no fue posible iniciar sesión automáticamente. */
class AccountCreatedError extends Error {}

/**
 * Crea una cuenta de cliente (el backend asigna siempre ese rol) e inicia sesión.
 * La redirección posterior la decide RegisterPage con el usuario devuelto por el backend.
 */
export const RegisterForm: React.FC = () => {
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { nombre: '', email: '', telefono: '', password: '' },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const { telefono, ...rest } = data;
      await authApi.register({ ...rest, ...(telefono ? { telefono } : {}) });
      try {
        return await login({ email: data.email, password: data.password });
      } catch {
        throw new AccountCreatedError();
      }
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 400) {
        for (const [field, message] of Object.entries(getFieldErrors(error))) {
          if (field in registerSchema.shape) {
            setError(field as keyof RegisterFormData, { message });
          }
        }
      }
    },
  });

  return (
    <div className="flex w-full flex-col gap-6">
      {registerMutation.isError && (
        <Alert tone="error">
          {registerMutation.error instanceof AccountCreatedError ? (
            <>
              {es.auth.cuentaCreadaSinSesion}{' '}
              <Link to="/login" className="font-semibold underline">
                {es.auth.inicieSesion}
              </Link>{' '}
              {es.auth.conSuCorreo}
            </>
          ) : (
            getApiErrorMessage(registerMutation.error)
          )}
        </Alert>
      )}

      <form
        onSubmit={handleSubmit((data) => registerMutation.mutate(data))}
        className="flex flex-col gap-5"
        noValidate
      >
        <Input
          label={es.auth.nombre}
          type="text"
          autoComplete="name"
          error={errors.nombre?.message}
          {...register('nombre')}
        />
        <Input
          label={es.auth.correo}
          type="email"
          autoComplete="email"
          placeholder={es.auth.correoPlaceholder}
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label={es.auth.telefono}
          labelSuffix={es.comunes.opcional}
          type="tel"
          autoComplete="tel"
          error={errors.telefono?.message}
          {...register('telefono')}
        />
        <PasswordInput
          label={es.auth.contrasena}
          autoComplete="new-password"
          hint={es.auth.ayudaContrasena}
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" size="lg" className="w-full" isLoading={registerMutation.isPending}>
          {es.auth.registroBoton}
        </Button>
      </form>
    </div>
  );
};
