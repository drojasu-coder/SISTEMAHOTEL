# Arbol de dependencias afectadas

```text
express@5.2.1
├── proxy-addr@2.0.8
└── qs@6.16.0

sequelize@6.37.8
├── moment@2.31.0
└── uuid@8.3.2 (pendiente)

ts-node-dev@2.0.0
└── chokidar@3.6.0
    └── braces@3.0.3 (pendiente, desarrollo)

sequelize-cli@6.6.5
└── js-beautify -> brace-expansion@2.1.7
```

`npm ls` confirmo que no existe una dependencia directa del proyecto para los
paquetes transitivos auditados.
