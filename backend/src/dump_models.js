const fs = require('fs');
const db = require('./models/index.js');
let out = '';

for (const modelName in db) {
  if (modelName === 'sequelize' || modelName === 'Sequelize') continue;
  const model = db[modelName];
  const attributes = model.rawAttributes;
  const tableName = model.tableName;

  out += `Table ${tableName} {\n`;
  for (const attrName in attributes) {
    const attr = attributes[attrName];
    const type = attr.type.key || attr.type.constructor.name;
    let typeStr = type.toLowerCase();
    
    // Attempt to extract specific type length/info if present
    if (attr.type.options && attr.type.options.length) {
      typeStr += `(${attr.type.options.length})`;
    } else if (attr.type._length) {
      typeStr += `(${attr.type._length})`;
    } else if (type === 'DECIMAL') {
        if (attr.type.options && attr.type.options.precision) {
             typeStr += `(${attr.type.options.precision},${attr.type.options.scale || 0})`;
        } else if (attr.type._precision) {
             typeStr += `(${attr.type._precision},${attr.type._scale || 0})`;
        }
    } else if (type === 'ENUM') {
        typeStr = 'enum';
    }

    if (typeStr.startsWith('string')) {
      typeStr = typeStr.replace('string', 'varchar');
    } else if (typeStr === 'dateonly') {
      typeStr = 'date';
    } else if (typeStr === 'date') {
      typeStr = 'timestamp';
    }

    let notes = [];
    if (attr.primaryKey) notes.push('pk');
    if (attr.autoIncrement) notes.push('increment');
    if (attr.unique) notes.push('unique');
    if (attr.allowNull === false) notes.push('not null');
    if (attr.defaultValue !== undefined && typeof attr.defaultValue !== 'object' && typeof attr.defaultValue !== 'function') {
      let def = attr.defaultValue;
      if (typeof def === 'string') def = `'${def}'`;
      notes.push(`default: ${def}`);
    } else if (attr.defaultValue !== undefined && attr.defaultValue.constructor && attr.defaultValue.constructor.name === 'NOW') {
        notes.push('default: `now()`');
    }

    let notesStr = notes.length > 0 ? ` [${notes.join(', ')}]` : '';
    out += `  ${attrName} ${typeStr}${notesStr}\n`;
  }
  out += `}\n\n`;
}

let relOut = '';
let seen = new Set();
for (const modelName in db) {
  if (modelName === 'sequelize' || modelName === 'Sequelize') continue;
  const model = db[modelName];
  const tableName = model.tableName;
  
  for (const assocName in model.associations) {
    const assoc = model.associations[assocName];
    if (assoc.associationType === 'BelongsTo') {
      const sourceTable = tableName;
      const targetTable = assoc.target.tableName;
      const foreignKey = assoc.foreignKey;
      const targetKey = assoc.targetKey || 'id';
      
      const sig = `${sourceTable}.${foreignKey} > ${targetTable}.${targetKey}`;
      if (!seen.has(sig)) {
          relOut += `Ref: ${sourceTable}.${foreignKey} > ${targetTable}.${targetKey}\n`;
          seen.add(sig);
      }
    } else if (assoc.associationType === 'HasMany' || assoc.associationType === 'HasOne') {
      const sourceTable = tableName;
      const targetTable = assoc.target.tableName;
      const foreignKey = assoc.foreignKey;
      const sourceKey = assoc.sourceKey || 'id';
      
      const sig = `${targetTable}.${foreignKey} > ${sourceTable}.${sourceKey}`;
      if (!seen.has(sig)) {
          relOut += `Ref: ${targetTable}.${foreignKey} > ${sourceTable}.${sourceKey}\n`;
          seen.add(sig);
      }
    }
  }
}

out += relOut;
fs.writeFileSync('dbml.txt', out);
