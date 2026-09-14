import { Role } from "../constants/roles";

declare global{
    namespace Express{
        interface Request{
            user?:{
                id:number,
                rol: Role;
            };
        }
    }
}

export {};