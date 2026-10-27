import React, { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { createLoginSchema, LoginFormData } from '../schemas/loginSchema';
import { Button } from '@/components/ui/Button';
import { Input, PasswordInput } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Feedback';
import { TranslatedError, usePublicTexts, usePublicInterface, useRevalidateErrors } from '@/i18n/public';
import { useAuth } from '../AuthContext';

/**
 * El formulario solo inicia sesión. La redirección posterior la decide LoginPage
 * a partir del rol que devuelve el backend.
 */
export const LoginForm: React.FC = () => {
  const auth = usePublicTexts('auth');
  const { p, locale } = usePublicInterface();
  const { login } = useAuth();
  const submitting = useRef(false);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(createLoginSchema(p), { errorMap: () => ({ message: p('invalidField') }) }),
    defaultValues: { email: '', password: '' },
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) => login(data),
    retry: false,
  });

  useRevalidateErrors(locale, () => trigger(), Object.keys(errors).length > 0);

  return (
    <div className="flex w-full flex-col gap-6">
      {loginMutation.isError && (
        <Alert tone="error"><TranslatedError error={{ api: loginMutation.error }} /></Alert>
      )}

      <form
        onSubmit={handleSubmit(async (data) => {
          if (submitting.current) return;
          submitting.current = true;
          try { await loginMutation.mutateAsync(data); } catch { /* Mensaje accesible de la mutación. */ }
          finally { submitting.current = false; }
        })}
        className="flex flex-col gap-5"
        noValidate
      >
        <Input
          label={auth.correo}
          aria-required="true"
          type="email"
          autoComplete="email"
          placeholder={auth.correoPlaceholder}
          error={errors.email?.message}
          {...register('email')}
        />

        <PasswordInput
          label={auth.contrasena}
          aria-required="true"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" size="lg" className="w-full" isLoading={loginMutation.isPending}>
          {auth.loginBoton}
        </Button>
      </form>
    </div>
  );
};
