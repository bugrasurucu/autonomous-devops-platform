describe('Authentication', () => {
  it('should redirect to login if not authenticated', () => {
    cy.visit('/dashboard')
    cy.url().should('include', '/login')
  })

  it('should allow user to register and login', () => {
    cy.visit('/login')
    
    // Switch to register
    cy.contains('Register Free').click()
    
    // Intercept register request
    cy.intercept('POST', '/api/auth/register').as('registerReq')
    
    // Fill out registration form
    const randomEmail = `test_${Date.now()}@example.com`;
    cy.get('input[type="text"]').type('Test User')
    cy.get('input[type="email"]').type(randomEmail)
    cy.get('input[type="password"]').type('password123')
    cy.contains('Create Account').click()
    
    // Wait for the API to respond
    cy.wait('@registerReq').its('response.statusCode').should('eq', 201)
    
    // Should redirect to dashboard
    cy.url().should('include', '/dashboard', { timeout: 10000 })
    
    // Should see user name or logo
    cy.contains('ORBITRON').should('be.visible')
  })
})
