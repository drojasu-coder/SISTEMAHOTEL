import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { loginSchema, LoginFormData } from '../schemas/loginSchema';
import { Button } from '@/components/ui/Button';
import { Input, PasswordInput } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Feedback';
import { getApiErrorMessage } from '@/api/errors';
import { es } from '@/i18n/es';
import { useAuth } from '../AuthContext';

/**
 * El formulario solo inicia sesión. La redirección posterior la decide LoginPage
 * a partir del rol que devuelve el backend.
 */
export const LoginForm: React.FC = () => {
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) => login(data),
  });

  return (
    <div className="flex w-full flex-col gap-6">
      {loginMutation.isError && (
        <Alert tone="error">{getApiErrorMessage(loginMutation.error)}</Alert>
      )}

      <form
        onSubmit={handleSubmit((data) => loginMutation.mutate(data))}
        className="flex flex-col gap-5"
        noValidate
      >
        <Input
          label={es.auth.correo}
          type="email"
          autoComplete="email"
          placeholder={es.auth.correoPlaceholder}
          error={errors.email?.message}
          {...register('email')}
        />

        <PasswordInput
          label={es.auth.contrasena}
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" size="lg" className="w-full" isLoading={loginMutation.isPending}>
          {es.auth.loginBoton}
        </Button>
      </form>
    </div>
  );
};
