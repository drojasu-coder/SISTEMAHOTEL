export interface paths {
    "/api/configuraciones/iva": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener el IVA vigente */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Configuración del IVA obtenida correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Actualizar el IVA vigente */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        porcentaje_iva: number;
                    };
                };
            };
            responses: {
                /** @description Configuración del IVA actualizada correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        trace?: never;
    };
    "/api/auth/register": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Registrar un nuevo usuario
         * @description Crea una cuenta nueva. Por defecto, todas las cuentas creadas aquí tienen el rol "cliente".
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["RegisterRequest"];
                };
            };
            responses: {
                /** @description Usuario registrado correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["RegisterResponse"];
                    };
                };
                /** @description Datos de registro inválidos o cuerpo malformado */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description El correo electrónico ya se encuentra registrado */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Iniciar sesión
         * @description Inicia sesión y devuelve un JWT (accessToken) y la información del usuario.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["LoginRequest"];
                };
            };
            responses: {
                /** @description Inicio de sesión exitoso */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["LoginResponse"];
                    };
                };
                /** @description Credenciales enviadas con formato inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Correo electrónico o contraseña incorrectos */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description La cuenta de usuario se encuentra deshabilitada */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Obtener perfil del usuario actual
         * @description Devuelve la información del usuario autenticado según su JWT.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Información del usuario obtenida correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AuthMeResponse"];
                    };
                };
                /** @description Usuario no autenticado o sesión expirada */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description La cuenta de usuario se encuentra deshabilitada */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/usuarios": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar usuarios
         * @description Obtiene todos los usuarios registrados. Requiere rol administrador.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Usuarios obtenidos correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            /** @example Usuarios obtenidos correctamente */
                            message?: string;
                            data?: components["schemas"]["Usuario"][];
                        };
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Crear usuario administrativo
         * @description Permite a un administrador crear usuarios con un rol determinado.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @example Ana López */
                        nombre: string;
                        /**
                         * Format: email
                         * @example ana@hotel.com
                         */
                        email: string;
                        /**
                         * Format: password
                         * @example Hotel1234
                         */
                        password: string;
                        /**
                         * @example recepcionista
                         * @enum {string}
                         */
                        rol: "admin" | "recepcionista" | "gerente_restaurante" | "gerente_habitaciones" | "empleado_operativo" | "cliente";
                        /** @example 55554444 */
                        telefono?: string | null;
                    };
                };
            };
            responses: {
                /** @description Usuario creado correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 201 */
                            statusCode?: number;
                            /** @example Usuario creado correctamente */
                            message?: string;
                            data?: components["schemas"]["Usuario"];
                        };
                    };
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description El correo electrónico ya se encuentra registrado */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/usuarios/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener usuario por ID */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description ID del usuario */
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Usuario obtenido correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            /** @example Usuario obtenido correctamente */
                            message?: string;
                            data?: components["schemas"]["Usuario"];
                        };
                    };
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Actualizar datos de un usuario
         * @description Modifica nombre, correo o teléfono. No modifica rol, estado ni contraseña.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @example Ana María López */
                        nombre?: string;
                        /**
                         * Format: email
                         * @example ana.lopez@hotel.com
                         */
                        email?: string;
                        /** @example 55554444 */
                        telefono?: string | null;
                    };
                };
            };
            responses: {
                /** @description Usuario actualizado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description El correo electrónico ya está registrado */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        trace?: never;
    };
    "/api/usuarios/{id}/rol": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Cambiar rol de un usuario
         * @description Cambia el rol de un usuario. Un administrador no puede modificar su propio rol.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /**
                         * @example gerente_habitaciones
                         * @enum {string}
                         */
                        rol: "admin" | "recepcionista" | "gerente_restaurante" | "gerente_habitaciones" | "empleado_operativo" | "cliente";
                    };
                };
            };
            responses: {
                /** @description Rol actualizado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Rol o ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description El administrador intentó modificar su propio rol */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        trace?: never;
    };
    "/api/usuarios/{id}/estado": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Activar o desactivar un usuario
         * @description Modifica el estado de una cuenta sin eliminar su información histórica.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @example false */
                        activo: boolean;
                    };
                };
            };
            responses: {
                /** @description Estado actualizado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description El administrador intentó deshabilitar su propia cuenta */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        trace?: never;
    };
    "/api/vehiculos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar vehículos
         * @description Obtiene todos los vehículos registrados. Requiere rol administrador.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Vehículos obtenidos correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            /** @example Vehículos obtenidos correctamente */
                            message?: string;
                            data?: components["schemas"]["Vehiculo"][];
                        };
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Registrar un vehículo
         * @description Registra un vehículo para el servicio de transporte. Requiere rol administrador.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /**
                         * @example van
                         * @enum {string}
                         */
                        tipo: "shuttle" | "van" | "sedan";
                        /** @example 12 */
                        capacidad: number;
                        /** @example P-123ABC */
                        placa?: string | null;
                    };
                };
            };
            responses: {
                /** @description Vehículo creado correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 201 */
                            statusCode?: number;
                            /** @example Vehículo creado correctamente */
                            message?: string;
                            data?: components["schemas"]["Vehiculo"];
                        };
                    };
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/vehiculos/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener un vehículo por ID */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description ID del vehículo */
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Vehículo obtenido correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            /** @example Vehículo obtenido correctamente */
                            message?: string;
                            data?: components["schemas"]["Vehiculo"];
                        };
                    };
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Vehículo no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        /**
         * Eliminar un vehículo
         * @description Elimina un vehículo únicamente cuando no tenga reservas de transporte asociadas.
         */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Vehículo eliminado correctamente */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Vehículo no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description El vehículo tiene reservas de transporte asociadas */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /**
         * Actualizar un vehículo
         * @description Permite modificar tipo, capacidad o placa del vehículo.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /**
                         * @example shuttle
                         * @enum {string}
                         */
                        tipo?: "shuttle" | "van" | "sedan";
                        /** @example 20 */
                        capacidad?: number;
                        /** @example C-999XYZ */
                        placa?: string | null;
                    };
                };
            };
            responses: {
                /** @description Vehículo actualizado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            /** @example Vehículo actualizado correctamente */
                            message?: string;
                            data?: components["schemas"]["Vehiculo"];
                        };
                    };
                };
                /** @description Datos o ID inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Vehículo no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        trace?: never;
    };
    "/api/reservas-transporte": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar reservas de transporte
         * @description Los clientes obtienen únicamente sus propias reservas. Los administradores pueden consultar todas.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Reservas obtenidas correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            /** @example Reservas de transporte obtenidas correctamente */
                            message?: string;
                            data?: components["schemas"]["ReservaTransporte"][];
                        };
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario inactivo */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        /**
         * Solicitar un traslado
         * @description Registra un traslado y asigna automáticamente un chofer activo y el vehículo de menor capacidad que pueda transportar a los pasajeros. Si no hay recursos disponibles, la reserva queda pendiente.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @example Aeropuerto La Aurora */
                        origen: string;
                        /** @example Hotel Central */
                        destino: string;
                        /**
                         * Format: date-time
                         * @example 2026-10-20T08:00:00-06:00
                         */
                        fecha_hora: string;
                        /** @example 3 */
                        numero_pasajeros: number;
                    };
                };
            };
            responses: {
                /** @description Reserva creada correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            success?: boolean;
                            /** @example 201 */
                            statusCode?: number;
                            message?: string;
                            data?: components["schemas"]["ReservaTransporte"];
                        };
                    };
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Fecha pasada, origen y destino iguales o ningún vehículo con capacidad suficiente. */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/reservas-transporte/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener una reserva de transporte por ID */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Reserva obtenida correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            success?: boolean;
                            statusCode?: number;
                            message?: string;
                            data?: components["schemas"]["ReservaTransporte"];
                        };
                    };
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description El usuario no tiene acceso a esta reserva */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Reserva no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Modificar una reserva pendiente
         * @description Solo las reservas pendientes pueden modificarse. Después del cambio el sistema vuelve a intentar asignar chofer y vehículo automáticamente.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        origen?: string;
                        destino?: string;
                        /** Format: date-time */
                        fecha_hora?: string;
                        numero_pasajeros?: number;
                    };
                };
            };
            responses: {
                /** @description Reserva actualizada correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Reserva perteneciente a otro usuario */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Reserva no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description La reserva ya no es editable */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Regla de negocio incumplida */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        trace?: never;
    };
    "/api/reservas-transporte/{id}/cancelar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Cancelar una reserva de transporte
         * @description Cancela la reserva sin eliminar su historial y libera al chofer y vehículo para futuras asignaciones.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Reserva cancelada correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Reserva perteneciente a otro usuario */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Reserva no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description La reserva ya se encuentra cancelada */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        trace?: never;
    };
    "/api/reservas-transporte/{id}/asignar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Reintentar asignación de recursos
         * @description Permite al administrador reintentar la asignación automática de chofer y vehículo para una reserva pendiente.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Recursos asignados correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Solo administradores */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Reserva no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description La reserva no está pendiente o todavía no hay recursos disponibles. */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        trace?: never;
    };
    "/api/choferes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar choferes
         * @description Obtiene todos los choferes registrados. Requiere rol administrador.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Choferes obtenidos correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            /** @example Choferes obtenidos correctamente */
                            message?: string;
                            data?: components["schemas"]["Chofer"][];
                        };
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        /** Registrar un chofer */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @example Luis Pérez */
                        nombre: string;
                        /** @example A-123456 */
                        licencia?: string | null;
                    };
                };
            };
            responses: {
                /** @description Chofer creado correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/choferes/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener un chofer por ID */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Chofer obtenido correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            /** @example Chofer obtenido correctamente */
                            message?: string;
                            data?: components["schemas"]["Chofer"];
                        };
                    };
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Chofer no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Actualizar datos de un chofer
         * @description Permite modificar nombre y licencia.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @example Luis Alberto Pérez */
                        nombre?: string;
                        /** @example A-654321 */
                        licencia?: string | null;
                    };
                };
            };
            responses: {
                /** @description Chofer actualizado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Chofer no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        trace?: never;
    };
    "/api/choferes/{id}/estado": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Activar o desactivar un chofer */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @example false */
                        activo: boolean;
                    };
                };
            };
            responses: {
                /** @description Estado del chofer actualizado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Chofer no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        trace?: never;
    };
    "/api/sucursales": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar sucursales
         * @description Obtiene todas las sucursales disponibles.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Sucursales obtenidas correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SucursalesResponse"];
                    };
                };
                /** @description Error interno del servidor */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Crear una sucursal
         * @description Crea una nueva sucursal. Requiere rol administrador.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["CreateSucursalRequest"];
                };
            };
            responses: {
                /** @description Sucursal creada correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SucursalResponse"];
                    };
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Conflicto al crear la sucursal */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/sucursales/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener una sucursal por ID */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Sucursal obtenida correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SucursalResponse"];
                    };
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Sucursal no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        /**
         * Eliminar una sucursal
         * @description Elimina una sucursal si no está asociada a habitaciones existentes.
         */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Sucursal eliminada correctamente */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Sucursal no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description La sucursal está siendo utilizada */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /**
         * Actualizar una sucursal
         * @description Actualiza parcialmente una sucursal. Requiere rol administrador.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdateSucursalRequest"];
                };
            };
            responses: {
                /** @description Sucursal actualizada correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SucursalResponse"];
                    };
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Sucursal no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/reservas-mesa": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar todas las reservas de mesa
         * @description Operación administrativa disponible únicamente para administradores.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Reservas obtenidas correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example success */
                            status?: string;
                            data?: components["schemas"]["ReservaMesa"][];
                        };
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos administrativos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        /**
         * Crear una reserva de mesa
         * @description Permite a un cliente autenticado reservar una mesa para sí mismo. El usuario se obtiene automáticamente del JWT. La mesa debe existir, tener capacidad suficiente, no encontrarse en mantenimiento y estar disponible para la fecha y hora solicitadas.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["CreateReservaMesaRequest"];
                };
            };
            responses: {
                /** @description Reserva creada correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Solo los clientes pueden crear reservas de mesa */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Mesa no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description La mesa ya está reservada en esa fecha y hora o se encuentra en mantenimiento. */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description La fecha u hora solicitada está en el pasado o se excede la capacidad de la mesa. */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/reservas-mesa/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Obtener una reserva de mesa por ID
         * @description Operación administrativa disponible únicamente para administradores.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Reserva encontrada */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos administrativos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Reserva no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/reservas-mesa/{id}/estado": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Cambiar el estado de una reserva de mesa
         * @description Permite al administrador cambiar una reserva entre confirmada y cancelada. Si se intenta reactivar una reserva cancelada, el backend vuelve a comprobar disponibilidad, capacidad y estado de la mesa.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdateReservaMesaEstadoRequest"];
                };
            };
            responses: {
                /** @description Estado actualizado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos administrativos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Reserva no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description La reserva ya posee el estado solicitado, la mesa ya está ocupada para esa fecha y hora o la mesa se encuentra en mantenimiento. */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description No se puede reactivar la reserva porque su fecha u hora ya pasó o porque excede la capacidad actual de la mesa. */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        trace?: never;
    };
    "/api/mesas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar mesas
         * @description Obtiene todas las mesas disponibles en el restaurante junto con los datos de su sucursal.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Mesas obtenidas correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["MesasResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Crear una mesa
         * @description Crea una nueva mesa. Requiere rol administrador o gerente de restaurante.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["CreateMesaRequest"];
                };
            };
            responses: {
                /** @description Mesa creada correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["MesaResponse"];
                    };
                };
                /** @description Datos enviados inválidos o incompletos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description No autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Permisos insuficientes (requiere admin o gerente_restaurante) */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description La sucursal indicada no existe */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/mesas/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener una mesa por ID */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Mesa obtenida correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["MesaResponse"];
                    };
                };
                /** @description Parámetro de ruta inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Mesa no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        /** Eliminar una mesa */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Mesa eliminada correctamente */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        options?: never;
        head?: never;
        /**
         * Actualizar una mesa
         * @description Actualiza una mesa existente. Requiere rol administrador o gerente de restaurante. No admite sucursal_id y exige al menos un campo permitido.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdateMesaRequest"];
                };
            };
            responses: {
                /** @description Mesa actualizada correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["MesaResponse"];
                    };
                };
                /** @description Datos enviados inválidos, cuerpo vacío o parámetros incorrectos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description No autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Permisos insuficientes (requiere admin o gerente_restaurante) */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Mesa no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/proveedor-productos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Listar productos de proveedores */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Productos de proveedores obtenidos correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /** Crear un producto de proveedor */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        proveedor_id: number;
                        nombre_producto: string;
                        descripcion?: string | null;
                    };
                };
            };
            responses: {
                /** @description Producto del proveedor creado correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Proveedor no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/proveedor-productos/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener un producto de proveedor por ID */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Producto del proveedor obtenido correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Producto del proveedor no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        /** Eliminar un producto de proveedor */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Producto del proveedor eliminado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Producto del proveedor no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /** Actualizar un producto de proveedor */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        proveedor_id?: number;
                        nombre_producto?: string;
                        descripcion?: string | null;
                    };
                };
            };
            responses: {
                /** @description Producto del proveedor actualizado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Producto o proveedor no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/proveedores": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Listar proveedores */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Proveedores obtenidos correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /** Crear un proveedor */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        nombre: string;
                        nit?: string | null;
                        contacto?: string | null;
                        telefono?: string | null;
                        /** Format: email */
                        email?: string | null;
                    };
                };
            };
            responses: {
                /** @description Proveedor creado correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/proveedores/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener un proveedor por ID */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Proveedor obtenido correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Proveedor no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        /** Eliminar un proveedor */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Proveedor eliminado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Proveedor no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Proveedor en uso */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /** Actualizar un proveedor */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        nombre?: string;
                        nit?: string | null;
                        contacto?: string | null;
                        telefono?: string | null;
                        /** Format: email */
                        email?: string | null;
                    };
                };
            };
            responses: {
                /** @description Proveedor actualizado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Proveedor no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/cuentas-por-pagar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Listar cuentas por pagar */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Cuentas por pagar obtenidas correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /** Crear una cuenta por pagar */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        proveedor_id: number;
                        monto: number;
                        /** Format: date */
                        fecha_vencimiento: string;
                        /** @enum {string} */
                        estado?: "pendiente" | "pagado" | "vencido";
                        factura_referencia?: string | null;
                    };
                };
            };
            responses: {
                /** @description Cuenta por pagar creada correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Proveedor no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/cuentas-por-pagar/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener una cuenta por pagar por ID */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Cuenta por pagar obtenida correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Cuenta por pagar no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        /** Eliminar una cuenta por pagar */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Cuenta por pagar eliminada correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Cuenta por pagar no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /** Actualizar una cuenta por pagar */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        proveedor_id?: number;
                        monto?: number;
                        /** Format: date */
                        fecha_vencimiento?: string;
                        /** @enum {string} */
                        estado?: "pendiente" | "pagado" | "vencido";
                        factura_referencia?: string | null;
                    };
                };
            };
            responses: {
                /** @description Cuenta por pagar actualizada correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Cuenta o proveedor no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/turnos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar turnos
         * @description Obtiene todos los turnos registrados. Requiere rol administrador.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Turnos obtenidos correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            /** @example Turnos obtenidos correctamente */
                            message?: string;
                            data?: components["schemas"]["Turno"][];
                        };
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Crear un turno
         * @description Asigna un turno a un empleado. El sistema impide traslapes de horarios para un mismo empleado y admite turnos nocturnos, por ejemplo 22:00 a 06:00.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @example 1 */
                        empleado_id: number;
                        /**
                         * Format: date
                         * @example 2026-10-10
                         */
                        fecha: string;
                        /** @example 08:00 */
                        hora_inicio: string;
                        /** @example 16:00 */
                        hora_fin: string;
                    };
                };
            };
            responses: {
                /** @description Turno creado correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 201 */
                            statusCode?: number;
                            /** @example Turno creado correctamente */
                            message?: string;
                            data?: components["schemas"]["Turno"];
                        };
                    };
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Empleado no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description El empleado ya posee un turno que se traslapa con el horario solicitado */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description La hora de inicio y finalización son iguales */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/turnos/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener un turno por ID */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description ID del turno */
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Turno obtenido correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            /** @example Turno obtenido correctamente */
                            message?: string;
                            data?: components["schemas"]["Turno"];
                        };
                    };
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Turno no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        /**
         * Eliminar un turno
         * @description Elimina definitivamente un turno registrado.
         */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Turno eliminado correctamente */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Turno no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        options?: never;
        head?: never;
        /**
         * Actualizar un turno
         * @description Permite modificar fecha y horario. El empleado asociado al turno no puede reasignarse. La disponibilidad vuelve a validarse para impedir traslapes.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /**
                         * Format: date
                         * @example 2026-10-11
                         */
                        fecha?: string;
                        /** @example 09:00 */
                        hora_inicio?: string;
                        /** @example 17:00 */
                        hora_fin?: string;
                    };
                };
            };
            responses: {
                /** @description Turno actualizado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            /** @example Turno actualizado correctamente */
                            message?: string;
                            data?: components["schemas"]["Turno"];
                        };
                    };
                };
                /** @description Datos o ID inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Turno no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description El horario se traslapa con otro turno del empleado */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Rango horario inválido */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        trace?: never;
    };
    "/api/empleados": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar empleados
         * @description Obtiene todos los empleados registrados. Requiere rol administrador.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Empleados obtenidos correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            /** @example Empleados obtenidos correctamente */
                            message?: string;
                            data?: components["schemas"]["Empleado"][];
                        };
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        /**
         * Crear una ficha de empleado
         * @description Vincula una cuenta de usuario existente con una sucursal y crea su ficha laboral. Requiere rol administrador.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @example 3 */
                        usuario_id: number;
                        /** @example 1 */
                        sucursal_id: number;
                        /** @example Mantenimiento */
                        area: string;
                        /**
                         * Format: date
                         * @example 2026-09-01
                         */
                        fecha_contratacion?: string | null;
                    };
                };
            };
            responses: {
                /** @description Empleado creado correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario o sucursal no encontrados */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description El usuario ya posee una ficha de empleado */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Cuenta inactiva, usuario cliente, sucursal inactiva o fecha de contratación futura. */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/empleados/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener un empleado por ID */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description ID del empleado */
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Empleado obtenido correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            /** @example Empleado obtenido correctamente */
                            message?: string;
                            data?: components["schemas"]["Empleado"];
                        };
                    };
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Empleado no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        /**
         * Eliminar una ficha de empleado
         * @description Elimina únicamente la ficha laboral. La cuenta de usuario permanece registrada. No se permite eliminar empleados que tengan turnos asociados.
         */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Empleado eliminado correctamente */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Empleado no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description El empleado tiene turnos asociados */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        options?: never;
        head?: never;
        /**
         * Actualizar un empleado
         * @description Permite modificar sucursal, área y fecha de contratación. El usuario asociado a la ficha no puede reasignarse.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @example 1 */
                        sucursal_id?: number;
                        /** @example Atención al Cliente */
                        area?: string;
                        /**
                         * Format: date
                         * @example 2026-09-01
                         */
                        fecha_contratacion?: string | null;
                    };
                };
            };
            responses: {
                /** @description Empleado actualizado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos o ID inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Empleado o sucursal no encontrados */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Regla de negocio incumplida */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        trace?: never;
    };
    "/api/boletos-parque": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar todos los boletos del parque
         * @description Obtiene todos los boletos registrados junto con información básica del usuario propietario. Solo disponible para administradores.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Boletos obtenidos correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            /** @example Boletos de parque obtenidos correctamente */
                            message?: string;
                            data?: components["schemas"]["BoletoParque"][];
                        };
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Solo administradores */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Adquirir un boleto para el parque
         * @description Permite a un cliente autenticado adquirir un boleto para una fecha determinada. El usuario se obtiene automáticamente del JWT. El precio es calculado por el backend según el tipo de boleto, por lo que el cliente no puede modificarlo. También se genera automáticamente un código QR único y el boleto inicia en estado valido.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    /**
                     * @example {
                     *       "tipo_boleto": "adulto",
                     *       "fecha_visita": "2026-10-25"
                     *     }
                     */
                    "application/json": components["schemas"]["CreateBoletoParqueRequest"];
                };
            };
            responses: {
                /** @description Boleto creado correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 201 */
                            statusCode?: number;
                            /** @example Boleto de parque creado correctamente */
                            message?: string;
                            data?: components["schemas"]["BoletoParque"];
                        };
                    };
                };
                /** @description Tipo de boleto, formato o datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Solo los usuarios con rol cliente pueden adquirir boletos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description La fecha de visita se encuentra en el pasado */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/boletos-parque/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener un boleto por ID */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description ID del boleto */
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Boleto obtenido correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            /** @example Boleto de parque obtenido correctamente */
                            message?: string;
                            data?: components["schemas"]["BoletoParque"];
                        };
                    };
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Solo administradores */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Boleto no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        /**
         * Eliminar un boleto del parque
         * @description Solo los administradores pueden eliminar boletos.
         */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description ID del boleto */
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Boleto eliminado correctamente */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Solo administradores */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Boleto no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/boletos-parque/{id}/estado": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Actualizar el estado de un boleto
         * @description Permite al administrador actualizar el estado de un boleto. Un boleto usado o cancelado se considera en estado final y posteriormente ya no puede modificarse.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description ID del boleto */
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    /**
                     * @example {
                     *       "estado": "usado"
                     *     }
                     */
                    "application/json": components["schemas"]["UpdateBoletoParqueEstadoRequest"];
                };
            };
            responses: {
                /** @description Estado actualizado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            /** @example Estado del boleto actualizado correctamente */
                            message?: string;
                            data?: components["schemas"]["BoletoParque"];
                        };
                    };
                };
                /** @description Estado o ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Solo administradores */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Boleto no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description El boleto ya posee ese estado o se encuentra en un estado final y no puede modificarse */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/pagos/stripe/webhook": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Recibe eventos de Stripe
         * @description Endpoint para recibir webhooks de Stripe. Verifica la firma con Stripe-Signature y no usa autenticación JWT.
         */
        post: {
            parameters: {
                query?: never;
                header: {
                    "Stripe-Signature": string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": Record<string, never>;
                };
            };
            responses: {
                /** @description Evento procesado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Firma inválida o cuerpo mal formado */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Error al procesar el evento */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/pagos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Listar pagos con filtros */
        get: {
            parameters: {
                query?: {
                    estado?: "pendiente" | "procesando" | "aprobado" | "rechazado" | "cancelado" | "reembolsado" | "reembolsado_parcial";
                    metodo?: "tarjeta" | "efectivo" | "transferencia";
                    tipo_pago?: "total" | "anticipo" | "saldo";
                    carrito_id?: number;
                    reserva_habitacion_id?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Pagos obtenidos correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PagosResponse"];
                    };
                };
                /** @description Filtros inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description No autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Crear un pago
         * @description Registra un pago según el origen indicado. Los pagos con tarjeta crean un PaymentIntent en Stripe Test Mode y permanecen procesando hasta recibir confirmación por webhook.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["CreatePagoRequest"];
                };
            };
            responses: {
                /** @description Pago creado correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CreatePagoResponse"];
                    };
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description No autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description No autorizado */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Carrito o reserva no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description El pago excede el saldo o conflicto de idempotencia */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Datos de pago o método no válidos */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/pagos/resumen": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener resumen financiero */
        get: {
            parameters: {
                query?: {
                    carrito_id?: number;
                    reserva_habitacion_id?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Resumen de pago obtenido correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ResumenPagoResponse"];
                    };
                };
                /** @description Parámetros inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description No autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description No autorizado */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Carrito o reserva no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Debe indicarse exactamente un origen */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/pagos/intento-activo": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Recuperar intento de pago activo con tarjeta
         * @description Consulta de solo lectura que recupera el intento de pago con tarjeta en curso para un carrito o reserva de habitación, verificando su estado real en Stripe. Si no existe un intento activo o en trámite, retorna data: null.
         */
        get: {
            parameters: {
                query?: {
                    carrito_id?: number;
                    reserva_habitacion_id?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Intento de pago activo obtenido o verificado */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["IntentoActivoPagoResponse"];
                    };
                };
                /** @description Parámetros inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description No autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description No autorizado */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Carrito o reserva no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Error al consultar Stripe */
                502: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/pagos/{id}/aprobar-transferencia": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Aprobar una transferencia pendiente */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Transferencia aprobada correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PagoResponse"];
                    };
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description No autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Pago no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description El pago no es una transferencia aprobable */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/pagos/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener un pago por ID */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Pago obtenido correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PagoResponse"];
                    };
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description No autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description No autorizado */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Pago no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/pagos/{id}/reembolso": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Reembolsar un pago
         * @description Permite realizar el reembolso parcial o total de un pago aprobado.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    /**
                     * @example {
                     *       "monto": 500,
                     *       "motivo": "Solicitud del cliente",
                     *       "idempotency_key": "refund-test-001"
                     *     }
                     */
                    "application/json": {
                        monto: number;
                        motivo?: string;
                        idempotency_key: string;
                    };
                };
            };
            responses: {
                /** @description Reembolso procesado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description No autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Permisos insuficientes (INSUFFICIENT_PERMISSIONS) */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Pago no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Conflicto de negocio (monto excede el pagado) */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Regla de negocio no cumplida */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/tipos-habitacion": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar tipos de habitación
         * @description Obtiene todos los tipos de habitación registrados.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Tipos de habitación obtenidos correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            message?: string;
                            data?: {
                                /** @example 1 */
                                id?: number;
                                /** @example Suite */
                                nombre?: string;
                                /** @example 4 */
                                capacidad_maxima?: number;
                                /** @example 150 */
                                tarifa_noche?: number;
                                /** @example Suite con vista al mar */
                                descripcion?: string;
                            }[];
                        };
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Crear un tipo de habitación
         * @description Crea un nuevo tipo de habitación. Requiere un rol autorizado.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @example Suite */
                        nombre: string;
                        /** @example 4 */
                        capacidad_maxima: number;
                        /** @example 150 */
                        tarifa_noche: number;
                        /** @example Suite con vista al mar */
                        descripcion?: string;
                    };
                };
            };
            responses: {
                /** @description Tipo de habitación creado correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/tipos-habitacion/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener un tipo de habitación por ID */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description ID del tipo de habitación */
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Tipo de habitación obtenido correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example 1 */
                            id?: number;
                            /** @example Suite */
                            nombre?: string;
                            /** @example 4 */
                            capacidad_maxima?: number;
                            /** @example 150 */
                            tarifa_noche?: number;
                            /** @example Suite con vista al mar */
                            descripcion?: string;
                        };
                    };
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Tipo de habitación no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        /**
         * Eliminar un tipo de habitación
         * @description Elimina un tipo de habitación que no esté en uso.
         */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Tipo de habitación eliminado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Tipo de habitación no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description El tipo de habitación está en uso */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /**
         * Actualizar un tipo de habitación
         * @description Actualiza parcialmente un tipo de habitación. Requiere un rol autorizado.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        nombre?: string;
                        capacidad_maxima?: number;
                        tarifa_noche?: number;
                        descripcion?: string;
                    };
                };
            };
            responses: {
                /** @description Tipo de habitación actualizado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Tipo de habitación no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/reservas-parqueo": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar reservas de parqueo
         * @description Operación administrativa para consultar todas las reservas de parqueo.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Reservas obtenidas correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos administrativos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Crear una reserva de parqueo
         * @description Operación administrativa. La asociación con una reserva de habitación es opcional.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @description Reserva de habitación asociada. Puede omitirse o ser null. */
                        reserva_habitacion_id?: number | null;
                        /** @example 1 */
                        parqueo_id: number;
                        /**
                         * @description Acepta YYYY-MM-DD o fecha/hora ISO 8601.
                         * @example 2027-01-10T14:00:00-06:00
                         */
                        fecha_entrada: string;
                        /**
                         * @description Opcional. Puede ser null para una ocupación sin salida definida.
                         * @example 2027-01-12T11:00:00-06:00
                         */
                        fecha_salida?: string | null;
                    };
                };
            };
            responses: {
                /** @description Reserva creada correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos administrativos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Parqueo o reserva de habitación no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Parqueo no disponible o parqueo en mantenimiento */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Fechas inválidas o fecha de entrada en el pasado */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/reservas-parqueo/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Obtener una reserva de parqueo
         * @description Operación administrativa.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Reserva obtenida correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos administrativos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Reserva no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        /**
         * Eliminar una reserva de parqueo
         * @description Actualmente elimina físicamente la reserva porque el modelo no dispone de un estado de cancelación.
         */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Reserva eliminada correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos administrativos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Reserva no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /**
         * Actualizar una reserva de parqueo
         * @description Operación administrativa. Un PATCH vacío es rechazado y reserva_habitacion_id puede enviarse como null para desvincular la reserva.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        reserva_habitacion_id?: number | null;
                        parqueo_id?: number;
                        /** @description Acepta YYYY-MM-DD o fecha/hora ISO 8601. */
                        fecha_entrada?: string;
                        /** @description Puede enviarse como null. */
                        fecha_salida?: string | null;
                    };
                };
            };
            responses: {
                /** @description Reserva actualizada correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos o body vacío */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos administrativos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Reserva, parqueo o reserva de habitación no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Parqueo no disponible o parqueo en mantenimiento */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Fechas inválidas o fecha de entrada en el pasado */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/reservas-habitacion": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar reservas de habitación
         * @description Los usuarios administrativos pueden consultar todas las reservas. Los clientes únicamente reciben sus propias reservas.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Reservas de habitación obtenidas correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ReservasHabitacionResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Crear una reserva de habitación
         * @description Los clientes reservan para sí mismos utilizando el usuario del JWT (omiten usuario_id). Los usuarios administrativos deben indicar usuario_id en el cuerpo.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["CreateReservaHabitacionRequest"];
                };
            };
            responses: {
                /** @description Reserva de habitación creada correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ReservaHabitacionCreatedResponse"];
                    };
                };
                /** @description Datos inválidos o usuario_id faltante para administradores */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado (AUTH_TOKEN_REQUIRED, INVALID_AUTH_FORMAT, INVALID_TOKEN, TOKEN_EXPIRED) */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario o habitación no encontrada (HABITACION_NOT_FOUND) */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Habitación ocupada en esas fechas o en mantenimiento (HABITACION_EN_MANTENIMIENTO, HABITACION_OCUPADA_EN_FECHAS) */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Fechas inválidas, fecha pasada o capacidad excedida (FECHAS_INVALIDAS, ROOM_RESERVATION_DATE_IN_PAST, CAPACIDAD_EXCEDIDA) */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/reservas-habitacion/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Obtener una reserva de habitación
         * @description Los clientes únicamente pueden consultar reservas que les pertenezcan.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Reserva de habitación obtenida correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ReservaHabitacionResponse"];
                    };
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description La reserva pertenece a otro usuario */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Reserva no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        /**
         * Cancelar una reserva de habitación
         * @description Cancela lógicamente la reserva utilizando el estado cancelada y conserva su historial.
         */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Reserva cancelada correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos administrativos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Reserva no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /**
         * Actualizar una reserva de habitación
         * @description Operación administrativa. Un PATCH vacío es rechazado.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        usuario_id?: number;
                        habitacion_id?: number;
                        /** Format: date */
                        fecha_entrada?: string;
                        /** Format: date */
                        fecha_salida?: string;
                        numero_huespedes?: number;
                        /** @enum {string} */
                        estado?: "pendiente" | "confirmada" | "cancelada" | "finalizada" | "expirada";
                    };
                };
            };
            responses: {
                /** @description Reserva actualizada correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos o body vacío */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos administrativos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Reserva, usuario o habitación no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Habitación ocupada en esas fechas o habitación en mantenimiento */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Fechas inválidas, fecha pasada o capacidad excedida */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/promociones": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Listar promociones */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Promociones obtenidas correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /** Crear una promoción */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        nombre: string;
                        /** @enum {string} */
                        tipo_descuento: "porcentaje" | "monto_fijo";
                        valor_descuento: number;
                        aplica_a?: string | null;
                        /** Format: date */
                        fecha_inicio: string;
                        /** Format: date */
                        fecha_fin: string;
                        activa?: boolean;
                    };
                };
            };
            responses: {
                /** @description Promoción creada correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Fechas inválidas */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/promociones/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener una promoción por ID */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Promoción obtenida correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Promoción no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        /** Eliminar una promoción */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Promoción eliminada correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Promoción no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Promoción en uso */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /** Actualizar una promoción */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        nombre?: string;
                        /** @enum {string} */
                        tipo_descuento?: "porcentaje" | "monto_fijo";
                        valor_descuento?: number;
                        aplica_a?: string | null;
                        /** Format: date */
                        fecha_inicio?: string;
                        /** Format: date */
                        fecha_fin?: string;
                        activa?: boolean;
                    };
                };
            };
            responses: {
                /** @description Promoción actualizada correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Promoción no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Fechas inválidas */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/parqueos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar parqueos
         * @description Obtiene todos los parqueos registrados.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Parqueos obtenidos correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ParqueosResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Crear un parqueo
         * @description Crea un nuevo parqueo. Requiere un rol autorizado.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["CreateParqueoRequest"];
                };
            };
            responses: {
                /** @description Parqueo creado correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ParqueoResponse"];
                    };
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Sucursal no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Ya existe un parqueo con ese número en la sucursal */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/parqueos/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener un parqueo por ID */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description ID del parqueo */
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Parqueo obtenido correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ParqueoResponse"];
                    };
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Parqueo no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        /**
         * Eliminar un parqueo
         * @description Elimina un parqueo que no tenga reservas asociadas.
         */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Parqueo eliminado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ParqueoDeleteResponse"];
                    };
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Parqueo no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description El parqueo tiene reservas asociadas */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /**
         * Actualizar un parqueo
         * @description Actualiza parcialmente un parqueo. Requiere un rol autorizado.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdateParqueoRequest"];
                };
            };
            responses: {
                /** @description Parqueo actualizado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ParqueoResponse"];
                    };
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Parqueo o sucursal no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Ya existe un parqueo con ese número en la sucursal */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/habitaciones": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar habitaciones
         * @description Obtiene todas las habitaciones registradas.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Habitaciones obtenidas correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            /** @example Habitaciones obtenidas correctamente */
                            message?: string;
                            data?: {
                                /** @example 1 */
                                id?: number;
                                /** @example 1 */
                                sucursal_id?: number;
                                /** @example 1 */
                                tipo_habitacion_id?: number;
                                /** @example 101 */
                                numero?: string;
                                /**
                                 * @example disponible
                                 * @enum {string}
                                 */
                                estado?: "disponible" | "ocupada" | "mantenimiento" | "limpieza";
                            }[];
                        };
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Crear una habitación
         * @description Crea una nueva habitación. Requiere un rol autorizado.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @example 1 */
                        sucursal_id: number;
                        /** @example 1 */
                        tipo_habitacion_id: number;
                        /** @example 101 */
                        numero: string;
                        /**
                         * @example disponible
                         * @enum {string}
                         */
                        estado?: "disponible" | "ocupada" | "mantenimiento" | "limpieza";
                    };
                };
            };
            responses: {
                /** @description Habitación creada correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 201 */
                            statusCode?: number;
                            message?: string;
                            data?: Record<string, never>;
                        };
                    };
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Sucursal o tipo de habitación no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Ya existe una habitación con ese número en la sucursal */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/habitaciones/disponibles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consultar habitaciones disponibles
         * @description Consulta las habitaciones disponibles para una sede, rango de fechas y número de huéspedes. Requiere autenticación.
         */
        get: {
            parameters: {
                query: {
                    /**
                     * @description ID de la sucursal (entero positivo)
                     * @example 1
                     */
                    sucursal_id: number;
                    /**
                     * @description Fecha de entrada (AAAA-MM-DD)
                     * @example 2026-12-01
                     */
                    fecha_entrada: string;
                    /**
                     * @description Fecha de salida posterior a la entrada (AAAA-MM-DD)
                     * @example 2026-12-05
                     */
                    fecha_salida: string;
                    /**
                     * @description Número de huéspedes (entero positivo)
                     * @example 2
                     */
                    numero_huespedes: number;
                    /**
                     * @description Filtro opcional por tipo de habitación
                     * @example 1
                     */
                    tipo_habitacion_id?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Habitaciones disponibles obtenidas correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["DisponibilidadHabitacionesResponse"];
                    };
                };
                /** @description Parámetros inválidos o formato incorrecto */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado (AUTH_TOKEN_REQUIRED, INVALID_AUTH_FORMAT, INVALID_TOKEN, TOKEN_EXPIRED) */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Sucursal no encontrada (SUCURSAL_NOT_FOUND) */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Parámetros semánticamente inválidos (FECHAS_INVALIDAS, ROOM_RESERVATION_DATE_IN_PAST) */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/habitaciones/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener una habitación por ID */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description ID de la habitación */
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Habitación obtenida correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            message?: string;
                            data?: Record<string, never>;
                        };
                    };
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Habitación no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        /**
         * Eliminar una habitación
         * @description Elimina una habitación. Requiere un rol autorizado.
         */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description ID de la habitación */
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Habitación eliminada correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Habitación no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /**
         * Actualizar una habitación
         * @description Actualiza parcialmente una habitación. Requiere un rol autorizado.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description ID de la habitación */
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @example 1 */
                        sucursal_id?: number;
                        /** @example 1 */
                        tipo_habitacion_id?: number;
                        /** @example 101 */
                        numero?: string;
                        /**
                         * @example ocupada
                         * @enum {string}
                         */
                        estado?: "disponible" | "ocupada" | "mantenimiento" | "limpieza";
                    };
                };
            };
            responses: {
                /** @description Habitación actualizada correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            message?: string;
                            data?: Record<string, never>;
                        };
                    };
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Habitación, sucursal o tipo de habitación no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Ya existe una habitación con ese número en la sucursal */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/factura-items": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Listar items de factura */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Items de factura obtenidos correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /** Crear un item de factura */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        factura_id: number;
                        descripcion: string;
                        cantidad: number;
                        precio_unitario: number;
                    };
                };
            };
            responses: {
                /** @description Item de factura creado correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Factura no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/factura-items/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener un item de factura por ID */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Item de factura obtenido correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Item de factura no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        /** Eliminar un item de factura */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Item de factura eliminado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Item de factura no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /** Actualizar un item de factura */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        factura_id?: number;
                        descripcion?: string;
                        cantidad?: number;
                        precio_unitario?: number;
                    };
                };
            };
            responses: {
                /** @description Item de factura actualizado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Item o factura no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/facturas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Listar facturas */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Facturas obtenidas correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /** Crear una factura */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        usuario_id: number;
                        nit: string;
                        nombre_fiscal: string;
                        direccion_fiscal?: string | null;
                        subtotal: number;
                        /** @enum {string} */
                        estado?: "pendiente" | "pagada" | "anulada";
                        /** Format: date-time */
                        fecha_emision?: string;
                    };
                };
            };
            responses: {
                /** @description Factura creada correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/facturas/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener una factura por ID */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Factura obtenida correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Factura no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        /** Eliminar una factura */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Factura eliminada correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Factura no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description La factura tiene ítems asociados */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /** Actualizar una factura */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        usuario_id?: number;
                        nit?: string;
                        nombre_fiscal?: string;
                        direccion_fiscal?: string | null;
                        subtotal?: number;
                        estado?: string;
                        /** Format: date-time */
                        fecha_emision?: string | null;
                    };
                };
            };
            responses: {
                /** @description Factura actualizada correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Factura o usuario no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/servicios-evento": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar servicios de evento
         * @description Obtiene todos los servicios disponibles para eventos.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Servicios obtenidos correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            /** @example Servicios de evento obtenidos correctamente */
                            message?: string;
                            data?: components["schemas"]["ServicioEvento"][];
                        };
                    };
                };
                /** @description Error interno del servidor */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Crear un servicio de evento
         * @description Crea un nuevo servicio. Requiere rol administrador.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @example Catering premium */
                        nombre: string;
                        /** @example 750 */
                        precio: number;
                    };
                };
            };
            responses: {
                /** @description Servicio creado correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 201 */
                            statusCode?: number;
                            message?: string;
                            data?: components["schemas"]["ServicioEvento"];
                        };
                    };
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/servicios-evento/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener un servicio de evento por ID */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description ID del servicio de evento */
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Servicio obtenido correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            message?: string;
                            data?: components["schemas"]["ServicioEvento"];
                        };
                    };
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Servicio no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        /**
         * Eliminar un servicio de evento
         * @description Elimina un servicio si no está asociado a reservas existentes.
         */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Servicio eliminado correctamente */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Servicio no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description El servicio está siendo utilizado por una reserva */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /**
         * Actualizar un servicio de evento
         * @description Actualiza parcialmente un servicio. Requiere rol administrador.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @example Catering ejecutivo */
                        nombre?: string;
                        /** @example 850 */
                        precio?: number;
                    };
                };
            };
            responses: {
                /** @description Servicio actualizado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Servicio no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/salones": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar salones
         * @description Obtiene todos los salones registrados junto con información básica de su sucursal.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Salones obtenidos correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            /** @example Salones obtenidos correctamente */
                            message?: string;
                            data?: components["schemas"]["Salon"][];
                        };
                    };
                };
                /** @description Error interno del servidor */
                500: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Crear un salón
         * @description Crea un nuevo salón. Requiere rol administrador.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @example 1 */
                        sucursal_id: number;
                        /** @example Salón Imperial */
                        nombre: string;
                        /** @example 250 */
                        capacidad_maxima: number;
                        /** @example 3500 */
                        tarifa_base: number;
                        /** @example Salón principal para bodas y eventos ejecutivos */
                        descripcion?: string | null;
                    };
                };
            };
            responses: {
                /** @description Salón creado correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 201 */
                            statusCode?: number;
                            /** @example Salón creado correctamente */
                            message?: string;
                            data?: components["schemas"]["Salon"];
                        };
                    };
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description La sucursal indicada no existe */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description La sucursal se encuentra inactiva */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/salones/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener un salón por ID */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description ID del salón */
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Salón obtenido correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            /** @example Salón obtenido correctamente */
                            message?: string;
                            data?: components["schemas"]["Salon"];
                        };
                    };
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Salón no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        /**
         * Eliminar un salón
         * @description Elimina el salón únicamente si no posee reservas de eventos asociadas.
         */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Salón eliminado correctamente */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Salón no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description El salón tiene reservas asociadas y no puede eliminarse */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /**
         * Actualizar un salón
         * @description Actualiza parcialmente un salón. Requiere rol administrador.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @example 1 */
                        sucursal_id?: number;
                        /** @example Salón Imperial Renovado */
                        nombre?: string;
                        /** @example 300 */
                        capacidad_maxima?: number;
                        /** @example 4000 */
                        tarifa_base?: number;
                        descripcion?: string | null;
                    };
                };
            };
            responses: {
                /** @description Salón actualizado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos o ID inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Salón o sucursal no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description La sucursal indicada está inactiva */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        trace?: never;
    };
    "/api/reservas-evento/{reservaId}/servicios": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar servicios asociados a una reserva
         * @description Obtiene todos los servicios adicionales asociados a una reserva de evento. El propietario de la reserva y los administradores pueden acceder a esta información.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description ID de la reserva de evento */
                    reservaId: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Servicios obtenidos correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            /** @example Servicios de la reserva obtenidos correctamente */
                            message?: string;
                            data?: components["schemas"]["ReservaEventoServicio"][];
                        };
                    };
                };
                /** @description ID de reserva inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description El usuario no tiene acceso a la reserva */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Reserva no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Agregar un servicio a una reserva de evento
         * @description Agrega un servicio adicional a una reserva que se encuentre en estado de cotización. El subtotal, total de la reserva y anticipo son recalculados automáticamente por el backend.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description ID de la reserva de evento */
                    reservaId: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @example 1 */
                        servicio_evento_id: number;
                        /** @example 2 */
                        cantidad: number;
                    };
                };
            };
            responses: {
                /** @description Servicio agregado correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 201 */
                            statusCode?: number;
                            /** @example Servicio agregado a la reserva correctamente */
                            message?: string;
                            data?: {
                                item?: components["schemas"]["ReservaEventoServicio"];
                                reserva?: components["schemas"]["ReservaEventoMontos"];
                            };
                        };
                    };
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description El usuario no tiene acceso a la reserva */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Reserva o servicio de evento no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description La reserva no puede modificarse o el servicio ya se encuentra agregado. */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/reservas-evento/{reservaId}/servicios/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener un servicio asociado a una reserva */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description ID de la reserva de evento */
                    reservaId: number;
                    /** @description ID de la asociación del servicio */
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Servicio obtenido correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            /** @example Servicio de la reserva obtenido correctamente */
                            message?: string;
                            data?: components["schemas"]["ReservaEventoServicio"];
                        };
                    };
                };
                /** @description Parámetros inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description El usuario no tiene acceso a la reserva */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Reserva o servicio asociado no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        /**
         * Quitar un servicio de una reserva de evento
         * @description Elimina la asociación del servicio y recalcula automáticamente el total y el anticipo de la reserva. Solo se permite durante el estado de cotización.
         */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    reservaId: number;
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Servicio eliminado correctamente */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Parámetros inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description El usuario no tiene acceso a la reserva */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Reserva o servicio asociado no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description La reserva no puede modificarse */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        options?: never;
        head?: never;
        /**
         * Modificar la cantidad de un servicio
         * @description Modifica la cantidad del servicio asociado y recalcula automáticamente su subtotal, el total de la reserva y el anticipo. Solo puede realizarse mientras la reserva esté en cotización.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    reservaId: number;
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @example 3 */
                        cantidad: number;
                    };
                };
            };
            responses: {
                /** @description Servicio actualizado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            /** @example Servicio de la reserva actualizado correctamente */
                            message?: string;
                            data?: {
                                item?: components["schemas"]["ReservaEventoServicio"];
                                reserva?: components["schemas"]["ReservaEventoMontos"];
                            };
                        };
                    };
                };
                /** @description Datos o parámetros inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description El usuario no tiene acceso a la reserva */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Reserva o servicio asociado no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description La reserva ya no se encuentra en estado de cotización */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        trace?: never;
    };
    "/api/reservas-evento": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar reservas de eventos
         * @description Obtiene las reservas de eventos. Los administradores pueden consultar todas las reservas y los demás usuarios únicamente sus propias reservas.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Reservas obtenidas correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            /** @example Reservas de eventos obtenidas correctamente */
                            message?: string;
                            data?: components["schemas"]["ReservaEvento"][];
                        };
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario inactivo o sin autorización */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Crear una cotización de evento
         * @description Crea una reserva en estado de cotización. El backend determina automáticamente el usuario, el total, el anticipo y el estado. También valida capacidad, disponibilidad y traslapes de horario.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @example 1 */
                        salon_id: number;
                        /**
                         * @example boda
                         * @enum {string}
                         */
                        tipo_evento: "boda" | "cumpleanos" | "ejecutivo" | "convivio";
                        /**
                         * Format: date
                         * @example 2026-10-20
                         */
                        fecha: string;
                        /** @example 10:00 */
                        hora_inicio: string;
                        /** @example 14:00 */
                        hora_fin: string;
                        /** @example 150 */
                        numero_invitados: number;
                    };
                };
            };
            responses: {
                /** @description Cotización creada correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 201 */
                            statusCode?: number;
                            /** @example Cotización de evento creada correctamente */
                            message?: string;
                            data?: components["schemas"]["ReservaEvento"];
                        };
                    };
                };
                /** @description Datos con formato inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Salón o sucursal no encontrados */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description El salón no está disponible en el horario solicitado */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Regla de negocio incumplida, por ejemplo capacidad excedida, fecha pasada, horario inválido o sucursal inactiva. */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/reservas-evento/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Obtener una reserva de evento por ID
         * @description El administrador puede consultar cualquier reserva. Un cliente únicamente puede consultar sus propias reservas.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description ID de la reserva */
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Reserva obtenida correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            /** @example Reserva de evento obtenida correctamente */
                            message?: string;
                            data?: components["schemas"]["ReservaEvento"];
                        };
                    };
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description El usuario no tiene acceso a esta reserva */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Reserva no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Actualizar una cotización de evento
         * @description Permite modificar una reserva únicamente mientras esté en estado de cotización. Vuelve a validar capacidad, horario y disponibilidad.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @example 1 */
                        salon_id?: number;
                        /** @enum {string} */
                        tipo_evento?: "boda" | "cumpleanos" | "ejecutivo" | "convivio";
                        /**
                         * Format: date
                         * @example 2026-10-21
                         */
                        fecha?: string;
                        /** @example 11:00 */
                        hora_inicio?: string;
                        /** @example 15:00 */
                        hora_fin?: string;
                        /** @example 180 */
                        numero_invitados?: number;
                    };
                };
            };
            responses: {
                /** @description Reserva actualizada correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            message?: string;
                            data?: components["schemas"]["ReservaEvento"];
                        };
                    };
                };
                /** @description Datos o ID inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description El usuario no tiene acceso a esta reserva */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Reserva o salón no encontrados */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Reserva no editable o existe un traslape con otra reserva. */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Regla de negocio incumplida */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        trace?: never;
    };
    "/api/reservas-evento/{id}/cancelar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Cancelar una reserva de evento
         * @description Cambia el estado de la reserva a cancelada sin eliminar su información histórica.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Reserva cancelada correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example true */
                            success?: boolean;
                            /** @example 200 */
                            statusCode?: number;
                            /** @example Reserva de evento cancelada correctamente */
                            message?: string;
                            data?: components["schemas"]["ReservaEvento"];
                        };
                    };
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description El usuario no tiene acceso a esta reserva */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Reserva no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description La reserva ya está cancelada o expirada */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        trace?: never;
    };
    "/api/carritos/{carritoId}/items": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar los ítems de un carrito
         * @description Obtiene todos los ítems asociados a un carrito y calcula automáticamente el total. Los clientes únicamente pueden consultar sus propios carritos. Los administradores pueden consultar cualquier carrito.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description ID del carrito */
                    carritoId: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Ítems del carrito obtenidos correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CarritoItemsResponse"];
                    };
                };
                /** @description ID del carrito inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Token de autenticación requerido o inválido */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description El usuario no tiene permisos para consultar el carrito */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Carrito no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Agregar un ítem al carrito
         * @description Agrega una reserva o servicio al carrito activo del cliente. El precio, descripción, cantidad, usuario y carrito son determinados y validados por el backend. El frontend únicamente envía el tipo de ítem y la referencia correspondiente.
         *     Una misma referencia no puede agregarse dos veces al mismo carrito. La referencia debe existir, pertenecer al propietario del carrito y encontrarse disponible.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description ID del carrito activo */
                    carritoId: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    /**
                     * @example {
                     *       "tipo_item": "evento",
                     *       "referencia_id": 6
                     *     }
                     */
                    "application/json": components["schemas"]["CreateCarritoItemRequest"];
                };
            };
            responses: {
                /** @description Ítem agregado al carrito correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CarritoItemResponse"];
                    };
                };
                /** @description Datos o identificadores inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description El carrito o la referencia pertenecen a otro usuario, o el usuario no tiene permisos para modificar el carrito */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Carrito o referencia no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Carrito no activo, referencia no disponible o referencia ya agregada al carrito */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description No existe una tarifa configurada para la referencia o no fue posible determinar un precio válido */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/carritos/{carritoId}/items/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Obtener un ítem del carrito por ID
         * @description Obtiene un ítem específico de un carrito. El cliente únicamente puede consultar ítems de sus propios carritos, mientras que un administrador puede consultar cualquier carrito.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description ID del carrito */
                    carritoId: number;
                    /** @description ID del ítem */
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Ítem del carrito obtenido correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CarritoItemResponse"];
                    };
                };
                /** @description Alguno de los identificadores es inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description El carrito pertenece a otro usuario */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Carrito o ítem no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        /**
         * Eliminar un ítem del carrito
         * @description Elimina un ítem de un carrito activo. Solo el cliente propietario del carrito puede realizar esta operación. Un carrito expirado o pagado ya no puede modificarse.
         */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description ID del carrito */
                    carritoId: number;
                    /** @description ID del ítem a eliminar */
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Ítem eliminado correctamente */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Alguno de los identificadores es inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description El usuario no tiene permisos para modificar el carrito */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Carrito o ítem no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description El carrito ya no se encuentra activo */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/carritos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar carritos
         * @description Los clientes obtienen únicamente sus propios carritos. Los administradores pueden consultar todos los carritos registrados, incluyendo activos, expirados y pagados.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Carritos obtenidos correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CarritosResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario inactivo o sin autorización */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        /**
         * Crear un carrito
         * @description Crea un carrito activo para el cliente autenticado. El usuario, estado y fecha de expiración son establecidos automáticamente por el backend. Un usuario no puede tener más de un carrito activo simultáneamente.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Carrito creado correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CarritoResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Solo los usuarios con rol cliente pueden crear carritos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description El usuario ya posee un carrito activo */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/carritos/actual": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Obtener el carrito activo del usuario
         * @description Obtiene el carrito activo del usuario autenticado. Antes de responder, el sistema verifica automáticamente si el carrito ya alcanzó su fecha de expiración. Si está vencido, cambia su estado a expirado.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Carrito activo obtenido correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CarritoResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Usuario inactivo */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description El usuario no posee un carrito activo */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/carritos/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Obtener un carrito por ID
         * @description Un cliente únicamente puede consultar sus propios carritos. Los administradores pueden consultar cualquier carrito.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    /** @description ID del carrito */
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Carrito obtenido correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CarritoResponse"];
                    };
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ValidationErrorResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description El carrito pertenece a otro usuario */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
                /** @description Carrito no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ErrorResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/terapeutas": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar terapeutas
         * @description Endpoint público para consultar los terapeutas registrados.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Terapeutas obtenidos correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example success */
                            status?: string;
                            data?: components["schemas"]["Terapeuta"][];
                        };
                    };
                };
            };
        };
        put?: never;
        /** Crear un terapeuta */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["CreateTerapeutaRequest"];
                };
            };
            responses: {
                /** @description Terapeuta creado correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Solo administradores */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/terapeutas/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener un terapeuta por ID */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Terapeuta encontrado */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Terapeuta no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        /** Eliminar un terapeuta */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Terapeuta eliminado correctamente */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Solo administradores */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Terapeuta no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description El terapeuta tiene citas asociadas */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        options?: never;
        head?: never;
        /** Actualizar un terapeuta */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdateTerapeutaRequest"];
                };
            };
            responses: {
                /** @description Terapeuta actualizado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos o ID inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Solo administradores */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Terapeuta no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        trace?: never;
    };
    "/api/servicios-spa": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar servicios de bienestar
         * @description Endpoint público con duración y precio de cada servicio.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Servicios obtenidos correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example success */
                            status?: string;
                            data?: components["schemas"]["ServicioBienestar"][];
                        };
                    };
                };
            };
        };
        put?: never;
        /** Crear un servicio de bienestar */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["CreateServicioBienestarRequest"];
                };
            };
            responses: {
                /** @description Servicio creado correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Solo administradores */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/servicios-spa/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener un servicio de bienestar por ID */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Servicio encontrado */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Servicio no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        /** Eliminar un servicio de bienestar */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Servicio eliminado correctamente */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Solo administradores */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Servicio no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description El servicio tiene citas asociadas */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        options?: never;
        head?: never;
        /** Actualizar un servicio de bienestar */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdateServicioBienestarRequest"];
                };
            };
            responses: {
                /** @description Servicio actualizado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos o ID inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Solo administradores */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Servicio no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        trace?: never;
    };
    "/api/citas-spa": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Listar todas las citas de bienestar */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Citas obtenidas correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example success */
                            status?: string;
                            data?: components["schemas"]["CitaBienestar"][];
                        };
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Solo administradores */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        /**
         * Crear una cita de bienestar
         * @description Permite a un cliente reservar un servicio con un terapeuta. La duración se obtiene automáticamente del servicio y hora_fin es calculada por el backend. El terapeuta debe existir y estar activo. El sistema evita traslapes y exige un buffer de 15 minutos entre citas.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["CreateCitaBienestarRequest"];
                };
            };
            responses: {
                /** @description Cita creada correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Solo clientes pueden reservar */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Terapeuta o servicio no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Terapeuta ocupado o dentro de su tiempo de preparación */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description El terapeuta seleccionado está inactivo */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/citas-spa/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener una cita de bienestar por ID */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Cita encontrada */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Solo administradores */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Cita no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/citas-spa/{id}/estado": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Actualizar el estado de una cita de bienestar */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdateCitaBienestarEstadoRequest"];
                };
            };
            responses: {
                /** @description Estado actualizado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Estado o ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Solo administradores */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Cita no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        trace?: never;
    };
    "/api/reservas-amenidad": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar reservas de amenidad
         * @description Permite listar reservas de amenidad. Los administradores obtienen el listado global del hotel; los clientes obtienen exclusivamente sus propias reservas de amenidad.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Reservas obtenidas correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ReservasAmenidadResponse"];
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Rol no autorizado */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        /**
         * Crear una reserva de amenidad
         * @description Permite a un cliente autenticado reservar una amenidad para una fecha y franja horaria. El usuario se obtiene automáticamente del JWT. El backend controla el aforo concurrente de la amenidad, evita reservas superpuestas del mismo usuario y genera automáticamente un código QR único. Actualmente cada reserva representa el acceso de una persona.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["CreateReservaAmenidadRequest"];
                };
            };
            responses: {
                /** @description Reserva creada correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ReservaAmenidadResponse"];
                    };
                };
                /** @description Datos, fecha o franja horaria inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Solo los clientes pueden crear reservas de amenidad */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Amenidad no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description El aforo máximo sería excedido durante la franja solicitada o el usuario ya posee una reserva superpuesta para esa amenidad. */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description La fecha está en el pasado o, para una reserva del día actual, la franja horaria ya comenzó. */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/reservas-amenidad/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Obtener una reserva de amenidad por ID
         * @description Permite consultar el detalle de una reserva de amenidad. Los administradores pueden consultar cualquier reserva; los clientes solo pueden consultar las que les pertenecen (403 si pertenece a otro usuario).
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Reserva encontrada */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ReservaAmenidadResponse"];
                    };
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description No tiene permisos para acceder a esta reserva */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Reserva no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/reservas-amenidad/{id}/estado": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Cambiar el estado de una reserva de amenidad
         * @description Permite al administrador marcar una reserva confirmada como cancelada o usada. Los estados cancelada y usada son terminales, por lo que una reserva que alcance uno de ellos ya no puede modificarse nuevamente.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdateReservaAmenidadEstadoRequest"];
                };
            };
            responses: {
                /** @description Estado actualizado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ReservaAmenidadResponse"];
                    };
                };
                /** @description Estado o ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Solo los administradores pueden cambiar el estado */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Reserva no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description La reserva ya posee el estado solicitado o se encuentra en un estado final y ya no puede modificarse. */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        trace?: never;
    };
    "/api/amenidades": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar amenidades
         * @description Endpoint público para consultar las amenidades disponibles.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Amenidades obtenidas correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AmenidadesResponse"];
                    };
                };
            };
        };
        put?: never;
        /** Crear una amenidad */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["CreateAmenidadRequest"];
                };
            };
            responses: {
                /** @description Amenidad creada correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AmenidadResponse"];
                    };
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Solo administradores */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Sucursal no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/amenidades/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener una amenidad por ID */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Amenidad encontrada */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AmenidadResponse"];
                    };
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Amenidad no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        /** Eliminar una amenidad */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Amenidad eliminada correctamente */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Solo administradores */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Amenidad no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description La amenidad tiene reservas asociadas */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        options?: never;
        head?: never;
        /** Actualizar una amenidad */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdateAmenidadRequest"];
                };
            };
            responses: {
                /** @description Amenidad actualizada correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AmenidadResponse"];
                    };
                };
                /** @description Datos o ID inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Solo administradores */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Amenidad no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        trace?: never;
    };
    "/api/reservas-actividad": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar todas las reservas de actividad
         * @description Operación administrativa disponible únicamente para administradores.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Reservas obtenidas correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example success */
                            status?: string;
                            data?: components["schemas"]["ReservaActividad"][];
                        };
                    };
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos administrativos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        /**
         * Crear una reserva de actividad
         * @description Permite a un cliente autenticado reservar un recurso para una actividad. El usuario se obtiene automáticamente del JWT. La duración debe ser de entre 30 y 120 minutos. El sistema evita traslapes tanto del recurso como del instructor y, si se selecciona un instructor, verifica que exista y esté activo.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["CreateReservaActividadRequest"];
                };
            };
            responses: {
                /** @description Reserva creada correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos o rango horario incorrecto */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Solo los clientes pueden crear reservas de actividad */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Recurso o instructor no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description El recurso o el instructor ya se encuentra ocupado en el horario solicitado. */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description La fecha u hora solicitada está en el pasado, la duración no se encuentra entre 30 y 120 minutos o el instructor seleccionado está inactivo. */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/reservas-actividad/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Obtener una reserva de actividad por ID
         * @description Operación administrativa disponible únicamente para administradores.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Reserva encontrada */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos administrativos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Reserva no encontrada */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/reservas-actividad/{id}/estado": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Actualizar una reserva de actividad
         * @description Permite al administrador modificar el estado de la reserva y/o indicar si requiere equipo. Si una reserva cancelada o completada vuelve a estado confirmada, el backend verifica nuevamente fecha, horario, recurso, instructor y posibles traslapes.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdateReservaActividadRequest"];
                };
            };
            responses: {
                /** @description Reserva actualizada correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos o ID inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario sin permisos administrativos */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Reserva, recurso o instructor no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description No se puede reactivar la reserva porque el recurso o el instructor ya se encuentra ocupado en ese horario. */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description No se puede reactivar la reserva porque la fecha u hora ya pasó, la duración dejó de ser válida o el instructor se encuentra inactivo. */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        trace?: never;
    };
    "/api/recursos-actividad": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar recursos de actividad
         * @description Endpoint público para consultar los recursos disponibles.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Recursos obtenidos correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example success */
                            status?: string;
                            data?: components["schemas"]["RecursoActividad"][];
                        };
                    };
                };
            };
        };
        put?: never;
        /** Crear un recurso de actividad */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["CreateRecursoActividadRequest"];
                };
            };
            responses: {
                /** @description Recurso creado correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Solo administradores */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description La sucursal indicada no existe */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/recursos-actividad/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener un recurso de actividad */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Recurso encontrado */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Recurso no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        /** Eliminar un recurso de actividad */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Recurso eliminado correctamente */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Solo administradores */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Recurso no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description El recurso tiene reservas asociadas */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        options?: never;
        head?: never;
        /** Actualizar un recurso de actividad */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdateRecursoActividadRequest"];
                };
            };
            responses: {
                /** @description Recurso actualizado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos o ID inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Solo administradores */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Recurso no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        trace?: never;
    };
    "/api/instructores": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listar instructores
         * @description Endpoint público para consultar instructores.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Instructores obtenidos correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example success */
                            status?: string;
                            data?: components["schemas"]["Instructor"][];
                        };
                    };
                };
            };
        };
        put?: never;
        /** Crear un instructor */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["CreateInstructorRequest"];
                };
            };
            responses: {
                /** @description Instructor creado correctamente */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Solo administradores */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/instructores/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtener un instructor por ID */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Instructor encontrado */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Instructor no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        /** Eliminar un instructor */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Instructor eliminado correctamente */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description ID inválido */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Solo administradores */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Instructor no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description El instructor tiene reservas asociadas */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        options?: never;
        head?: never;
        /** Actualizar un instructor */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["UpdateInstructorRequest"];
                };
            };
            responses: {
                /** @description Instructor actualizado correctamente */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Datos o ID inválidos */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Usuario no autenticado */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Solo administradores */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description Instructor no encontrado */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        trace?: never;
    };
    "/api/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Verifica el estado del servidor
         * @description Retorna 200 OK si el servidor está en funcionamiento.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Servidor funcionando */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        /**
                         * @example {
                         *       "success": true,
                         *       "statusCode": 200,
                         *       "message": "API de Hotel está funcionando correctamente"
                         *     }
                         */
                        "application/json": unknown;
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        RegisterRequest: {
            /** @example Juan Pérez */
            nombre: string;
            /**
             * Format: email
             * @example juan.perez@ejemplo.com
             */
            email: string;
            /**
             * Format: password
             * @example Password123!
             */
            password: string;
            /** @example 55551234 */
            telefono?: string | null;
        };
        LoginRequest: {
            /**
             * Format: email
             * @example juan.perez@ejemplo.com
             */
            email: string;
            /**
             * Format: password
             * @example Password123!
             */
            password: string;
        };
        AuthUser: {
            /** @example 1 */
            id: number;
            /** @example Juan Pérez */
            nombre: string;
            /**
             * Format: email
             * @example juan.perez@ejemplo.com
             */
            email: string;
            /** @example 55551234 */
            telefono: string | null;
            /**
             * @example cliente
             * @enum {string}
             */
            rol: "admin" | "recepcionista" | "gerente_restaurante" | "gerente_habitaciones" | "empleado_operativo" | "cliente";
        };
        AuthUserWithStatus: {
            /** @example 1 */
            id: number;
            /** @example Juan Pérez */
            nombre: string;
            /**
             * Format: email
             * @example juan.perez@ejemplo.com
             */
            email: string;
            /** @example 55551234 */
            telefono: string | null;
            /**
             * @example cliente
             * @enum {string}
             */
            rol: "admin" | "recepcionista" | "gerente_restaurante" | "gerente_habitaciones" | "empleado_operativo" | "cliente";
            /** @example true */
            activo: boolean;
        };
        LoginData: {
            /** @example eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... */
            accessToken: string;
            usuario: components["schemas"]["AuthUser"];
        };
        LoginResponse: {
            /** @example true */
            success: boolean;
            /** @example 200 */
            statusCode: number;
            /** @example Inicio de sesión exitoso */
            message?: string;
            data: components["schemas"]["LoginData"];
        };
        RegisterResponse: {
            /** @example true */
            success: boolean;
            /** @example 201 */
            statusCode: number;
            /** @example Usuario registrado correctamente */
            message?: string;
            data: components["schemas"]["AuthUserWithStatus"];
        };
        AuthMeResponse: {
            /** @example true */
            success: boolean;
            /** @example 200 */
            statusCode: number;
            /** @example Usuario autenticado */
            message?: string;
            data: components["schemas"]["AuthUserWithStatus"];
        };
        ServicioEvento: {
            /** @example 1 */
            id?: number;
            /** @example Catering premium */
            nombre?: string;
            /** @example 750 */
            precio?: number;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
        };
        Salon: {
            /** @example 1 */
            id?: number;
            /** @example 1 */
            sucursal_id?: number;
            /** @example Salón Imperial */
            nombre?: string;
            /** @example 250 */
            capacidad_maxima?: number;
            /** @example 3500 */
            tarifa_base?: number;
            /** @example Salón principal para bodas y eventos ejecutivos */
            descripcion?: string | null;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
        };
        Usuario: {
            /** @example 2 */
            id?: number;
            /** @example Ana López */
            nombre?: string;
            /**
             * Format: email
             * @example ana@hotel.com
             */
            email?: string;
            /** @example recepcionista */
            rol?: string;
            /** @example 55554444 */
            telefono?: string | null;
            /** @example true */
            activo?: boolean;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
        };
        ReservaEvento: {
            /** @example 1 */
            id?: number;
            /** @example 2 */
            usuario_id?: number;
            /** @example 1 */
            salon_id?: number;
            /**
             * @example boda
             * @enum {string}
             */
            tipo_evento?: "boda" | "cumpleanos" | "ejecutivo" | "convivio";
            /**
             * Format: date
             * @example 2026-10-20
             */
            fecha?: string;
            /** @example 10:00:00 */
            hora_inicio?: string;
            /** @example 14:00:00 */
            hora_fin?: string;
            /** @example 150 */
            numero_invitados?: number;
            /**
             * @example cotizacion
             * @enum {string}
             */
            estado?: "cotizacion" | "confirmada" | "expirada" | "cancelada";
            /**
             * Format: decimal
             * @example 1050
             */
            anticipo?: number;
            /**
             * Format: decimal
             * @example 3500
             */
            total?: number;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
        };
        ReservaEventoServicio: {
            /** @example 1 */
            id?: number;
            /** @example 5 */
            reserva_evento_id?: number;
            /** @example 1 */
            servicio_evento_id?: number;
            /** @example 2 */
            cantidad?: number;
            /**
             * Format: decimal
             * @example 1500
             */
            subtotal?: number;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
        };
        ReservaEventoMontos: {
            /**
             * Format: decimal
             * @example 5000
             */
            total?: number;
            /**
             * Format: decimal
             * @example 1500
             */
            anticipo?: number;
        };
        Empleado: {
            /** @example 1 */
            id?: number;
            /** @example 3 */
            usuario_id?: number;
            /** @example 1 */
            sucursal_id?: number;
            /** @example Mantenimiento */
            area?: string;
            /**
             * Format: date
             * @example 2026-09-01
             */
            fecha_contratacion?: string | null;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
        };
        Turno: {
            /** @example 1 */
            id?: number;
            /** @example 1 */
            empleado_id?: number;
            /**
             * Format: date
             * @example 2026-10-10
             */
            fecha?: string;
            /** @example 08:00:00 */
            hora_inicio?: string;
            /** @example 16:00:00 */
            hora_fin?: string;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
        };
        Chofer: {
            /** @example 1 */
            id?: number;
            /** @example Luis Pérez */
            nombre?: string;
            /** @example A-123456 */
            licencia?: string | null;
            /** @example true */
            activo?: boolean;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
        };
        Vehiculo: {
            /** @example 1 */
            id?: number;
            /**
             * @example van
             * @enum {string}
             */
            tipo?: "shuttle" | "van" | "sedan";
            /** @example 12 */
            capacidad?: number;
            /** @example P-123ABC */
            placa?: string | null;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
        };
        ReservaTransporte: {
            /** @example 1 */
            id?: number;
            /** @example 2 */
            usuario_id?: number;
            /** @example 1 */
            chofer_id?: number | null;
            /** @example 2 */
            vehiculo_id?: number | null;
            /** @example Aeropuerto La Aurora */
            origen?: string;
            /** @example Hotel Central */
            destino?: string;
            /**
             * Format: date-time
             * @example 2026-10-20T08:00:00-06:00
             */
            fecha_hora?: string;
            /** @example 3 */
            numero_pasajeros?: number;
            /**
             * @example confirmada
             * @enum {string}
             */
            estado?: "pendiente" | "confirmada" | "cancelada";
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
        };
        Carrito: {
            /** @example 1 */
            id: number;
            /** @example 2 */
            usuario_id: number;
            /**
             * @example activo
             * @enum {string}
             */
            estado: "activo" | "expirado" | "pagado";
            /**
             * Format: date-time
             * @example 2026-10-15T18:00:00.000Z
             */
            expira_en: string | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        CarritoItem: {
            /** @example 1 */
            id: number;
            /** @example 5 */
            carrito_id: number;
            /**
             * @example evento
             * @enum {string}
             */
            tipo_item: "habitacion" | "evento" | "mesa" | "actividad" | "amenidad" | "bienestar" | "boleto_parque" | "transporte";
            /** @example 6 */
            referencia_id: number;
            /** @example Evento ejecutivo - 2026-09-30 */
            descripcion: string | null;
            /** @description Precio unitario del ítem */
            precio: string | number;
            /** @example 1 */
            cantidad: number;
            /** @example null */
            promocion_id: number | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        CreateCarritoItemRequest: {
            /**
             * @example evento
             * @enum {string}
             */
            tipo_item: "habitacion" | "evento" | "mesa" | "actividad" | "amenidad" | "bienestar" | "boleto_parque" | "transporte";
            /** @example 6 */
            referencia_id: number;
        };
        CarritoItemsData: {
            items: components["schemas"]["CarritoItem"][];
            /**
             * Format: double
             * @description Monto total del carrito calculado por el servidor como número decimal
             * @example 4000
             */
            total: number;
        };
        CarritoResponse: {
            /** @example true */
            success: boolean;
            /** @example 200 */
            statusCode: number;
            /** @example Carrito activo obtenido correctamente */
            message: string;
            data: components["schemas"]["Carrito"];
        };
        CarritosResponse: {
            /** @example true */
            success: boolean;
            /** @example 200 */
            statusCode: number;
            /** @example Carritos obtenidos correctamente */
            message: string;
            data: components["schemas"]["Carrito"][];
        };
        CarritoItemsResponse: {
            /** @example true */
            success: boolean;
            /** @example 200 */
            statusCode: number;
            /** @example Ítems del carrito obtenidos correctamente */
            message: string;
            data: components["schemas"]["CarritoItemsData"];
        };
        CarritoItemResponse: {
            /** @example true */
            success: boolean;
            /** @example 200 */
            statusCode: number;
            /** @example Ítem del carrito obtenido correctamente */
            message: string;
            data: components["schemas"]["CarritoItem"];
        };
        Sucursal: {
            /** @example 1 */
            id: number;
            /** @example Hotel Central */
            nombre: string;
            /** @example Zona 10 */
            direccion?: string | null;
            /** @example Guatemala */
            ciudad?: string | null;
            /** @example 22223333 */
            telefono?: string | null;
            /** @example true */
            activa: boolean;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        CreateSucursalRequest: {
            /** @example Hotel Central */
            nombre: string;
            /** @example Zona 10 */
            direccion?: string | null;
            /** @example Guatemala */
            ciudad?: string | null;
            /** @example 22223333 */
            telefono?: string | null;
        };
        UpdateSucursalRequest: {
            /** @example Hotel Central Renovado */
            nombre?: string;
            /** @example Zona 10 */
            direccion?: string | null;
            /** @example Guatemala */
            ciudad?: string | null;
            /** @example 22224444 */
            telefono?: string | null;
            /** @example true */
            activa?: boolean;
        };
        SucursalResponse: {
            /** @example success */
            status: string;
            data: components["schemas"]["Sucursal"];
        };
        SucursalesResponse: {
            /** @example success */
            status: string;
            data: components["schemas"]["Sucursal"][];
        };
        Parqueo: {
            /** @example 1 */
            id: number;
            /** @example 1 */
            sucursal_id: number;
            /** @example A-01 */
            numero: string;
            /**
             * @example disponible
             * @enum {string}
             */
            estado: "disponible" | "ocupado" | "mantenimiento";
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            Sucursal?: {
                /** @example 1 */
                id?: number;
                /** @example Hotel Central */
                nombre?: string;
            } | null;
        };
        CreateParqueoRequest: {
            /** @example 1 */
            sucursal_id: number;
            /** @example A-01 */
            numero: string;
            /**
             * @example disponible
             * @enum {string}
             */
            estado?: "disponible" | "ocupado" | "mantenimiento";
        };
        UpdateParqueoRequest: {
            /** @example 1 */
            sucursal_id?: number;
            /** @example A-01 */
            numero?: string;
            /**
             * @example disponible
             * @enum {string}
             */
            estado?: "disponible" | "ocupado" | "mantenimiento";
        };
        ParqueoResponse: {
            /** @example true */
            success: boolean;
            /** @example 200 */
            statusCode: number;
            /** @example Parqueo obtenido correctamente */
            message: string;
            data: components["schemas"]["Parqueo"];
        };
        ParqueosResponse: {
            /** @example true */
            success: boolean;
            /** @example 200 */
            statusCode: number;
            /** @example Parqueos obtenidos correctamente */
            message: string;
            data: components["schemas"]["Parqueo"][];
        };
        ParqueoDeleteResponse: {
            /** @example true */
            success: boolean;
            /** @example 200 */
            statusCode: number;
            /** @example Parqueo eliminado correctamente */
            message: string;
            /** @example null */
            data: unknown;
        };
        Mesa: {
            /** @example 1 */
            id?: number;
            /** @example 1 */
            sucursal_id?: number;
            /** @example terraza */
            zona?: string;
            /** @example 4 */
            capacidad?: number;
            /** @example disponible */
            estado?: string;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
            Sucursal?: {
                /** @example Hotel Central */
                nombre?: string;
            } | null;
        };
        CreateMesaRequest: {
            /** @example 1 */
            sucursal_id: number;
            /** @example terraza */
            zona: string;
            /** @example 4 */
            capacidad: number;
            /** @example disponible */
            estado?: string;
        };
        UpdateMesaRequest: {
            /** @example interior */
            zona?: string;
            /** @example 6 */
            capacidad?: number;
            /** @example disponible */
            estado?: string;
        };
        MesaResponse: {
            /** @example success */
            status?: string;
            data?: components["schemas"]["Mesa"];
        };
        MesasResponse: {
            /** @example success */
            status?: string;
            data?: components["schemas"]["Mesa"][];
        };
        ReservaMesa: {
            /** @example 1 */
            id?: number;
            /** @example 3 */
            usuario_id?: number;
            /** @example 1 */
            mesa_id?: number;
            /**
             * Format: date
             * @example 2026-10-10
             */
            fecha?: string;
            /** @example 19:00:00 */
            hora?: string;
            /** @example 4 */
            numero_comensales?: number;
            /**
             * @example confirmada
             * @enum {string}
             */
            estado?: "confirmada" | "cancelada";
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
        };
        CreateReservaMesaRequest: {
            /** @example 1 */
            mesa_id: number;
            /**
             * Format: date
             * @example 2026-10-10
             */
            fecha: string;
            /** @example 19:00 */
            hora: string;
            /** @example 4 */
            numero_comensales: number;
        };
        UpdateReservaMesaEstadoRequest: {
            /**
             * @example cancelada
             * @enum {string}
             */
            estado: "confirmada" | "cancelada";
        };
        RecursoActividad: {
            /** @example 1 */
            id?: number;
            /** @example 1 */
            sucursal_id?: number;
            /** @example tenis */
            tipo?: string;
            /** @example Cancha de tenis 1 */
            nombre?: string;
            /** @example 50 */
            precio_hora?: number;
            /** @example 10 */
            precio_equipo?: number;
            /** @example 25 */
            precio_instructor_hora?: number;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
        };
        CreateRecursoActividadRequest: {
            /** @example 1 */
            sucursal_id: number;
            /** @example tenis */
            tipo: string;
            /** @example Cancha de tenis 1 */
            nombre: string;
            /** @example 50 */
            precio_hora?: number;
            /** @example 10 */
            precio_equipo?: number;
            /** @example 25 */
            precio_instructor_hora?: number;
        };
        UpdateRecursoActividadRequest: {
            /** @example pádel */
            tipo?: string;
            /** @example Cancha de pádel 1 */
            nombre?: string;
            /** @example 50 */
            precio_hora?: number;
            /** @example 10 */
            precio_equipo?: number;
            /** @example 25 */
            precio_instructor_hora?: number;
        };
        Instructor: {
            /** @example 1 */
            id?: number;
            /** @example Carlos Méndez */
            nombre?: string;
            /** @example Tenis */
            especialidad?: string | null;
            /** @example true */
            activo?: boolean;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
        };
        CreateInstructorRequest: {
            /** @example Carlos Méndez */
            nombre: string;
            /** @example Tenis */
            especialidad?: string | null;
            /** @example true */
            activo?: boolean;
        };
        UpdateInstructorRequest: {
            /** @example Carlos Méndez */
            nombre?: string;
            /** @example Tenis y pádel */
            especialidad?: string | null;
            /** @example false */
            activo?: boolean;
        };
        ReservaActividad: {
            /** @example 1 */
            id?: number;
            /** @example 3 */
            usuario_id?: number;
            /** @example 1 */
            recurso_id?: number;
            /** @example 1 */
            instructor_id?: number | null;
            /**
             * Format: date
             * @example 2026-10-20
             */
            fecha?: string;
            /** @example 10:00:00 */
            hora_inicio?: string;
            /** @example 11:00:00 */
            hora_fin?: string;
            /** @example true */
            con_equipo?: boolean;
            /**
             * @example confirmada
             * @enum {string}
             */
            estado?: "confirmada" | "cancelada" | "completada";
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
        };
        CreateReservaActividadRequest: {
            /** @example 1 */
            recurso_id: number;
            /** @example 1 */
            instructor_id?: number | null;
            /**
             * Format: date
             * @example 2026-10-20
             */
            fecha: string;
            /** @example 10:00 */
            hora_inicio: string;
            /** @example 11:00 */
            hora_fin: string;
            /** @example true */
            con_equipo?: boolean;
        };
        UpdateReservaActividadRequest: {
            /**
             * @example cancelada
             * @enum {string}
             */
            estado?: "confirmada" | "cancelada" | "completada";
            /** @example false */
            con_equipo?: boolean;
        };
        Amenidad: {
            /** @example 1 */
            id: number;
            /** @example 1 */
            sucursal_id: number;
            /** @example Piscina */
            nombre: string;
            /** @example 20 */
            aforo_maximo: number;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            Sucursal?: {
                /** @example 1 */
                id?: number;
                /** @example Hotel Hunapú Central */
                nombre?: string;
            } | null;
        };
        AmenidadResponse: {
            /** @example success */
            status: string;
            data: components["schemas"]["Amenidad"];
        };
        AmenidadesResponse: {
            /** @example success */
            status: string;
            data: components["schemas"]["Amenidad"][];
        };
        CreateAmenidadRequest: {
            /** @example 1 */
            sucursal_id: number;
            /** @example Piscina */
            nombre: string;
            /** @example 20 */
            aforo_maximo: number;
        };
        UpdateAmenidadRequest: {
            /** @example Piscina principal */
            nombre?: string;
            /** @example 30 */
            aforo_maximo?: number;
        };
        ReservaAmenidad: {
            /** @example 1 */
            id: number;
            /** @example 3 */
            usuario_id: number;
            /** @example 1 */
            amenidad_id: number;
            /**
             * Format: date
             * @example 2026-10-20
             */
            fecha: string;
            /** @example 10:00-12:00 */
            franja_horaria: string;
            /** @example camastro */
            mobiliario?: string | null;
            /** @example AMENITY-550e8400-e29b-41d4-a716-446655440000 */
            codigo_qr?: string | null;
            /**
             * @example confirmada
             * @enum {string}
             */
            estado: "confirmada" | "cancelada" | "usada";
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            Amenidad?: {
                /** @example 1 */
                id?: number;
                /** @example Piscina */
                nombre?: string;
                /** @example 20 */
                aforo_maximo?: number;
                /** @example 1 */
                sucursal_id?: number;
                Sucursal?: {
                    /** @example 1 */
                    id?: number;
                    /** @example Hotel Hunapú Central */
                    nombre?: string;
                } | null;
            } | null;
            Usuario?: {
                /** @example 3 */
                id?: number;
                /** @example Juan Pérez */
                nombre?: string;
                /** @example juan@example.com */
                email?: string;
                /** @example 55551234 */
                telefono?: string | null;
            } | null;
        };
        ReservaAmenidadResponse: {
            /** @example true */
            success: boolean;
            /** @example 200 */
            statusCode: number;
            /** @example Reserva de amenidad obtenida correctamente */
            message: string;
            data: components["schemas"]["ReservaAmenidad"];
        };
        ReservasAmenidadResponse: {
            /** @example true */
            success: boolean;
            /** @example 200 */
            statusCode: number;
            /** @example Reservas de amenidad obtenidas correctamente */
            message: string;
            data: components["schemas"]["ReservaAmenidad"][];
        };
        CreateReservaAmenidadRequest: {
            /** @example 1 */
            amenidad_id: number;
            /**
             * Format: date
             * @example 2026-10-20
             */
            fecha: string;
            /** @example 10:00-12:00 */
            franja_horaria: string;
            /** @example camastro */
            mobiliario?: string | null;
        };
        UpdateReservaAmenidadEstadoRequest: {
            /**
             * @example cancelada
             * @enum {string}
             */
            estado: "cancelada" | "usada";
        };
        Terapeuta: {
            /** @example 1 */
            id?: number;
            /** @example Ana López */
            nombre?: string;
            /** @example true */
            activo?: boolean;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
        };
        CreateTerapeutaRequest: {
            /** @example Ana López */
            nombre: string;
            /** @example true */
            activo?: boolean;
        };
        UpdateTerapeutaRequest: {
            /** @example Ana López */
            nombre?: string;
            /** @example false */
            activo?: boolean;
        };
        ServicioBienestar: {
            /** @example 1 */
            id?: number;
            /** @example Masaje relajante */
            nombre?: string;
            /** @example 60 */
            duracion_minutos?: number;
            /**
             * Format: double
             * @example 350
             */
            precio?: number;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
        };
        CreateServicioBienestarRequest: {
            /** @example Masaje relajante */
            nombre: string;
            /** @example 60 */
            duracion_minutos: number;
            /** @example 350 */
            precio: number;
        };
        UpdateServicioBienestarRequest: {
            /** @example Masaje terapéutico */
            nombre?: string;
            /** @example 90 */
            duracion_minutos?: number;
            /** @example 450 */
            precio?: number;
        };
        CitaBienestar: {
            /** @example 1 */
            id?: number;
            /** @example 3 */
            usuario_id?: number;
            /** @example 1 */
            servicio_bienestar_id?: number;
            /** @example 1 */
            terapeuta_id?: number | null;
            /**
             * Format: date
             * @example 2026-10-20
             */
            fecha?: string;
            /** @example 10:00:00 */
            hora_inicio?: string;
            /** @example 11:00:00 */
            hora_fin?: string;
            /**
             * @example confirmada
             * @enum {string}
             */
            estado?: "confirmada" | "cancelada" | "completada";
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
        };
        CreateCitaBienestarRequest: {
            /** @example 1 */
            terapeuta_id: number;
            /** @example 1 */
            servicio_bienestar_id: number;
            /**
             * Format: date
             * @example 2026-10-20
             */
            fecha: string;
            /** @example 10:00 */
            hora_inicio: string;
        };
        UpdateCitaBienestarEstadoRequest: {
            /**
             * @example cancelada
             * @enum {string}
             */
            estado: "confirmada" | "cancelada" | "completada";
        };
        BoletoParque: {
            /** @example 1 */
            id?: number;
            /** @example 3 */
            usuario_id?: number;
            /**
             * Format: date
             * @example 2026-10-25
             */
            fecha_visita?: string;
            /**
             * @example adulto
             * @enum {string}
             */
            tipo_boleto?: "adulto" | "nino" | "familiar";
            /**
             * Format: double
             * @description Precio determinado automáticamente por el backend según el tipo de boleto.
             * @example 150
             */
            precio?: number;
            /** @example PARK-550e8400-e29b-41d4-a716-446655440000 */
            codigo_qr?: string | null;
            /**
             * @example valido
             * @enum {string}
             */
            estado?: "valido" | "usado" | "cancelado";
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
        };
        CreateBoletoParqueRequest: {
            /**
             * @example adulto
             * @enum {string}
             */
            tipo_boleto: "adulto" | "nino" | "familiar";
            /**
             * Format: date
             * @example 2026-10-25
             */
            fecha_visita: string;
        };
        UpdateBoletoParqueEstadoRequest: {
            /**
             * @example usado
             * @enum {string}
             */
            estado: "valido" | "usado" | "cancelado";
        };
        ReservaHabitacionUsuario: {
            /** @example 1 */
            id: number;
            /** @example Juan Pérez */
            nombre: string;
            /**
             * Format: email
             * @example juan.perez@ejemplo.com
             */
            email: string;
            /** @example cliente */
            rol: string;
            /** @example 55551234 */
            telefono?: string | null;
            /** @example true */
            activo?: boolean;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
        };
        ReservaHabitacionTipo: {
            /** @example 1 */
            id: number;
            /** @example Suite Presidencial */
            nombre: string;
            /** @example 4 */
            capacidad_maxima: number;
            /**
             * @description Tarifa por noche en formato decimal con dos dígitos
             * @example 450.00
             */
            tarifa_noche: string;
            /** @example Habitación espaciosa con vista panorámica */
            descripcion?: string | null;
        };
        ReservaHabitacionSucursal: {
            /** @example 1 */
            id: number;
            /** @example Hotel Central Guatemala */
            nombre: string;
            /** @example true */
            activa?: boolean;
        };
        ReservaHabitacionHabitacion: {
            /** @example 10 */
            id: number;
            /** @example 1 */
            sucursal_id: number;
            /** @example 1 */
            tipo_habitacion_id: number;
            /** @example 101 */
            numero: string;
            /**
             * @example disponible
             * @enum {string}
             */
            estado: "disponible" | "ocupada" | "mantenimiento" | "limpieza";
            TipoHabitacion?: components["schemas"]["ReservaHabitacionTipo"];
            Sucursal?: components["schemas"]["ReservaHabitacionSucursal"];
        };
        ReservaHabitacion: {
            /** @example 1 */
            id: number;
            /** @example 3 */
            usuario_id: number;
            /** @example 10 */
            habitacion_id: number;
            /**
             * Format: date
             * @example 2026-12-01
             */
            fecha_entrada: string;
            /**
             * Format: date
             * @example 2026-12-05
             */
            fecha_salida: string;
            /** @example 2 */
            numero_huespedes: number;
            /**
             * @example pendiente
             * @enum {string}
             */
            estado: "pendiente" | "confirmada" | "cancelada" | "finalizada" | "expirada";
            /**
             * @description Monto total calculado por el servidor con formato decimal
             * @example 1800.00
             */
            total: string;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            Usuario?: components["schemas"]["ReservaHabitacionUsuario"];
            Habitacion?: components["schemas"]["ReservaHabitacionHabitacion"];
        };
        CreateReservaHabitacionRequest: {
            /**
             * @description Opcional para clientes (asignado desde JWT); obligatorio para roles administrativos
             * @example 1
             */
            usuario_id?: number;
            /** @example 10 */
            habitacion_id: number;
            /**
             * Format: date
             * @example 2026-12-01
             */
            fecha_entrada: string;
            /**
             * Format: date
             * @example 2026-12-05
             */
            fecha_salida: string;
            /** @example 2 */
            numero_huespedes: number;
        };
        HabitacionDisponible: {
            /** @example 10 */
            id: number;
            /** @example 101 */
            numero: string;
            /** @example disponible */
            estado: string;
            /** @example 1 */
            sucursal_id: number;
            /** @example 1 */
            tipo_habitacion_id: number;
            /** @example 4 */
            noches: number;
            /**
             * @description Tarifa por noche en formato decimal con dos dígitos
             * @example 450.00
             */
            tarifa_noche: string;
            /**
             * @description Monto total estimado para la estancia con dos decimales
             * @example 1800.00
             */
            total_estimado: string;
            Sucursal?: components["schemas"]["ReservaHabitacionSucursal"];
            TipoHabitacion?: components["schemas"]["ReservaHabitacionTipo"];
        };
        ReservaHabitacionResponse: {
            /** @example true */
            success: boolean;
            /** @example 200 */
            statusCode: number;
            /** @example Reserva de habitación obtenida correctamente */
            message: string;
            data: components["schemas"]["ReservaHabitacion"];
        };
        ReservaHabitacionCreatedResponse: {
            /** @example true */
            success: boolean;
            /** @example 201 */
            statusCode: number;
            /** @example Reserva de habitación creada correctamente */
            message: string;
            data: components["schemas"]["ReservaHabitacion"];
        };
        ReservasHabitacionResponse: {
            /** @example true */
            success: boolean;
            /** @example 200 */
            statusCode: number;
            /** @example Reservas de habitación obtenidas correctamente */
            message: string;
            data: components["schemas"]["ReservaHabitacion"][];
        };
        DisponibilidadHabitacionesResponse: {
            /** @example true */
            success: boolean;
            /** @example 200 */
            statusCode: number;
            /** @example Habitaciones disponibles obtenidas correctamente */
            message: string;
            data: components["schemas"]["HabitacionDisponible"][];
        };
        Pago: {
            /** @example 42 */
            id: number;
            /** @example null */
            reserva_habitacion_id?: number | null;
            /** @example 15 */
            carrito_id?: number | null;
            monto: string | number;
            /**
             * @example tarjeta
             * @enum {string}
             */
            metodo: "tarjeta" | "efectivo" | "transferencia";
            /**
             * @example procesando
             * @enum {string}
             */
            estado: "pendiente" | "procesando" | "aprobado" | "rechazado" | "cancelado" | "reembolsado" | "reembolsado_parcial";
            /** @example pi_123456789 */
            id_transaccion_externo?: string | null;
            /** @example GTQ */
            moneda: string;
            /**
             * @example total
             * @enum {string}
             */
            tipo_pago: "total" | "anticipo" | "saldo";
            /** @example stripe */
            pasarela?: string | null;
            /** @example chk-u1-c15-xyz */
            idempotency_key?: string | null;
            /**
             * Format: date-time
             * @example 2026-10-22T14:30:00.000Z
             */
            fecha_pago?: string | null;
            /** @example null */
            codigo_error_externo?: string | null;
            /** @example null */
            mensaje_error?: string | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        CreatePagoRequest: {
            carrito_id?: number | null;
            reserva_habitacion_id?: number | null;
            /** @example 1800 */
            monto: number | string;
            /**
             * @example tarjeta
             * @enum {string}
             */
            metodo: "tarjeta" | "efectivo" | "transferencia";
            /**
             * @example total
             * @enum {string}
             */
            tipo_pago?: "total" | "anticipo" | "saldo";
            /**
             * @example GTQ
             * @enum {string}
             */
            moneda: "GTQ";
            /** @example chk-u1-c15-xyz */
            idempotency_key?: string | null;
        };
        CreatePagoResponse: {
            /** @example true */
            success: boolean;
            /** @example 201 */
            statusCode: number;
            /** @example Pago creado correctamente */
            message: string;
            data: {
                /** @example 42 */
                pago_id: number;
                /** @example pi_123456789 */
                payment_intent_id?: string;
                /** @example pi_123_secret_abc */
                client_secret?: string;
                /** @example procesando */
                estado: string;
                /** @example 1800 */
                monto: number | string;
                /** @example GTQ */
                moneda: string;
            } | components["schemas"]["Pago"];
        };
        ResumenPagoData: {
            /** @example 1800 */
            total: number;
            /** @example 1800 */
            anticipo_requerido: number;
            /** @example 0 */
            aprobado: number;
            /** @example 1800 */
            saldo: number;
        };
        ResumenPagoResponse: {
            /** @example true */
            success: boolean;
            /** @example 200 */
            statusCode: number;
            /** @example Resumen de pago obtenido correctamente */
            message: string;
            data: components["schemas"]["ResumenPagoData"];
        };
        IntentoActivoData: {
            /** @example 42 */
            pago_id: number;
            /** @example pi_123456789 */
            payment_intent_id: string | null;
            /** @example pi_123_secret_abc */
            client_secret: string | null;
            /**
             * @example procesando
             * @enum {string}
             */
            estado_local: "pendiente" | "procesando" | "aprobado" | "rechazado" | "cancelado" | "reembolsado" | "reembolsado_parcial";
            /** @example requires_payment_method */
            estado_pasarela: string;
            /**
             * @example requiere_confirmacion
             * @enum {string}
             */
            estado_intento: "requiere_confirmacion" | "procesando" | "completado_en_pasarela" | "cancelado";
            /** @example 1800 */
            monto: number;
            /** @example GTQ */
            moneda: string;
            /** @example true */
            puede_confirmar: boolean;
        };
        IntentoActivoPagoResponse: {
            /** @example true */
            success: boolean;
            /** @example 200 */
            statusCode: number;
            /** @example Intento de pago activo obtenido correctamente */
            message: string;
            data: components["schemas"]["IntentoActivoData"] | null;
        };
        PagoResponse: {
            /** @example true */
            success: boolean;
            /** @example 200 */
            statusCode: number;
            /** @example Pago obtenido correctamente */
            message: string;
            data: components["schemas"]["Pago"];
        };
        PagosResponse: {
            /** @example true */
            success: boolean;
            /** @example 200 */
            statusCode: number;
            /** @example Pagos obtenidos correctamente */
            message: string;
            data: components["schemas"]["Pago"][];
        };
        ErrorResponse: {
            /** @example false */
            success?: boolean;
            /** @example 404 */
            statusCode?: number;
            /** @example RESOURCE_NOT_FOUND */
            code?: string;
            /** @example El recurso solicitado no existe */
            message?: string;
        };
        ValidationErrorResponse: {
            /** @example false */
            success?: boolean;
            /** @example 400 */
            statusCode?: number;
            /** @example VALIDATION_ERROR */
            code?: string;
            /** @example Los datos enviados no tienen el formato esperado */
            message?: string;
            details?: {
                /** @example tarifa_base */
                field?: string;
                /** @example Debe ser un número válido */
                message?: string;
            }[];
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
