import {z} from "zod";

export const moneySchema = z
.union([
    z.number(),
    z

    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 
        "Debe ser un número válido con máximo dos decimales."
    )
])

.transform((value) => Number(value))
.refine((value) => Number.isFinite(value),{
    message: "El monto debe ser un número válido"
})
.refine((value)=> value >= 0,{
    message: "El monto no puede ser negativo, debe ser mayor o igual a cero."
});