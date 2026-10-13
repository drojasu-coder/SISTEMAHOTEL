--
-- PostgreSQL database dump
--

\restrict FKfwDH4yNihPkn0N2BS0z1gVKFPLNSoMobUJsbn2l9kTfmalNFjdYwkxx37ni4g

-- Dumped from database version 16.15 (Debian 16.15-1.pgdg13+2)
-- Dumped by pg_dump version 16.15 (Debian 16.15-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


--
-- Name: amenidades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.amenidades (
    id integer NOT NULL,
    sucursal_id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    aforo_maximo integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: amenidades_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.amenidades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: amenidades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.amenidades_id_seq OWNED BY public.amenidades.id;


--
-- Name: boletos_parque; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.boletos_parque (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    fecha_visita date NOT NULL,
    tipo_boleto character varying(20) NOT NULL,
    precio numeric(10,2) NOT NULL,
    codigo_qr character varying(150),
    estado character varying(20) DEFAULT 'valido'::character varying NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: boletos_parque_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.boletos_parque_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: boletos_parque_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.boletos_parque_id_seq OWNED BY public.boletos_parque.id;


--
-- Name: carrito_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carrito_items (
    id integer NOT NULL,
    carrito_id integer NOT NULL,
    tipo_item character varying(30) NOT NULL,
    referencia_id integer NOT NULL,
    descripcion character varying(255),
    precio numeric(10,2) NOT NULL,
    cantidad integer DEFAULT 1 NOT NULL,
    promocion_id integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: carrito_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.carrito_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: carrito_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.carrito_items_id_seq OWNED BY public.carrito_items.id;


--
-- Name: carritos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carritos (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    estado character varying(20) DEFAULT 'activo'::character varying NOT NULL,
    expira_en timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: carritos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.carritos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: carritos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.carritos_id_seq OWNED BY public.carritos.id;


--
-- Name: choferes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.choferes (
    id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    licencia character varying(50),
    activo boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: choferes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.choferes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: choferes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.choferes_id_seq OWNED BY public.choferes.id;


--
-- Name: citas_bienestar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.citas_bienestar (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    servicio_bienestar_id integer NOT NULL,
    terapeuta_id integer,
    fecha date NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    estado character varying(20) DEFAULT 'confirmada'::character varying NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: citas_bienestar_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.citas_bienestar_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: citas_bienestar_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.citas_bienestar_id_seq OWNED BY public.citas_bienestar.id;


--
-- Name: configuraciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configuraciones (
    id integer NOT NULL,
    porcentaje_iva numeric(5,2) DEFAULT 12 NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: configuraciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.configuraciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: configuraciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.configuraciones_id_seq OWNED BY public.configuraciones.id;


--
-- Name: cuentas_por_pagar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cuentas_por_pagar (
    id integer NOT NULL,
    proveedor_id integer NOT NULL,
    monto numeric(10,2) NOT NULL,
    fecha_vencimiento date NOT NULL,
    estado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    factura_referencia character varying(100),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: cuentas_por_pagar_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cuentas_por_pagar_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cuentas_por_pagar_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cuentas_por_pagar_id_seq OWNED BY public.cuentas_por_pagar.id;


--
-- Name: empleados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empleados (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    sucursal_id integer NOT NULL,
    area character varying(50) NOT NULL,
    fecha_contratacion date,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: empleados_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.empleados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: empleados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.empleados_id_seq OWNED BY public.empleados.id;


--
-- Name: factura_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.factura_items (
    id integer NOT NULL,
    factura_id integer NOT NULL,
    descripcion character varying(255) NOT NULL,
    cantidad integer DEFAULT 1 NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: factura_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.factura_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: factura_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.factura_items_id_seq OWNED BY public.factura_items.id;


--
-- Name: facturas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.facturas (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    nit character varying(20) NOT NULL,
    nombre_fiscal character varying(150) NOT NULL,
    direccion_fiscal character varying(255),
    subtotal numeric(10,2) NOT NULL,
    iva numeric(10,2) NOT NULL,
    total numeric(10,2) NOT NULL,
    estado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    fecha_emision timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    porcentaje_iva numeric(5,2) DEFAULT 12 NOT NULL
);


--
-- Name: facturas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.facturas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: facturas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.facturas_id_seq OWNED BY public.facturas.id;


--
-- Name: habitaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.habitaciones (
    id integer NOT NULL,
    sucursal_id integer NOT NULL,
    tipo_habitacion_id integer NOT NULL,
    numero character varying(10) NOT NULL,
    estado character varying(20) DEFAULT 'disponible'::character varying NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: habitaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.habitaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: habitaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.habitaciones_id_seq OWNED BY public.habitaciones.id;


--
-- Name: instructores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instructores (
    id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    especialidad character varying(50),
    activo boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: instructores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.instructores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: instructores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.instructores_id_seq OWNED BY public.instructores.id;


--
-- Name: mesas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mesas (
    id integer NOT NULL,
    sucursal_id integer NOT NULL,
    zona character varying(30) NOT NULL,
    capacidad integer NOT NULL,
    estado character varying(20) DEFAULT 'disponible'::character varying NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: mesas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mesas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mesas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mesas_id_seq OWNED BY public.mesas.id;


--
-- Name: pagos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pagos (
    id integer NOT NULL,
    reserva_habitacion_id integer,
    monto numeric(10,2) NOT NULL,
    metodo character varying(20) NOT NULL,
    estado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    id_transaccion_externo character varying(150),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    carrito_id integer,
    moneda character varying(3) DEFAULT 'GTQ'::character varying NOT NULL,
    tipo_pago character varying(20) DEFAULT 'total'::character varying NOT NULL,
    pasarela character varying(50),
    idempotency_key character varying(150),
    fecha_pago timestamp with time zone,
    codigo_error_externo character varying(100),
    mensaje_error character varying(255)
);


--
-- Name: pagos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pagos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pagos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pagos_id_seq OWNED BY public.pagos.id;


--
-- Name: parqueos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parqueos (
    id integer NOT NULL,
    sucursal_id integer NOT NULL,
    numero character varying(10) NOT NULL,
    estado character varying(20) DEFAULT 'disponible'::character varying NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: parqueos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.parqueos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: parqueos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.parqueos_id_seq OWNED BY public.parqueos.id;


--
-- Name: promociones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promociones (
    id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    tipo_descuento character varying(20) NOT NULL,
    valor_descuento numeric(10,2) NOT NULL,
    aplica_a character varying(50),
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    activa boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: promociones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.promociones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: promociones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.promociones_id_seq OWNED BY public.promociones.id;


--
-- Name: proveedor_productos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proveedor_productos (
    id integer NOT NULL,
    proveedor_id integer NOT NULL,
    nombre_producto character varying(150) NOT NULL,
    descripcion text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: proveedor_productos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.proveedor_productos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: proveedor_productos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.proveedor_productos_id_seq OWNED BY public.proveedor_productos.id;


--
-- Name: proveedores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proveedores (
    id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    nit character varying(20),
    contacto character varying(150),
    telefono character varying(20),
    email character varying(150),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: proveedores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.proveedores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: proveedores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.proveedores_id_seq OWNED BY public.proveedores.id;


--
-- Name: recursos_actividad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recursos_actividad (
    id integer NOT NULL,
    sucursal_id integer NOT NULL,
    tipo character varying(30) NOT NULL,
    nombre character varying(100) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: recursos_actividad_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recursos_actividad_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recursos_actividad_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recursos_actividad_id_seq OWNED BY public.recursos_actividad.id;


--
-- Name: reembolsos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reembolsos (
    id integer NOT NULL,
    pago_id integer NOT NULL,
    monto numeric(10,2) NOT NULL,
    moneda character varying(3) DEFAULT 'GTQ'::character varying NOT NULL,
    estado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    id_reembolso_externo character varying(150),
    motivo character varying(255),
    fecha_reembolso timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: reembolsos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reembolsos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reembolsos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reembolsos_id_seq OWNED BY public.reembolsos.id;


--
-- Name: reserva_evento_servicios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reserva_evento_servicios (
    id integer NOT NULL,
    reserva_evento_id integer NOT NULL,
    servicio_evento_id integer NOT NULL,
    cantidad integer DEFAULT 1 NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: reserva_evento_servicios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reserva_evento_servicios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reserva_evento_servicios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reserva_evento_servicios_id_seq OWNED BY public.reserva_evento_servicios.id;


--
-- Name: reservas_actividad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reservas_actividad (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    recurso_id integer NOT NULL,
    instructor_id integer,
    fecha date NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    con_equipo boolean DEFAULT false,
    estado character varying(20) DEFAULT 'confirmada'::character varying NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: reservas_actividad_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reservas_actividad_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reservas_actividad_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reservas_actividad_id_seq OWNED BY public.reservas_actividad.id;


--
-- Name: reservas_amenidad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reservas_amenidad (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    amenidad_id integer NOT NULL,
    fecha date NOT NULL,
    franja_horaria character varying(20) NOT NULL,
    mobiliario character varying(30),
    codigo_qr character varying(150),
    estado character varying(20) DEFAULT 'confirmada'::character varying NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: reservas_amenidad_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reservas_amenidad_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reservas_amenidad_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reservas_amenidad_id_seq OWNED BY public.reservas_amenidad.id;


--
-- Name: reservas_evento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reservas_evento (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    salon_id integer NOT NULL,
    tipo_evento character varying(50) NOT NULL,
    fecha date NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    numero_invitados integer NOT NULL,
    estado character varying(20) DEFAULT 'cotizacion'::character varying NOT NULL,
    anticipo numeric(10,2) NOT NULL,
    total numeric(10,2) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: reservas_evento_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reservas_evento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reservas_evento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reservas_evento_id_seq OWNED BY public.reservas_evento.id;


--
-- Name: reservas_habitacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reservas_habitacion (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    habitacion_id integer NOT NULL,
    fecha_entrada date NOT NULL,
    fecha_salida date NOT NULL,
    numero_huespedes integer NOT NULL,
    estado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    total numeric(10,2) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: reservas_habitacion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reservas_habitacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reservas_habitacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reservas_habitacion_id_seq OWNED BY public.reservas_habitacion.id;


--
-- Name: reservas_mesa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reservas_mesa (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    mesa_id integer NOT NULL,
    fecha date NOT NULL,
    hora time without time zone NOT NULL,
    numero_comensales integer NOT NULL,
    estado character varying(20) DEFAULT 'confirmada'::character varying NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: reservas_mesa_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reservas_mesa_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reservas_mesa_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reservas_mesa_id_seq OWNED BY public.reservas_mesa.id;


--
-- Name: reservas_parqueo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reservas_parqueo (
    id integer NOT NULL,
    reserva_habitacion_id integer,
    parqueo_id integer NOT NULL,
    fecha_entrada timestamp with time zone NOT NULL,
    fecha_salida timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: reservas_parqueo_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reservas_parqueo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reservas_parqueo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reservas_parqueo_id_seq OWNED BY public.reservas_parqueo.id;


--
-- Name: reservas_transporte; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reservas_transporte (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    chofer_id integer,
    vehiculo_id integer,
    origen character varying(150) NOT NULL,
    destino character varying(150) NOT NULL,
    fecha_hora timestamp with time zone NOT NULL,
    numero_pasajeros integer NOT NULL,
    estado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: reservas_transporte_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reservas_transporte_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reservas_transporte_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reservas_transporte_id_seq OWNED BY public.reservas_transporte.id;


--
-- Name: salones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salones (
    id integer NOT NULL,
    sucursal_id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    capacidad_maxima integer NOT NULL,
    tarifa_base numeric(10,2) NOT NULL,
    descripcion text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: salones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.salones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: salones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.salones_id_seq OWNED BY public.salones.id;


--
-- Name: servicios_bienestar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.servicios_bienestar (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    duracion_minutos integer NOT NULL,
    precio numeric(10,2) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: servicios_bienestar_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.servicios_bienestar_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: servicios_bienestar_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.servicios_bienestar_id_seq OWNED BY public.servicios_bienestar.id;


--
-- Name: servicios_evento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.servicios_evento (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    precio numeric(10,2) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: servicios_evento_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.servicios_evento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: servicios_evento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.servicios_evento_id_seq OWNED BY public.servicios_evento.id;


--
-- Name: sucursales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sucursales (
    id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    direccion character varying(255),
    ciudad character varying(100),
    telefono character varying(20),
    activa boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: sucursales_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sucursales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sucursales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sucursales_id_seq OWNED BY public.sucursales.id;


--
-- Name: terapeutas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.terapeutas (
    id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    activo boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: terapeutas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.terapeutas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: terapeutas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.terapeutas_id_seq OWNED BY public.terapeutas.id;


--
-- Name: tipos_habitacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipos_habitacion (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    capacidad_maxima integer NOT NULL,
    tarifa_noche numeric(10,2) NOT NULL,
    descripcion text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: tipos_habitacion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tipos_habitacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipos_habitacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tipos_habitacion_id_seq OWNED BY public.tipos_habitacion.id;


--
-- Name: turnos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.turnos (
    id integer NOT NULL,
    empleado_id integer NOT NULL,
    fecha date NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: turnos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.turnos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: turnos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.turnos_id_seq OWNED BY public.turnos.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash character varying(255) NOT NULL,
    rol character varying(30) NOT NULL,
    telefono character varying(20),
    activo boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: vehiculos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehiculos (
    id integer NOT NULL,
    tipo character varying(30) NOT NULL,
    capacidad integer NOT NULL,
    placa character varying(20),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: vehiculos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vehiculos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vehiculos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vehiculos_id_seq OWNED BY public.vehiculos.id;


--
-- Name: amenidades id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.amenidades ALTER COLUMN id SET DEFAULT nextval('public.amenidades_id_seq'::regclass);


--
-- Name: boletos_parque id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.boletos_parque ALTER COLUMN id SET DEFAULT nextval('public.boletos_parque_id_seq'::regclass);


--
-- Name: carrito_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carrito_items ALTER COLUMN id SET DEFAULT nextval('public.carrito_items_id_seq'::regclass);


--
-- Name: carritos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carritos ALTER COLUMN id SET DEFAULT nextval('public.carritos_id_seq'::regclass);


--
-- Name: choferes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.choferes ALTER COLUMN id SET DEFAULT nextval('public.choferes_id_seq'::regclass);


--
-- Name: citas_bienestar id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citas_bienestar ALTER COLUMN id SET DEFAULT nextval('public.citas_bienestar_id_seq'::regclass);


--
-- Name: configuraciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuraciones ALTER COLUMN id SET DEFAULT nextval('public.configuraciones_id_seq'::regclass);


--
-- Name: cuentas_por_pagar id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_por_pagar ALTER COLUMN id SET DEFAULT nextval('public.cuentas_por_pagar_id_seq'::regclass);


--
-- Name: empleados id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleados ALTER COLUMN id SET DEFAULT nextval('public.empleados_id_seq'::regclass);


--
-- Name: factura_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura_items ALTER COLUMN id SET DEFAULT nextval('public.factura_items_id_seq'::regclass);


--
-- Name: facturas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas ALTER COLUMN id SET DEFAULT nextval('public.facturas_id_seq'::regclass);


--
-- Name: habitaciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habitaciones ALTER COLUMN id SET DEFAULT nextval('public.habitaciones_id_seq'::regclass);


--
-- Name: instructores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructores ALTER COLUMN id SET DEFAULT nextval('public.instructores_id_seq'::regclass);


--
-- Name: mesas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mesas ALTER COLUMN id SET DEFAULT nextval('public.mesas_id_seq'::regclass);


--
-- Name: pagos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos ALTER COLUMN id SET DEFAULT nextval('public.pagos_id_seq'::regclass);


--
-- Name: parqueos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parqueos ALTER COLUMN id SET DEFAULT nextval('public.parqueos_id_seq'::regclass);


--
-- Name: promociones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promociones ALTER COLUMN id SET DEFAULT nextval('public.promociones_id_seq'::regclass);


--
-- Name: proveedor_productos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedor_productos ALTER COLUMN id SET DEFAULT nextval('public.proveedor_productos_id_seq'::regclass);


--
-- Name: proveedores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedores ALTER COLUMN id SET DEFAULT nextval('public.proveedores_id_seq'::regclass);


--
-- Name: recursos_actividad id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recursos_actividad ALTER COLUMN id SET DEFAULT nextval('public.recursos_actividad_id_seq'::regclass);


--
-- Name: reembolsos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reembolsos ALTER COLUMN id SET DEFAULT nextval('public.reembolsos_id_seq'::regclass);


--
-- Name: reserva_evento_servicios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserva_evento_servicios ALTER COLUMN id SET DEFAULT nextval('public.reserva_evento_servicios_id_seq'::regclass);


--
-- Name: reservas_actividad id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_actividad ALTER COLUMN id SET DEFAULT nextval('public.reservas_actividad_id_seq'::regclass);


--
-- Name: reservas_amenidad id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_amenidad ALTER COLUMN id SET DEFAULT nextval('public.reservas_amenidad_id_seq'::regclass);


--
-- Name: reservas_evento id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_evento ALTER COLUMN id SET DEFAULT nextval('public.reservas_evento_id_seq'::regclass);


--
-- Name: reservas_habitacion id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_habitacion ALTER COLUMN id SET DEFAULT nextval('public.reservas_habitacion_id_seq'::regclass);


--
-- Name: reservas_mesa id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_mesa ALTER COLUMN id SET DEFAULT nextval('public.reservas_mesa_id_seq'::regclass);


--
-- Name: reservas_parqueo id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_parqueo ALTER COLUMN id SET DEFAULT nextval('public.reservas_parqueo_id_seq'::regclass);


--
-- Name: reservas_transporte id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_transporte ALTER COLUMN id SET DEFAULT nextval('public.reservas_transporte_id_seq'::regclass);


--
-- Name: salones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salones ALTER COLUMN id SET DEFAULT nextval('public.salones_id_seq'::regclass);


--
-- Name: servicios_bienestar id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicios_bienestar ALTER COLUMN id SET DEFAULT nextval('public.servicios_bienestar_id_seq'::regclass);


--
-- Name: servicios_evento id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicios_evento ALTER COLUMN id SET DEFAULT nextval('public.servicios_evento_id_seq'::regclass);


--
-- Name: sucursales id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sucursales ALTER COLUMN id SET DEFAULT nextval('public.sucursales_id_seq'::regclass);


--
-- Name: terapeutas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.terapeutas ALTER COLUMN id SET DEFAULT nextval('public.terapeutas_id_seq'::regclass);


--
-- Name: tipos_habitacion id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_habitacion ALTER COLUMN id SET DEFAULT nextval('public.tipos_habitacion_id_seq'::regclass);


--
-- Name: turnos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.turnos ALTER COLUMN id SET DEFAULT nextval('public.turnos_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Name: vehiculos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehiculos ALTER COLUMN id SET DEFAULT nextval('public.vehiculos_id_seq'::regclass);


--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: amenidades amenidades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.amenidades
    ADD CONSTRAINT amenidades_pkey PRIMARY KEY (id);


--
-- Name: boletos_parque boletos_parque_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.boletos_parque
    ADD CONSTRAINT boletos_parque_pkey PRIMARY KEY (id);


--
-- Name: carrito_items carrito_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carrito_items
    ADD CONSTRAINT carrito_items_pkey PRIMARY KEY (id);


--
-- Name: carritos carritos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carritos
    ADD CONSTRAINT carritos_pkey PRIMARY KEY (id);


--
-- Name: choferes choferes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.choferes
    ADD CONSTRAINT choferes_pkey PRIMARY KEY (id);


--
-- Name: citas_bienestar citas_bienestar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citas_bienestar
    ADD CONSTRAINT citas_bienestar_pkey PRIMARY KEY (id);


--
-- Name: configuraciones configuraciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuraciones
    ADD CONSTRAINT configuraciones_pkey PRIMARY KEY (id);


--
-- Name: cuentas_por_pagar cuentas_por_pagar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_por_pagar
    ADD CONSTRAINT cuentas_por_pagar_pkey PRIMARY KEY (id);


--
-- Name: empleados empleados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleados
    ADD CONSTRAINT empleados_pkey PRIMARY KEY (id);


--
-- Name: empleados empleados_usuario_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleados
    ADD CONSTRAINT empleados_usuario_id_key UNIQUE (usuario_id);


--
-- Name: factura_items factura_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura_items
    ADD CONSTRAINT factura_items_pkey PRIMARY KEY (id);


--
-- Name: facturas facturas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT facturas_pkey PRIMARY KEY (id);


--
-- Name: habitaciones habitaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habitaciones
    ADD CONSTRAINT habitaciones_pkey PRIMARY KEY (id);


--
-- Name: instructores instructores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instructores
    ADD CONSTRAINT instructores_pkey PRIMARY KEY (id);


--
-- Name: mesas mesas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mesas
    ADD CONSTRAINT mesas_pkey PRIMARY KEY (id);


--
-- Name: pagos pagos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_pkey PRIMARY KEY (id);


--
-- Name: parqueos parqueos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parqueos
    ADD CONSTRAINT parqueos_pkey PRIMARY KEY (id);


--
-- Name: promociones promociones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promociones
    ADD CONSTRAINT promociones_pkey PRIMARY KEY (id);


--
-- Name: proveedor_productos proveedor_productos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedor_productos
    ADD CONSTRAINT proveedor_productos_pkey PRIMARY KEY (id);


--
-- Name: proveedores proveedores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT proveedores_pkey PRIMARY KEY (id);


--
-- Name: recursos_actividad recursos_actividad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recursos_actividad
    ADD CONSTRAINT recursos_actividad_pkey PRIMARY KEY (id);


--
-- Name: reembolsos reembolsos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reembolsos
    ADD CONSTRAINT reembolsos_pkey PRIMARY KEY (id);


--
-- Name: reserva_evento_servicios reserva_evento_servicios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserva_evento_servicios
    ADD CONSTRAINT reserva_evento_servicios_pkey PRIMARY KEY (id);


--
-- Name: reservas_actividad reservas_actividad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_actividad
    ADD CONSTRAINT reservas_actividad_pkey PRIMARY KEY (id);


--
-- Name: reservas_amenidad reservas_amenidad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_amenidad
    ADD CONSTRAINT reservas_amenidad_pkey PRIMARY KEY (id);


--
-- Name: reservas_evento reservas_evento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_evento
    ADD CONSTRAINT reservas_evento_pkey PRIMARY KEY (id);


--
-- Name: reservas_habitacion reservas_habitacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_habitacion
    ADD CONSTRAINT reservas_habitacion_pkey PRIMARY KEY (id);


--
-- Name: reservas_mesa reservas_mesa_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_mesa
    ADD CONSTRAINT reservas_mesa_pkey PRIMARY KEY (id);


--
-- Name: reservas_parqueo reservas_parqueo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_parqueo
    ADD CONSTRAINT reservas_parqueo_pkey PRIMARY KEY (id);


--
-- Name: reservas_transporte reservas_transporte_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_transporte
    ADD CONSTRAINT reservas_transporte_pkey PRIMARY KEY (id);


--
-- Name: salones salones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salones
    ADD CONSTRAINT salones_pkey PRIMARY KEY (id);


--
-- Name: servicios_bienestar servicios_bienestar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicios_bienestar
    ADD CONSTRAINT servicios_bienestar_pkey PRIMARY KEY (id);


--
-- Name: servicios_evento servicios_evento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicios_evento
    ADD CONSTRAINT servicios_evento_pkey PRIMARY KEY (id);


--
-- Name: sucursales sucursales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sucursales
    ADD CONSTRAINT sucursales_pkey PRIMARY KEY (id);


--
-- Name: terapeutas terapeutas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.terapeutas
    ADD CONSTRAINT terapeutas_pkey PRIMARY KEY (id);


--
-- Name: tipos_habitacion tipos_habitacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_habitacion
    ADD CONSTRAINT tipos_habitacion_pkey PRIMARY KEY (id);


--
-- Name: turnos turnos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.turnos
    ADD CONSTRAINT turnos_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: vehiculos vehiculos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehiculos
    ADD CONSTRAINT vehiculos_pkey PRIMARY KEY (id);


--
-- Name: habitaciones_sucursal_numero_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX habitaciones_sucursal_numero_unique ON public.habitaciones USING btree (sucursal_id, numero);


--
-- Name: pagos_carrito_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pagos_carrito_id_idx ON public.pagos USING btree (carrito_id);


--
-- Name: pagos_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pagos_estado_idx ON public.pagos USING btree (estado);


--
-- Name: pagos_idempotency_key_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX pagos_idempotency_key_unique_idx ON public.pagos USING btree (idempotency_key) WHERE (idempotency_key IS NOT NULL);


--
-- Name: pagos_reserva_habitacion_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pagos_reserva_habitacion_id_idx ON public.pagos USING btree (reserva_habitacion_id);


--
-- Name: reembolsos_id_reembolso_externo_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX reembolsos_id_reembolso_externo_unique_idx ON public.reembolsos USING btree (id_reembolso_externo);


--
-- Name: reembolsos_pago_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reembolsos_pago_id_idx ON public.reembolsos USING btree (pago_id);


--
-- Name: amenidades amenidades_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.amenidades
    ADD CONSTRAINT amenidades_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: boletos_parque boletos_parque_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.boletos_parque
    ADD CONSTRAINT boletos_parque_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: carrito_items carrito_items_carrito_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carrito_items
    ADD CONSTRAINT carrito_items_carrito_id_fkey FOREIGN KEY (carrito_id) REFERENCES public.carritos(id);


--
-- Name: carrito_items carrito_items_promocion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carrito_items
    ADD CONSTRAINT carrito_items_promocion_id_fkey FOREIGN KEY (promocion_id) REFERENCES public.promociones(id);


--
-- Name: carritos carritos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carritos
    ADD CONSTRAINT carritos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: citas_bienestar citas_bienestar_servicio_bienestar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citas_bienestar
    ADD CONSTRAINT citas_bienestar_servicio_bienestar_id_fkey FOREIGN KEY (servicio_bienestar_id) REFERENCES public.servicios_bienestar(id);


--
-- Name: citas_bienestar citas_bienestar_terapeuta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citas_bienestar
    ADD CONSTRAINT citas_bienestar_terapeuta_id_fkey FOREIGN KEY (terapeuta_id) REFERENCES public.terapeutas(id);


--
-- Name: citas_bienestar citas_bienestar_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citas_bienestar
    ADD CONSTRAINT citas_bienestar_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: cuentas_por_pagar cuentas_por_pagar_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuentas_por_pagar
    ADD CONSTRAINT cuentas_por_pagar_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id);


--
-- Name: empleados empleados_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleados
    ADD CONSTRAINT empleados_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: empleados empleados_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleados
    ADD CONSTRAINT empleados_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: factura_items factura_items_factura_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factura_items
    ADD CONSTRAINT factura_items_factura_id_fkey FOREIGN KEY (factura_id) REFERENCES public.facturas(id);


--
-- Name: facturas facturas_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT facturas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: habitaciones habitaciones_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habitaciones
    ADD CONSTRAINT habitaciones_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: habitaciones habitaciones_tipo_habitacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habitaciones
    ADD CONSTRAINT habitaciones_tipo_habitacion_id_fkey FOREIGN KEY (tipo_habitacion_id) REFERENCES public.tipos_habitacion(id);


--
-- Name: mesas mesas_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mesas
    ADD CONSTRAINT mesas_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: pagos pagos_carrito_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_carrito_id_fkey FOREIGN KEY (carrito_id) REFERENCES public.carritos(id);


--
-- Name: pagos pagos_reserva_habitacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_reserva_habitacion_id_fkey FOREIGN KEY (reserva_habitacion_id) REFERENCES public.reservas_habitacion(id);


--
-- Name: parqueos parqueos_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parqueos
    ADD CONSTRAINT parqueos_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: proveedor_productos proveedor_productos_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedor_productos
    ADD CONSTRAINT proveedor_productos_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id);


--
-- Name: recursos_actividad recursos_actividad_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recursos_actividad
    ADD CONSTRAINT recursos_actividad_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: reembolsos reembolsos_pago_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reembolsos
    ADD CONSTRAINT reembolsos_pago_id_fkey FOREIGN KEY (pago_id) REFERENCES public.pagos(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reserva_evento_servicios reserva_evento_servicios_reserva_evento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserva_evento_servicios
    ADD CONSTRAINT reserva_evento_servicios_reserva_evento_id_fkey FOREIGN KEY (reserva_evento_id) REFERENCES public.reservas_evento(id);


--
-- Name: reserva_evento_servicios reserva_evento_servicios_servicio_evento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserva_evento_servicios
    ADD CONSTRAINT reserva_evento_servicios_servicio_evento_id_fkey FOREIGN KEY (servicio_evento_id) REFERENCES public.servicios_evento(id);


--
-- Name: reservas_actividad reservas_actividad_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_actividad
    ADD CONSTRAINT reservas_actividad_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.instructores(id);


--
-- Name: reservas_actividad reservas_actividad_recurso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_actividad
    ADD CONSTRAINT reservas_actividad_recurso_id_fkey FOREIGN KEY (recurso_id) REFERENCES public.recursos_actividad(id);


--
-- Name: reservas_actividad reservas_actividad_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_actividad
    ADD CONSTRAINT reservas_actividad_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: reservas_amenidad reservas_amenidad_amenidad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_amenidad
    ADD CONSTRAINT reservas_amenidad_amenidad_id_fkey FOREIGN KEY (amenidad_id) REFERENCES public.amenidades(id);


--
-- Name: reservas_amenidad reservas_amenidad_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_amenidad
    ADD CONSTRAINT reservas_amenidad_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: reservas_evento reservas_evento_salon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_evento
    ADD CONSTRAINT reservas_evento_salon_id_fkey FOREIGN KEY (salon_id) REFERENCES public.salones(id);


--
-- Name: reservas_evento reservas_evento_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_evento
    ADD CONSTRAINT reservas_evento_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: reservas_habitacion reservas_habitacion_habitacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_habitacion
    ADD CONSTRAINT reservas_habitacion_habitacion_id_fkey FOREIGN KEY (habitacion_id) REFERENCES public.habitaciones(id);


--
-- Name: reservas_habitacion reservas_habitacion_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_habitacion
    ADD CONSTRAINT reservas_habitacion_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: reservas_mesa reservas_mesa_mesa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_mesa
    ADD CONSTRAINT reservas_mesa_mesa_id_fkey FOREIGN KEY (mesa_id) REFERENCES public.mesas(id);


--
-- Name: reservas_mesa reservas_mesa_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_mesa
    ADD CONSTRAINT reservas_mesa_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: reservas_parqueo reservas_parqueo_parqueo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_parqueo
    ADD CONSTRAINT reservas_parqueo_parqueo_id_fkey FOREIGN KEY (parqueo_id) REFERENCES public.parqueos(id);


--
-- Name: reservas_parqueo reservas_parqueo_reserva_habitacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_parqueo
    ADD CONSTRAINT reservas_parqueo_reserva_habitacion_id_fkey FOREIGN KEY (reserva_habitacion_id) REFERENCES public.reservas_habitacion(id);


--
-- Name: reservas_transporte reservas_transporte_chofer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_transporte
    ADD CONSTRAINT reservas_transporte_chofer_id_fkey FOREIGN KEY (chofer_id) REFERENCES public.choferes(id);


--
-- Name: reservas_transporte reservas_transporte_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_transporte
    ADD CONSTRAINT reservas_transporte_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: reservas_transporte reservas_transporte_vehiculo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservas_transporte
    ADD CONSTRAINT reservas_transporte_vehiculo_id_fkey FOREIGN KEY (vehiculo_id) REFERENCES public.vehiculos(id);


--
-- Name: salones salones_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salones
    ADD CONSTRAINT salones_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id);


--
-- Name: turnos turnos_empleado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.turnos
    ADD CONSTRAINT turnos_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id);


--
-- PostgreSQL database dump complete
--

\unrestrict FKfwDH4yNihPkn0N2BS0z1gVKFPLNSoMobUJsbn2l9kTfmalNFjdYwkxx37ni4g

