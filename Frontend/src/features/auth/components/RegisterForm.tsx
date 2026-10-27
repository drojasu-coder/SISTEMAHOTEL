import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useAuthReturn } from '../useAuthReturn';
import { Select } from '@/components/ui/Select';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input, PasswordInput } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Feedback';
import { ApiError } from '@/api/client/http';
import { getFieldErrors } from '@/api/errors';
import { TranslatedError, usePublicTexts, usePublicInterface, useRevalidateErrors } from '@/i18n/public';
import { authApi } from '../api/authApi';
import { useAuth } from '../AuthContext';
import { createRegisterSchema, RegisterFormData } from '../schemas/registerSchema';

/** La cuenta se creó, pero no fue posible iniciar sesión automáticamente. */
class AccountCreatedError extends Error {}

/**
 * Crea una cuenta de cliente (el backend asigna siempre ese rol) e inicia sesión.
 * La redirección posterior la decide RegisterPage con el usuario devuelto por el backend.
 */
export const RegisterForm: React.FC = () => {
  const auth = usePublicTexts('auth');
  const common = usePublicTexts('comunes');
  const { p, locale } = usePublicInterface();
  const { login } = useAuth();
  const context = useAuthReturn();
  const submitting = useRef(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [callingCode, setCallingCode] = useState('');

  const {
    register,
    handleSubmit,
    trigger,
    setError,
    resetField,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(createRegisterSchema(p, callingCode), { errorMap: () => ({ message: p('invalidField') }) }),
    defaultValues: { nombre: '', email: '', telefono: '', password: '' },
  });

  const registerMutation = useMutation({
    retry: false,
    mutationFn: async (data: RegisterFormData) => {
      const { telefono, ...rest } = data;
      await authApi.register({ ...rest, ...(telefono ? { telefono } : {}) });
      setAccountCreated(true);
      try {
        return await login({ email: data.email, password: data.password });
      } catch {
        resetField('password');
        throw new AccountCreatedError();
      }
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 400) {
        for (const [field, message] of Object.entries(getFieldErrors(error))) {
          if (field in createRegisterSchema(p).shape) {
            setError(field as keyof RegisterFormData, { type: 'server', message });
          }
        }
      }
    },
  });

  const phoneInvalid = Boolean(errors.telefono);
  useEffect(() => {
    if (phoneInvalid) void trigger('telefono');
  }, [callingCode, phoneInvalid, trigger]);

  useRevalidateErrors(locale, () => trigger((Object.keys(errors) as (keyof RegisterFormData)[]).filter((key) => errors[key]?.type !== 'server')), Object.values(errors).some((error) => error.type !== 'server'));

  return (
    <div className="flex w-full flex-col gap-6">
      {registerMutation.isError && (
        <Alert tone="error">
          {registerMutation.error instanceof AccountCreatedError ? (
            <>
              {auth.cuentaCreadaSinSesion}{' '}
              <Link to="/login" state={context.state} className="font-semibold underline">
                {auth.inicieSesion}
              </Link>{' '}
              {auth.conSuCorreo}
            </>
          ) : (
            <TranslatedError error={{ api: registerMutation.error }} />
          )}
        </Alert>
      )}

      <form
        onSubmit={handleSubmit(async (data) => {
          if (submitting.current || accountCreated) return;
          submitting.current = true;
          try { await registerMutation.mutateAsync(data); } catch { /* Mensaje accesible de la mutación. */ }
          finally { submitting.current = false; }
        })}
        className="flex flex-col gap-5"
        noValidate
      >
        <fieldset disabled={registerMutation.isPending || accountCreated} className="flex min-w-0 flex-col gap-5">
        <Input
          label={auth.nombre}
          aria-required="true"
          type="text"
          autoComplete="name"
          error={errors.nombre?.type === 'server' ? <span lang={locale === 'es' ? 'es' : undefined}>{locale === 'en' ? p('invalidField') : errors.nombre?.message}</span> : errors.nombre?.message}
          {...register('nombre')}
        />
        <Input
          label={auth.correo}
          aria-required="true"
          type="email"
          autoComplete="email"
          placeholder={auth.correoPlaceholder}
          error={errors.email?.type === 'server' ? <span lang={locale === 'es' ? 'es' : undefined}>{locale === 'en' ? p('invalidField') : errors.email?.message}</span> : errors.email?.message}
          {...register('email')}
        />
        <Select label={p('phoneCountry')} value={callingCode} onChange={(event) => setCallingCode(event.target.value)}>
          <option value="">{p('phoneManual')}</option>
          <option value="+502">Guatemala (+502)</option>
          <option value="+503">El Salvador (+503)</option>
          <option value="+504">Honduras (+504)</option>
          <option value="+505">Nicaragua (+505)</option>
          <option value="+506">Costa Rica (+506)</option>
          <option value="+507">Panamá (+507)</option>
          <option value="+52">México (+52)</option>
          <option value="+1">{locale === 'es' ? 'Estados Unidos / Canadá' : 'United States / Canada'} (+1)</option>
          <option value="+34">{locale === 'es' ? 'España' : 'Spain'} (+34)</option>
          <option value="+44">{locale === 'es' ? 'Reino Unido' : 'United Kingdom'} (+44)</option>
        </Select>
        <Input
          label={auth.telefono}
          labelSuffix={common.opcional}
          type="tel"
          autoComplete="tel"
          hint={p('phoneHelp')}
          error={errors.telefono?.type === 'server' ? <span lang={locale === 'es' ? 'es' : undefined}>{locale === 'en' ? p('invalidField') : errors.telefono?.message}</span> : errors.telefono?.message}
          {...register('telefono')}
        />
        <PasswordInput
          label={auth.contrasena}
          aria-required="true"
          autoComplete="new-password"
          hint={p('passwordRules')}
          error={errors.password?.type === 'server' ? <span lang={locale === 'es' ? 'es' : undefined}>{locale === 'en' ? p('invalidField') : errors.password?.message}</span> : errors.password?.message}
          {...register('password')}
        />

        </fieldset>
        <Button disabled={accountCreated} type="submit" size="lg" className="w-full" isLoading={registerMutation.isPending}>
          {auth.registroBoton}
        </Button>
      </form>
    </div>
  );
};
