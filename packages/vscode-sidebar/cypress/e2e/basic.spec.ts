context('Basic', async () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('basic nav', () => {
    cy.url()
      .should('eq', 'http://localhost:3333/')

    cy.contains('[Home Layout]')
      .should('exist')

    cy.get('#input')
      .type('Vitesse{Enter}')
      .get('#root')
      .invoke('attr', 'data-route')
      .then((route) => {
        expect(route).to.eq('/hi/Vitesse')
      })
    cy.get('[data-test-id="about"]')
      .should('exist')

    cy.contains('[Default Layout]')
      .should('exist')

    cy.get('[btn]')
      .click()
      .get('#root')
      .invoke('attr', 'data-route')
      .then((route) => {
        expect(route).to.eq('/')
      })
  })

  it('markdown', () => {
    cy.get('[data-test-id="about"]')
      .click()
      .get('#root')
      .invoke('attr', 'data-route')
      .then((route) => {
        expect(route).to.eq('/about')
      })

    cy.get('.shiki')
      .should('exist')
  })
})
