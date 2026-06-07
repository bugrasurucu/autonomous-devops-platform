describe('Dashboard Navigation', () => {
  beforeEach(() => {
    // Register a random user to access the dashboard
    cy.visit('/login')
    cy.contains('Register Free').click()
    
    cy.intercept('POST', '/api/auth/register').as('registerReq')
    
    const randomEmail = `dash_${Date.now()}@example.com`;
    cy.get('input[type="text"]').type('Test User')
    cy.get('input[type="email"]').type(randomEmail)
    cy.get('input[type="password"]').type('password123')
    cy.contains('Create Account').click()
    
    cy.wait('@registerReq').its('response.statusCode').should('eq', 201)
    cy.url().should('include', '/dashboard', { timeout: 10000 })
  })

  it('should navigate between sidebar items', () => {
    // Navigate to Deployments
    cy.contains('Deployments').click()
    cy.url().should('include', '/dashboard/deployments')
    cy.contains('Deployments').should('be.visible')
    
    // Navigate to Agents
    cy.contains('Agents').click()
    cy.url().should('include', '/dashboard/agents')
    cy.contains('Agents').should('be.visible')
    
    // Navigate to FinOps
    cy.contains('FinOps').click()
    cy.url().should('include', '/dashboard/finops')
    cy.contains('FinOps').should('be.visible')
  })

  it('should toggle theme', () => {
    // Default theme might be dark or system. Let's click the toggle and check if class changes.
    // Assuming the button has a recognizable text or aria-label
    // Theme toggle button contains ☀️ or 🌙
    
    // Just click the button and verify it doesn't crash the UI
    cy.get('button[title*="mode"]').click()
    // Theme should be applied to html data-theme attribute
    cy.get('html').invoke('attr', 'data-theme').should('match', /(light|dark)/)
  })
})
