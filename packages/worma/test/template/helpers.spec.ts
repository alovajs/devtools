import handlebars from 'handlebars'
import { registerCommonHelpers } from '@/utils'

/**
 * Smoke render: create an isolated hbs instance, register all common helpers,
 * compile and render a template with the given data.
 */
function render(template: string, data: Record<string, unknown> = {}) {
  const hbs = handlebars.create()
  registerCommonHelpers(hbs)
  return hbs.compile(template)(data)
}

describe('predefined (global) helpers', () => {
  describe('isType', () => {
    it('should render fn branch when the runtime type matches', () => {
      expect(render('{{#isType value "string"}}yes{{else}}no{{/isType}}', { value: 'hi' })).toBe('yes')
      expect(render('{{#isType value "array"}}yes{{else}}no{{/isType}}', { value: [1, 2] })).toBe('yes')
      expect(render('{{#isType value "number"}}yes{{else}}no{{/isType}}', { value: 42 })).toBe('yes')
    })

    it('should render inverse branch when the runtime type does not match', () => {
      expect(render('{{#isType value "string"}}yes{{else}}no{{/isType}}', { value: 1 })).toBe('no')
    })
  })

  describe('and', () => {
    it('should render fn when all truthy', () => {
      expect(render('{{#and a b}}yes{{else}}no{{/and}}', { a: 1, b: 'x' })).toBe('yes')
    })

    it('should render inverse when any falsy', () => {
      expect(render('{{#and a b}}yes{{else}}no{{/and}}', { a: 1, b: 0 })).toBe('no')
    })

    it('should treat an empty array as truthy and a non-empty array as falsy', () => {
      expect(render('{{#and a b}}yes{{else}}no{{/and}}', { a: [], b: 1 })).toBe('yes')
      expect(render('{{#and a b}}yes{{else}}no{{/and}}', { a: [1], b: 1 })).toBe('no')
    })
  })

  describe('or', () => {
    it('should render fn when any truthy', () => {
      expect(render('{{#or a b}}yes{{else}}no{{/or}}', { a: false, b: 'x' })).toBe('yes')
    })

    it('should render inverse when all falsy', () => {
      expect(render('{{#or a b}}yes{{else}}no{{/or}}', { a: false, b: 0 })).toBe('no')
    })

    it('should treat a non-empty array as truthy and an empty array as falsy', () => {
      expect(render('{{#or a b}}yes{{else}}no{{/or}}', { a: false, b: [1] })).toBe('yes')
      expect(render('{{#or a b}}yes{{else}}no{{/or}}', { a: false, b: [] })).toBe('no')
    })
  })

  describe('eq', () => {
    it('should return true for strictly equal values', () => {
      expect(render('{{eq a b}}', { a: 1, b: 1 })).toBe('true')
      expect(render('{{eq a b}}', { a: 'x', b: 'x' })).toBe('true')
    })

    it('should return false for unequal values', () => {
      expect(render('{{eq a b}}', { a: 1, b: 2 })).toBe('false')
    })
  })

  describe('not', () => {
    it('should return true when values differ', () => {
      expect(render('{{not a b}}', { a: 1, b: 2 })).toBe('true')
    })

    it('should return false when values are strictly equal', () => {
      expect(render('{{not a b}}', { a: 1, b: 1 })).toBe('false')
    })
  })

  describe('join', () => {
    it('should concatenate all arguments', () => {
      expect(render('{{join "a" "b" "c"}}')).toBe('abc')
    })

    it('should join sub-expressions and data', () => {
      expect(render('{{join pre "::" post}}', { pre: 'x', post: 'y' })).toBe('x::y')
    })
  })

  describe('raw', () => {
    it('should return a SafeString that is not HTML-escaped', () => {
      expect(render('{{raw "<div>&"}}')).toBe('<div>&')
    })
  })

  describe('stripStarPrefix', () => {
    it('should strip a leading "* " from every line', () => {
      expect(render('{{stripStarPrefix text}}', { text: '* hello\n* world' })).toBe('hello\nworld')
    })

    it('should handle a single "*" without trailing space', () => {
      expect(render('{{stripStarPrefix text}}', { text: '*hello' })).toBe('hello')
    })

    it('should leave non-starred lines untouched', () => {
      expect(render('{{stripStarPrefix text}}', { text: 'plain' })).toBe('plain')
    })
  })

  describe('addNamespace', () => {
    const componentNames = ['Pet', 'Order', 'ApiResponse', 'User']

    it('should prefix component names with the default "ComponentTypes" namespace', () => {
      expect(render('{{addNamespace typeStr componentNames}}', { typeStr: 'Pet', componentNames })).toBe('ComponentTypes.Pet')
      expect(render('{{addNamespace typeStr componentNames}}', { typeStr: 'Pet[]', componentNames })).toBe('ComponentTypes.Pet[]')
      expect(render('{{addNamespace typeStr componentNames}}', { typeStr: 'ListResponse<Pet>', componentNames })).toBe('ListResponse<ComponentTypes.Pet>')
    })

    it('should not prefix identifiers that are not in componentNames', () => {
      expect(render('{{addNamespace typeStr componentNames}}', { typeStr: 'string', componentNames })).toBe('string')
      expect(render('{{addNamespace typeStr componentNames}}', { typeStr: 'number[]', componentNames })).toBe('number[]')
      expect(render('{{addNamespace typeStr componentNames}}', { typeStr: 'Record<string, Pet>', componentNames })).toBe('Record<string, ComponentTypes.Pet>')
    })

    it('should not double-prefix an already-prefixed identifier (default namespace)', () => {
      expect(render('{{addNamespace typeStr componentNames}}', { typeStr: 'ComponentTypes.Pet', componentNames })).toBe('ComponentTypes.Pet')
    })

    it('should support a custom import name as the second parameter', () => {
      expect(render('{{addNamespace typeStr componentNames importName}}', { typeStr: 'Pet', componentNames, importName: 'MyTypes' })).toBe('MyTypes.Pet')
      expect(render('{{addNamespace typeStr componentNames importName}}', { typeStr: 'Pet[]', componentNames, importName: 'MyTypes' })).toBe('MyTypes.Pet[]')
      expect(render('{{addNamespace typeStr componentNames importName}}', { typeStr: 'ListResponse<Pet>', componentNames, importName: 'MyTypes' })).toBe('ListResponse<MyTypes.Pet>')
    })

    it('should not double-prefix an identifier already prefixed with the custom import name', () => {
      expect(render('{{addNamespace typeStr componentNames importName}}', { typeStr: 'MyTypes.Pet', componentNames, importName: 'MyTypes' })).toBe('MyTypes.Pet')
    })

    it('should handle generics with multiple component types', () => {
      expect(render('{{addNamespace typeStr componentNames}}', { typeStr: 'Page<Pet, Order>', componentNames })).toBe('Page<ComponentTypes.Pet, ComponentTypes.Order>')
      expect(render('{{addNamespace typeStr componentNames importName}}', { typeStr: 'Page<Pet, Order>', componentNames, importName: 'Types' })).toBe('Page<Types.Pet, Types.Order>')
    })

    it('should return the type string unchanged when componentNames is empty', () => {
      expect(render('{{addNamespace typeStr componentNames}}', { typeStr: 'Pet', componentNames: [] })).toBe('Pet')
    })

    it('should fall back to "unknown" for empty type strings', () => {
      expect(render('{{addNamespace typeStr componentNames}}', { typeStr: '', componentNames })).toBe('unknown')
    })
  })
})
