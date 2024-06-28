import ts from 'typescript';

/**
 * 获取给定 TypeScript 类型节点的默认值。
 * @param typeNode - TypeScript 类型节点
 * @returns 对应类型的默认值
 */
function getDefaultForTypeNode(typeNode: ts.TypeNode): any {
  switch (typeNode.kind) {
    case ts.SyntaxKind.StringKeyword:
      return '';
    case ts.SyntaxKind.NumberKeyword:
      return 0;
    case ts.SyntaxKind.BooleanKeyword:
      return false;
    case ts.SyntaxKind.LiteralType:
      // 处理文字类型，例如 "a" | "b" | "c"
      const literalTypeNode = typeNode as ts.LiteralTypeNode;
      if (ts.isLiteralTypeNode(literalTypeNode) && ts.isStringLiteral(literalTypeNode.literal)) {
        return literalTypeNode.literal.text;
      }
      return undefined; // 处理其他类型的文字类型
    case ts.SyntaxKind.ArrayType:
      return []; // 返回空数组
    case ts.SyntaxKind.TypeLiteral:
      const result: any = {};
      const members = (typeNode as ts.TypeLiteralNode).members;
      members.forEach(member => {
        if (ts.isPropertySignature(member) && member.type && !member.questionToken) {
          const propName = (member.name as ts.Identifier).text;
          result[propName] = getDefaultForTypeNode(member.type);
        }
      });
      return result;
    case ts.SyntaxKind.UnionType:
      // 处理联合类型，取第一个类型的默认值
      const unionType = typeNode as ts.UnionTypeNode;
      const firstType = unionType.types[0];
      return getDefaultForTypeNode(firstType);
    case ts.SyntaxKind.TupleType:
      // 处理元组类型
      const tupleType = typeNode as ts.TupleTypeNode;
      return tupleType.elements.map(element => getDefaultForTypeNode(element));
    case ts.SyntaxKind.IntersectionType:
      // 处理交叉类型
      const intersectionType = typeNode as ts.IntersectionTypeNode;
      const intersectionResult: any = {};
      intersectionType.types.forEach(type => {
        const typeDefaults = getDefaultForTypeNode(type);
        Object.assign(intersectionResult, typeDefaults);
      });
      return intersectionResult;
    case ts.SyntaxKind.TypeReference:
      const typeReferenceNode = typeNode as ts.TypeReferenceNode;
      if (typeReferenceNode.typeName.getText() === 'Array') {
        return []; // 处理数组类型引用
      } else {
        return {}; // 其他引用类型，返回空对象
      }
    default:
      return {};
  }
}

/**
 * 从给定的 TypeScript 源代码生成类型和接口的默认值对象。
 * @param sourceCode - TypeScript 源代码字符串
 * @returns 包含类型和接口默认值的对象
 */
export function generateDefaultValues(sourceCode: string): any {
  const sourceText = `interface AnonymousType { done: ${sourceCode} }`;
  const sourceFile = ts.createSourceFile('temp.ts', sourceText, ts.ScriptTarget.Latest, true);
  const result: any = {};

  /**
   * 遍历节点，查找接口声明并生成其默认值。
   * @param node - 当前遍历的节点
   */
  function visit(node: ts.Node) {
    if (ts.isInterfaceDeclaration(node)) {
      const typeName = node.name.text;
      const typeResult: any = {};
      node.members.forEach(member => {
        if (ts.isPropertySignature(member) && member.type && !member.questionToken) {
          const propName = (member.name as ts.Identifier).text;
          if (ts.isArrayTypeNode(member.type)) {
            const arrayElementType = member.type.elementType;
            if (arrayElementType) {
              if (ts.isTupleTypeNode(arrayElementType)) {
                typeResult[propName] = getDefaultForTypeNode(arrayElementType);
              } else if (ts.isTypeLiteralNode(arrayElementType)) {
                typeResult[propName] = [getDefaultForTypeNode(arrayElementType)];
              } else {
                typeResult[propName] = [getDefaultForTypeNode(arrayElementType)];
              }
            }
          } else {
            typeResult[propName] = getDefaultForTypeNode(member.type);
          }
        }
      });
      result[typeName] = typeResult;
    } else {
      ts.forEachChild(node, visit);
    }
  }

  visit(sourceFile);
  return valueToNonQuotedKeysJson(result['AnonymousType']['done']);
}

function objectToNonQuotedKeysJson(obj: any): string {
  const entries = Object.entries(obj);
  const keyValuePairs = entries.map(([key, value]) => ` ${key}: ${valueToNonQuotedKeysJson(value)}`);
  return `{${keyValuePairs.join(',')}}`;
}

function valueToNonQuotedKeysJson(value: any): string {
  if (Array.isArray(value)) {
    const elements = value.map(element => valueToNonQuotedKeysJson(element));
    return `[${elements.join(', ')}]`;
  } else if (typeof value === 'object' && value !== null) {
    return objectToNonQuotedKeysJson(value);
  } else {
    return JSON.stringify(value);
  }
}
