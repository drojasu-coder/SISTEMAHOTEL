import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import * as legacyConfiguracionController from "../../src/controllers/configuracion.controller";
import * as modularConfiguracionController from "../../src/modules/configuraciones/configuracion.controller";
import * as legacyConfiguracionService from "../../src/services/configuracion.service";
import * as modularConfiguracionService from "../../src/modules/configuraciones/configuracion.service";
import * as legacySucursalController from "../../src/controllers/sucursales/sucursal.controller";
import * as modularSucursalController from "../../src/modules/sucursales/sucursal.controller";
import * as legacySucursalService from "../../src/services/sucursales/sucursal.service";
import * as modularSucursalService from "../../src/modules/sucursales/sucursal.service";
import legacyConfiguracionRoutes from "../../src/routes/configuracion.routes";
import modularConfiguracionRoutes from "../../src/modules/configuraciones/configuracion.routes";
import legacySucursalRoutes from "../../src/routes/sucursales/sucursal.routes";
import modularSucursalRoutes from "../../src/modules/sucursales/sucursal.routes";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../src");

function collectTypeScriptFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    return entry.isDirectory()
      ? collectTypeScriptFiles(filePath)
      : entry.name.endsWith(".ts")
        ? [filePath]
        : [];
  });
}

function resolveRelativeImport(importer: string, specifier: string, files: Set<string>): string | undefined {
  const candidate = path.resolve(path.dirname(importer), specifier);
  if (files.has(`${candidate}.ts`)) return `${candidate}.ts`;
  if (files.has(path.join(candidate, "index.ts"))) return path.join(candidate, "index.ts");
  return undefined;
}

function findImportCycles(): string[][] {
  const files = collectTypeScriptFiles(sourceRoot);
  const fileSet = new Set(files);
  const graph = new Map<string, string[]>();
  const importPattern = /(?:from\s*|import\s*\(|require\s*\()(["'])([^"']+)\1/g;

  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    const dependencies: string[] = [];
    for (const match of source.matchAll(importPattern)) {
      const specifier = match[2];
      if (specifier.startsWith(".")) {
        const resolved = resolveRelativeImport(file, specifier, fileSet);
        if (resolved) dependencies.push(resolved);
      }
    }
    graph.set(file, dependencies);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const cycles: string[][] = [];

  function visit(file: string, stack: string[]): void {
    if (visiting.has(file)) {
      const cycleStart = stack.indexOf(file);
      cycles.push(stack.slice(cycleStart).concat(file));
      return;
    }
    if (visited.has(file)) return;

    visiting.add(file);
    for (const dependency of graph.get(file) ?? []) visit(dependency, [...stack, file]);
    visiting.delete(file);
    visited.add(file);
  }

  for (const file of files) visit(file, []);
  return cycles;
}

describe("modular architecture", () => {
  it("keeps legacy controller and service facades pointed at the single implementations", () => {
    expect(legacyConfiguracionController.getCurrentIva).toBe(modularConfiguracionController.getCurrentIva);
    expect(legacyConfiguracionController.updateIva).toBe(modularConfiguracionController.updateIva);
    expect(legacyConfiguracionService.getCurrentIva).toBe(modularConfiguracionService.getCurrentIva);
    expect(legacyConfiguracionService.updateIva).toBe(modularConfiguracionService.updateIva);
    expect(legacySucursalController.getAll).toBe(modularSucursalController.getAll);
    expect(legacySucursalController.update).toBe(modularSucursalController.update);
    expect(legacySucursalService.getAll).toBe(modularSucursalService.getAll);
    expect(legacySucursalService.remove).toBe(modularSucursalService.remove);
  });

  it("keeps route adapters compatible with the documented legacy routers", () => {
    expect(modularConfiguracionRoutes).toBe(legacyConfiguracionRoutes);
    expect(modularSucursalRoutes).toBe(legacySucursalRoutes);
  });

  it("does not introduce relative import cycles", () => {
    expect(findImportCycles()).toEqual([]);
  });
});
